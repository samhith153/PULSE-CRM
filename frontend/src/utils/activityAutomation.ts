/**
 * Activity Automation Engine for Pulse CRM
 * 
 * This module provides automatic activity generation based on CRM events.
 * It replaces static activity logging with dynamic, trigger-based automation.
 */

import { Activity, RelatedRecord, getActivitiesFromStorage, saveActivitiesToStorage } from './activityDb';
import { Lead, Contact, Deal, Company } from './api';

// ============================================================================
// Automation Types & Interfaces
// ============================================================================

export type AutomationTriggerType = 
  | 'LEAD_CREATED'
  | 'LEAD_STATUS_CHANGED'
  | 'CONTACT_CREATED'
  | 'DEAL_CREATED'
  | 'DEAL_STAGE_CHANGED'
  | 'DEAL_WON'
  | 'DEAL_LOST'
  | 'COMPANY_CREATED'
  | 'EMAIL_RECEIVED'
  | 'EMAIL_SENT'
  | 'TASK_OVERDUE'
  | 'MEETING_SCHEDULED'
  | 'CALL_LOGGED';

export interface AutomationRule {
  id: string;
  name: string;
  triggerType: AutomationTriggerType;
  enabled: boolean;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdAt: string;
  updatedAt: string;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
}

export interface AutomationAction {
  type: 'CREATE_TASK' | 'CREATE_MEETING' | 'SEND_EMAIL' | 'UPDATE_FIELD' | 'NOTIFY_USER';
  config: Record<string, any>;
}

export interface AutomationContext {
  entityType: 'lead' | 'contact' | 'deal' | 'company';
  entityId: string;
  entityData: Lead | Contact | Deal | Company;
  eventType: AutomationTriggerType;
  userId: string;
  userName: string;
}

// ============================================================================
// Default Automation Rules (Production-Ready)
// ============================================================================

const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule-1',
    name: 'New Lead Follow-up Task',
    triggerType: 'LEAD_CREATED',
    enabled: true,
    conditions: [],
    actions: [{
      type: 'CREATE_TASK',
      config: {
        subject: 'Follow up with new lead: {{entityData.company_name}}',
        description: 'New lead "{{entityData.company_name}}" was created. Initial contact required within 24 hours.',
        priority: 'High',
        dueDateOffset: { days: 1 },
        assignedTo: '{{userId}}',
        reminder: '1 hour before'
      }
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rule-2',
    name: 'Deal Stage Change Notification',
    triggerType: 'DEAL_STAGE_CHANGED',
    enabled: true,
    conditions: [],
    actions: [{
      type: 'CREATE_TASK',
      config: {
        subject: 'Review deal stage change: {{entityData.name}}',
        description: 'Deal "{{entityData.name}}" moved to new stage. Review next steps and update client.',
        priority: 'Medium',
        dueDateOffset: { days: 0 },
        assignedTo: '{{userId}}',
        reminder: '30 mins before'
      }
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rule-3',
    name: 'Deal Won Celebration & Next Steps',
    triggerType: 'DEAL_WON',
    enabled: true,
    conditions: [],
    actions: [
      {
        type: 'CREATE_TASK',
        config: {
          subject: 'Onboard new client: {{entityData.company_name}}',
          description: 'Deal won! Begin client onboarding process for "{{entityData.company_name}}".',
          priority: 'Urgent',
          dueDateOffset: { days: 1 },
          assignedTo: '{{userId}}'
        }
      },
      {
        type: 'SEND_EMAIL',
        config: {
          template: 'deal_won_thank_you',
          to: '{{entityData.contact_email}}',
          subject: 'Welcome aboard - {{entityData.name}}!'
        }
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rule-4',
    name: 'Deal Lost Follow-up',
    triggerType: 'DEAL_LOST',
    enabled: true,
    conditions: [],
    actions: [{
      type: 'CREATE_TASK',
      config: {
        subject: 'Analyze lost deal: {{entityData.name}}',
        description: 'Deal "{{entityData.name}}" was lost. Document reasons and schedule follow-up in 3 months.',
        priority: 'Medium',
        dueDateOffset: { days: 2 },
        assignedTo: '{{userId}}'
      }
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rule-5',
    name: 'Task Overdue Escalation',
    triggerType: 'TASK_OVERDUE',
    enabled: true,
    conditions: [{
      field: 'priority',
      operator: 'equals',
      value: 'Urgent'
    }],
    actions: [{
      type: 'NOTIFY_USER',
      config: {
        message: 'URGENT: Task "{{task.subject}}" is overdue!',
        notificationType: 'high_priority'
      }
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rule-6',
    name: 'Contact Created Welcome Sequence',
    triggerType: 'CONTACT_CREATED',
    enabled: true,
    conditions: [],
    actions: [{
      type: 'CREATE_TASK',
      config: {
        subject: 'Send welcome email to {{entityData.full_name}}',
        description: 'New contact "{{entityData.full_name}}" from {{entityData.company_name}} added. Send introductory email.',
        priority: 'Medium',
        dueDateOffset: { days: 0 },
        assignedTo: '{{userId}}'
      }
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ============================================================================
// Storage Functions
// ============================================================================

export function getAutomationRules(): AutomationRule[] {
  if (typeof window === 'undefined') return DEFAULT_AUTOMATION_RULES;
  const saved = localStorage.getItem('pulse-crm-automation-rules');
  if (saved) {
    try {
      return JSON.parse(saved) as AutomationRule[];
    } catch {
      return DEFAULT_AUTOMATION_RULES;
    }
  }
  localStorage.setItem('pulse-crm-automation-rules', JSON.stringify(DEFAULT_AUTOMATION_RULES));
  return DEFAULT_AUTOMATION_RULES;
}

export function saveAutomationRules(rules: AutomationRule[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pulse-crm-automation-rules', JSON.stringify(rules));
  }
}

export function getAutomationLogs(): AutomationLog[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('pulse-crm-automation-logs');
  if (saved) {
    try {
      return JSON.parse(saved) as AutomationLog[];
    } catch {
      return [];
    }
  }
  return [];
}

export function saveAutomationLogs(logs: AutomationLog[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pulse-crm-automation-logs', JSON.stringify(logs.slice(-100))); // Keep last 100 logs
  }
}

// ============================================================================
// Automation Log Type
// ============================================================================

export interface AutomationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerType: AutomationTriggerType;
  entityType: string;
  entityId: string;
  status: 'success' | 'failed' | 'skipped';
  errorMessage?: string;
  actionsExecuted: string[];
  timestamp: string;
}

// ============================================================================
// Core Automation Engine
// ============================================================================

/**
 * Evaluates conditions against entity data
 */
function evaluateConditions(conditions: AutomationCondition[], entityData: any): boolean {
  if (!conditions || conditions.length === 0) return true;
  
  return conditions.every(condition => {
    const fieldValue = entityData[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return fieldValue?.includes?.(condition.value);
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      case 'is_empty':
        return !fieldValue || fieldValue === '';
      case 'is_not_empty':
        return !!fieldValue && fieldValue !== '';
      default:
        return true;
    }
  });
}

/**
 * Replaces template variables with actual values
 */
function interpolateTemplate(template: string, context: AutomationContext): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const parts = path.split('.');
    let value: any = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return match;
      }
    }
    
    return value ?? match;
  });
}

/**
 * Calculates due date based on offset configuration
 */
function calculateDueDate(offset: { days?: number; hours?: number }): string {
  const now = new Date();
  if (offset.days) now.setDate(now.getDate() + offset.days);
  if (offset.hours) now.setHours(now.getHours() + offset.hours);
  return now.toISOString();
}

/**
 * Creates an activity from automation action
 */
function createActivityFromAction(
  action: AutomationAction,
  context: AutomationContext,
  rule: AutomationRule
): Activity | null {
  if (action.type !== 'CREATE_TASK') return null;
  
  const config = action.config;
  const relatedRecord: RelatedRecord | undefined = context.entityId ? {
    id: context.entityId,
    name: (context.entityData as any).company_name || (context.entityData as any).name || (context.entityData as any).full_name,
    type: context.entityType as any
  } : undefined;
  
  return {
    id: `act-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'task',
    subject: interpolateTemplate(config.subject, context),
    status: 'Pending',
    priority: config.priority || 'Medium',
    dueDate: calculateDueDate(config.dueDateOffset || { days: 0 }),
    owner: context.userName,
    relatedRecord,
    details: {
      title: interpolateTemplate(config.subject, context),
      description: interpolateTemplate(config.description, context),
      assignedTo: context.userName,
      reminder: config.reminder || '1 hour before',
      repeat: 'None',
      automated: true,
      triggeredBy: rule.name
    },
    timeline: [{
      action: 'Created Automatically',
      time: new Date().toISOString(),
      user: 'System Automation',
      desc: `Auto-created by rule: "${rule.name}" on ${context.eventType}`
    }]
  };
}

/**
 * Main automation execution engine
 */
export async function executeAutomation(context: AutomationContext): Promise<AutomationLog[]> {
  const rules = getAutomationRules();
  const logs: AutomationLog[] = [];
  const activities = getActivitiesFromStorage();
  let activitiesModified = false;
  
  // Find matching rules for this trigger type
  const matchingRules = rules.filter(rule => 
    rule.enabled && rule.triggerType === context.eventType
  );
  
  for (const rule of matchingRules) {
    const log: AutomationLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      triggerType: context.eventType,
      entityType: context.entityType,
      entityId: context.entityId,
      status: 'skipped',
      actionsExecuted: [],
      timestamp: new Date().toISOString()
    };
    
    try {
      // Evaluate conditions
      if (!evaluateConditions(rule.conditions, context.entityData)) {
        log.status = 'skipped';
        log.errorMessage = 'Conditions not met';
        logs.push(log);
        continue;
      }
      
      // Execute actions
      for (const action of rule.actions) {
        if (action.type === 'CREATE_TASK') {
          const activity = createActivityFromAction(action, context, rule);
          if (activity) {
            activities.unshift(activity);
            activitiesModified = true;
            log.actionsExecuted.push(`Created task: "${activity.subject}"`);
          }
        } else if (action.type === 'NOTIFY_USER') {
          // In production, this would send a real notification
          log.actionsExecuted.push(`Notification queued: "${action.config.message}"`);
        } else if (action.type === 'SEND_EMAIL') {
          // In production, this would integrate with email service
          log.actionsExecuted.push(`Email queued to: "${action.config.to}"`);
        }
      }
      
      log.status = log.actionsExecuted.length > 0 ? 'success' : 'skipped';
    } catch (error) {
      log.status = 'failed';
      log.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }
    
    logs.push(log);
  }
  
  // Save activities if modified
  if (activitiesModified) {
    saveActivitiesToStorage(activities);
  }
  
  // Save automation logs
  const existingLogs = getAutomationLogs();
  saveAutomationLogs([...logs, ...existingLogs]);
  
  return logs;
}

/**
 * Checks for overdue tasks and triggers escalation automation
 */
export function checkOverdueTasks(): Promise<AutomationLog[]> {
  const activities = getActivitiesFromStorage();
  const now = new Date();
  const overdueActivities = activities.filter(a => 
    a.status !== 'Completed' && 
    a.dueDate && 
    new Date(a.dueDate) < now
  );
  
  const logs: AutomationLog[] = [];
  
  for (const activity of overdueActivities) {
    if (activity.priority === 'Urgent' && !activity.details?.automated) {
      // Trigger overdue automation
      const context: AutomationContext = {
        entityType: 'lead',
        entityId: activity.relatedRecord?.id || '',
        entityData: {} as any,
        eventType: 'TASK_OVERDUE',
        userId: 'system',
        userName: 'System'
      };
      
      // Mark as overdue in timeline
      activity.status = 'Overdue';
      activity.timeline = activity.timeline || [];
      activity.timeline.push({
        action: 'Marked Overdue',
        time: now.toISOString(),
        user: 'System Automation',
        desc: 'Task automatically marked as overdue'
      });
    }
  }
  
  if (overdueActivities.some(a => a.status === 'Overdue')) {
    saveActivitiesToStorage(activities);
  }
  
  return Promise.resolve(logs);
}

/**
 * Convenience wrappers for common automation triggers
 */

export async function onLeadCreated(lead: Lead, userId: string, userName: string): Promise<AutomationLog[]> {
  return executeAutomation({
    entityType: 'lead',
    entityId: lead.id,
    entityData: lead,
    eventType: 'LEAD_CREATED',
    userId,
    userName
  });
}

export async function onDealStageChanged(deal: Deal, userId: string, userName: string): Promise<AutomationLog[]> {
  return executeAutomation({
    entityType: 'deal',
    entityId: deal.id,
    entityData: deal,
    eventType: 'DEAL_STAGE_CHANGED',
    userId,
    userName
  });
}

export async function onDealWon(deal: Deal, userId: string, userName: string): Promise<AutomationLog[]> {
  return executeAutomation({
    entityType: 'deal',
    entityId: deal.id,
    entityData: deal,
    eventType: 'DEAL_WON',
    userId,
    userName
  });
}

export async function onDealLost(deal: Deal, userId: string, userName: string): Promise<AutomationLog[]> {
  return executeAutomation({
    entityType: 'deal',
    entityId: deal.id,
    entityData: deal,
    eventType: 'DEAL_LOST',
    userId,
    userName
  });
}

export async function onContactCreated(contact: Contact, userId: string, userName: string): Promise<AutomationLog[]> {
  return executeAutomation({
    entityType: 'contact',
    entityId: contact.id,
    entityData: contact,
    eventType: 'CONTACT_CREATED',
    userId,
    userName
  });
}

/**
 * Initialize automation system - runs periodic checks
 */
export function initializeAutomation(): void {
  if (typeof window === 'undefined') return;
  
  // Check for overdue tasks every 5 minutes
  const intervalId = setInterval(() => {
    checkOverdueTasks();
  }, 5 * 60 * 1000);
  
  // Store interval ID for cleanup
  (window as any).__PULSE_AUTOMATION_INTERVAL__ = intervalId;
  
  // Run initial check
  checkOverdueTasks();
}

/**
 * Cleanup automation system
 */
export function cleanupAutomation(): void {
  if (typeof window !== 'undefined' && (window as any).__PULSE_AUTOMATION_INTERVAL__) {
    clearInterval((window as any).__PULSE_AUTOMATION_INTERVAL__);
    delete (window as any).__PULSE_AUTOMATION_INTERVAL__;
  }
}
