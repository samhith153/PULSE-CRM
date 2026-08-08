'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  UserRound,
  Zap,
  ChevronRight,
} from 'lucide-react';

import {
  getLeads,
  getLeadWorkflow,
  completeWorkflowTask,
  getCrmActivities,
  createCrmTask,
  type Lead,
  type WorkflowTaskItem,
} from '@/utils/api';

import {
  getActivitiesFromStorage,
  saveActivitiesToStorage,
  type Activity,
} from '@/utils/activityDb';

interface WorkflowsViewProps {
  onLoaded?: () => void;
}

function formatDueDate(value?: string | null): string {
  if (!value) return 'No deadline';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No deadline';

  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value?: string | null): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function priorityClass(priority?: string | null): string {
  switch ((priority || '').toLowerCase()) {
    case 'critical':
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'high':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    case 'medium':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    default:
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  }
}

function statusClass(status?: string | null): string {
  switch ((status || '').toLowerCase()) {
    case 'completed':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'superseded':
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    case 'in_progress':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    default:
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  }
}

function actionIcon(action?: string | null) {
  const value = (action || '').toLowerCase();

  if (value.includes('email') || value.includes('mail')) {
    return <Mail className="h-4 w-4" />;
  }

  if (
    value.includes('research') ||
    value.includes('review') ||
    value.includes('prospect')
  ) {
    return <UserRound className="h-4 w-4" />;
  }

  return <Zap className="h-4 w-4" />;
}

function displayLeadName(lead: Lead): string {
  return (
    lead.title ||
    lead.contact_name ||
    lead.company_name ||
    lead.contact_email ||
    'Unnamed Lead'
  );
}
function toActivityStatus(status?: string | null): string {
  switch ((status || '').toLowerCase()) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'overdue':
      return 'Overdue';
    default:
      return 'Pending';
  }
}

function toActivityPriority(priority?: string | null): string {
  switch ((priority || '').toLowerCase()) {
    case 'urgent':
      return 'Urgent';
    case 'high':
      return 'High';
    case 'low':
      return 'Low';
    default:
      return 'Medium';
  }
}

function crmTaskToLocalActivity(
  task: any,
  lead: Lead,
): Activity {
  const description =
    task.description ||
    task.details?.description ||
    '';

  return {
    id: String(task.id),

    type: 'task',

    subject: task.subject || 'AI Recommended Task',

    status: toActivityStatus(task.status),

    priority: toActivityPriority(task.priority),

    dueDate:
      task.due_date ||
      task.due_at ||
      new Date().toISOString(),

    owner:
      task.owner_name ||
      lead.owner_name ||
      'System',

    relatedRecord: {
      id: lead.id,
      name: displayLeadName(lead),
      type: 'lead',
    },

    details: {
      title: task.subject || 'AI Recommended Task',
      description,
      assignedTo:
        task.owner_name ||
        lead.owner_name ||
        'System',
      reminder: '15 mins before',
      repeat: 'None',
      attachments: [],
    },

    timeline: [
      {
        action: 'Created',
        time:
          task.created_at ||
          new Date().toISOString(),
        user:
          task.owner_name ||
          'System',
        desc:
          'Task created automatically from an AI workflow recommendation.',
      },
    ],
  };
}
export default function WorkflowsView({
  onLoaded,
}: WorkflowsViewProps = {}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const [workflow, setWorkflow] = useState<{
    current_task: WorkflowTaskItem | null;
    history: WorkflowTaskItem[];
  }>({
    current_task: null,
    history: [],
  });

  const [recommendation, setRecommendation] =
    useState<LeadRecommendation | null>(null);

  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * IMPORTANT:
   * No polling / setInterval here.
   *
   * The old workflow page was refreshing automatically every few seconds,
   * which caused the selected lead/page state to jump around.
   */
  const loadLeads = useCallback(async () => {
    try {
      setLoadingLeads(true);
      setError(null);

      const result = await getLeads();
      const nextLeads = Array.isArray(result) ? result : [];

      setLeads(nextLeads);

      setSelectedLeadId((previous) => {
        if (
          previous &&
          nextLeads.some((lead) => lead.id === previous)
        ) {
          return previous;
        }

        return nextLeads[0]?.id ?? null;
      });

      onLoaded?.();
    } catch (err) {
      console.error('Failed to load workflow leads:', err);
      setError('Unable to load leads. Please log in again if your session expired.');
    } finally {
      setLoadingLeads(false);
    }
  }, [onLoaded]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const selectedLead = useMemo(
    () =>
      leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  const syncWorkflowTaskToActivity = useCallback(
  async (
    task: WorkflowTaskItem | null,
    lead: Lead | null,
  ) => {
    if (!task || !lead) return;

    /*
     * Only pending/current workflow actions should
     * become Activities.
     */
    if (
      task.status === 'completed' ||
      task.status === 'superseded'
    ) {
      return;
    }

    const marker = `[AI_WORKFLOW_TASK:${task.id}]`;

    try {
      /*
       * 1. Check the local activity cache first.
       * This prevents duplicate creation during the
       * same browser session.
       */
      const localActivities =
        getActivitiesFromStorage();

      const localExists = localActivities.some(
        (activity) =>
          activity.type === 'task' &&
          activity.details?.description?.includes(marker)
      );

      if (localExists) {
        return;
      }

      /*
       * 2. Check the real backend.
       *
       * This protects us even if the Workflow page
       * is opened again or the browser is refreshed.
       */
      const existing =
        await getCrmActivities({
          view: 'task',
          search: marker,
          page: 1,
          page_size: 100,
        });

      if (
        existing?.data &&
        existing.data.length > 0
      ) {
        /*
         * Task already exists in the database.
         * Sync it into local Activities so the
         * existing Activities UI can display it.
         */
        const existingTask = existing.data[0];

        const syncedActivity =
          crmTaskToLocalActivity(
            existingTask,
            lead,
          );

        const current =
          getActivitiesFromStorage();

        if (
          !current.some(
            (activity) =>
              activity.id === syncedActivity.id
          )
        ) {
          saveActivitiesToStorage([
            syncedActivity,
            ...current,
          ]);

          window.dispatchEvent(
            new CustomEvent(
              'pulse-crm-activity-created'
            )
          );
        }

        return;
      }

      /*
       * 3. Create the actual CRM task.
       */
      const createdTask =
        await createCrmTask({
          subject: task.action_type,

          description: [
            task.reasoning ||
              'AI recommended this action for the lead.',
            '',
            marker,
          ].join('\n'),

          due_date: task.due_at,

          priority:
            (task.priority || 'medium').toLowerCase(),

          status:
            (task.status || 'pending').toLowerCase(),

          related_entity_type: 'lead',

          related_lead_id: lead.id,
        });

      /*
       * 4. Convert the backend task into the
       * existing Activities page format.
       */
      const activity =
        crmTaskToLocalActivity(
          createdTask,
          lead,
        );

      const latestActivities =
        getActivitiesFromStorage();

      /*
       * Final duplicate protection.
       */
      if (
        latestActivities.some(
          (item) => item.id === activity.id
        )
      ) {
        return;
      }

      saveActivitiesToStorage([
        activity,
        ...latestActivities,
      ]);

      /*
       * Tell ActivitiesView to refresh immediately
       * if it is currently mounted.
       */
      window.dispatchEvent(
        new CustomEvent(
          'pulse-crm-activity-created'
        )
      );

      console.log(
        '[Workflow → Activity] Created task:',
        activity.subject
      );
    } catch (error) {
      /*
       * Activity creation should NOT break the
       * Workflow page itself.
       */
      console.error(
        '[Workflow → Activity] Failed to create activity:',
        error
      );
    }
  },
  []
);

  /*
   * Load only the selected lead's workflow.
   * Changing another CRM lead does not cause this component to poll/reload.
   */
const loadSelectedLead = useCallback(async (leadId: string) => {
  try {
    setLoadingWorkflow(true);
    setError(null);

    const workflowResult = await getLeadWorkflow(leadId);

    setWorkflow({
      current_task: workflowResult.current_task,
      history: workflowResult.history,
    });
  } catch (err) {
    console.error('Failed to load lead workflow:', err);

    setWorkflow({
      current_task: null,
      history: [],
    });

    setError(
      err instanceof Error
        ? err.message
        : 'Unable to load this lead workflow.'
    );
  } finally {
    setLoadingWorkflow(false);
  }
}, []);

  useEffect(() => {
    if (!selectedLeadId) {
      setWorkflow({
        current_task: null,
        history: [],
      });
      setRecommendation(null);
      return;
    }

    void loadSelectedLead(selectedLeadId);
  }, [selectedLeadId, loadSelectedLead]);

  useEffect(() => {
  if (!selectedLead || !workflow.current_task) {
    return;
  }

  void syncWorkflowTaskToActivity(
    workflow.current_task,
    selectedLead,
  );
}, [
  selectedLead,
  workflow.current_task,
  syncWorkflowTaskToActivity,
]);

  const handleRefresh = async () => {
    if (!selectedLeadId) return;

    try {
      setRefreshing(true);

      /*
       * Refresh only this lead.
       * Do not reload the whole lead list.
       */
      await loadSelectedLead(selectedLeadId);
    } finally {
      setRefreshing(false);
    }
  };

const handleComplete = async () => {
  const task = workflow.current_task;
  const leadId = selectedLead?.id;

  if (!task) return;

  if (!leadId) {
    toast.error('Unable to identify the selected lead.');
    return;
  }

  try {
    setCompleting(true);

    // Complete the current workflow task
    await completeWorkflowTask(task.id);

    // Immediately update the UI so the completed task moves to history
    setWorkflow((prev) => ({
      current_task: null,
      history: [
        ...prev.history.filter((item) => item.id !== task.id),
        {
          ...task,
          status: 'completed',
          completed_at: new Date().toISOString(),
        },
      ],
    }));

    // Re-fetch using the stable lead UUID.
    // Do NOT rely on a possibly changed selectedLead state.
    const updatedWorkflow = await getLeadWorkflow(leadId);

    setWorkflow({
      current_task: updatedWorkflow.current_task,
      history: updatedWorkflow.history,
    });
  } catch (error) {
    console.error('Failed to complete workflow task:', error);
    toast.error('Unable to complete the workflow task.');
  } finally {
    setCompleting(false);
  }
};
  /*
   * PERSONALIZED WORKFLOW STRUCTURE
   *
   * There are NO fixed CRM stages here.
   *
   * Each lead gets:
   *   1. Lead created
   *   2. AI assessment
   *   3. Historical AI actions for that lead
   *   4. Current AI action
   *   5. Next AI decision
   *
   * The actual action names come from the backend recommendation.
   */
  const workflowSteps = useMemo(() => {
    const steps: Array<{
      id: string;
      label: string;
      description: string;
      status: 'done' | 'active' | 'upcoming';
      action?: string;
    }> = [];

    if (!selectedLead) return steps;

    steps.push({
      id: 'lead-created',
      label: 'Lead created',
      description: `Lead entered the CRM on ${formatDate(
        selectedLead.created_at
      ) || 'the recorded creation date'}.`,
      status: 'done',
    });

    steps.push({
      id: 'ai-assessment',
      label: 'AI assessment',
      description:
        'AI evaluates fit, engagement, CRM stage, activity and previous signals.',
      status:
        selectedLead.score !== null &&
        selectedLead.score !== undefined
          ? 'done'
          : 'active',
    });

    /*
     * History is completely lead-specific.
     * No hardcoded "Contacted / Qualified / Proposal / Negotiation" stages.
     */
    const history = [...workflow.history].reverse();

    history.forEach((task, index) => {
      steps.push({
        id: `history-${task.id}`,
        label: task.action_type,
        description:
          task.reasoning ||
          `AI workflow action ${index + 1} for this lead.`,
        status: 'done',
        action: task.action_type,
      });
    });

    if (workflow.current_task) {
      steps.push({
        id: `current-${workflow.current_task.id}`,
        label: workflow.current_task.action_type,
        description:
          workflow.current_task.reasoning ||
          'AI recommended this as the next best action.',
        status: 'active',
        action: workflow.current_task.action_type,
      });
    } else {
      steps.push({
        id: 'next-decision',
        label: 'AI next-action decision',
        description:
          'The workflow is waiting for the next lead event or reassessment.',
        status: 'upcoming',
      });
    }

    return steps;
  }, [selectedLead, workflow.history, workflow.current_task]);

  if (loadingLeads) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading AI workflows...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-purple" />
            <h2 className="text-2xl font-bold text-foreground">
              AI Workflow
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            A personalized next-action plan generated independently for each
            lead.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || !selectedLeadId}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? 'animate-spin' : ''
            }`}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* LEADS */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-bold text-foreground">
              Leads
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Select a lead to view its unique workflow.
            </p>
          </div>

          <div className="max-h-[650px] overflow-y-auto p-2">
            {leads.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No leads found.
              </div>
            ) : (
              leads.map((lead) => {
                const active = lead.id === selectedLeadId;

                return (
                  <button
                    type="button"
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`mb-1 w-full rounded-xl p-3 text-left transition ${
                      active
                        ? 'bg-brand-purple/10 ring-1 ring-brand-purple/30'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="truncate text-sm font-semibold text-foreground">
                      {displayLeadName(lead)}
                    </div>

                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {lead.company_name ||
                        lead.contact_email ||
                        'No company'}
                    </div>

                    {lead.score !== null &&
                      lead.score !== undefined && (
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          AI Score:{' '}
                          <strong>{lead.score}</strong>
                        </div>
                      )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* SELECTED LEAD WORKFLOW */}
        <div className="min-w-0">
          {loadingWorkflow ? (
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-24 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading personalized workflow...
            </div>
          ) : !selectedLead ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Select a lead.
            </div>
          ) : (
            <div className="space-y-5">
              {/* LEAD HEADER */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Personalized workflow for
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-foreground">
                      {displayLeadName(selectedLead)}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedLead.company_name ||
                        selectedLead.contact_email ||
                        'CRM lead'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-muted px-5 py-3 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      AI Score
                    </div>

                    <div className="mt-1 text-3xl font-bold text-foreground">
                      {selectedLead.score ?? '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* PERSONALIZED STRUCTURE */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-5 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-purple" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Personalized Workflow Structure
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      This sequence is generated from this lead's actual AI
                      actions and history. It is not a fixed sales pipeline.
                    </p>
                  </div>
                </div>

                <div className="relative space-y-3">
                  {workflowSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className="relative flex gap-3"
                    >
                      {index < workflowSteps.length - 1 && (
                        <span className="absolute left-[13px] top-8 h-[calc(100%+12px)] w-px bg-border" />
                      )}

                      <div
                        className={`relative z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          step.status === 'done'
                            ? 'border-green-500/30 bg-green-500/10 text-green-600'
                            : step.status === 'active'
                            ? 'border-brand-purple/30 bg-brand-purple/10 text-brand-purple'
                            : 'border-border bg-muted text-muted-foreground'
                        }`}
                      >
                        {step.status === 'done' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : step.status === 'active' ? (
                          <Zap className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>

                      <div
                        className={`min-w-0 flex-1 rounded-xl border p-3 ${
                          step.status === 'active'
                            ? 'border-brand-purple/30 bg-brand-purple/5'
                            : 'border-border bg-card'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {step.label}
                          </p>

                          {step.status === 'active' && (
                            <span className="rounded-full bg-brand-purple/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-purple">
                              Current
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CURRENT AI ACTION */}
              <div className="rounded-2xl border border-brand-purple/20 bg-gradient-to-br from-brand-purple/5 to-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-purple" />
                  <h3 className="text-sm font-bold text-foreground">
                    AI Recommended Next Action
                  </h3>
                </div>

                {workflow.current_task ? (
                  <div>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-3">
                        <div className="mt-0.5 rounded-lg bg-brand-purple/10 p-2 text-brand-purple">
                          {actionIcon(
                            workflow.current_task.action_type
                          )}
                        </div>

                        <div>
                          <h4 className="text-lg font-bold text-foreground">
                            {workflow.current_task.action_type}
                          </h4>

                          {workflow.current_task.reasoning && (
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                              {workflow.current_task.reasoning}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${priorityClass(
                          workflow.current_task.priority
                        )}`}
                      >
                        {workflow.current_task.priority || 'medium'}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        Due{' '}
                        <strong className="text-foreground">
                          {formatDueDate(
                            workflow.current_task.due_at
                          )}
                        </strong>
                      </div>

                      {workflow.current_task.current_stage && (
                        <div className="text-xs text-muted-foreground">
                          Current CRM stage:{' '}
                          <strong className="text-foreground">
                            {workflow.current_task.current_stage}
                          </strong>
                        </div>
                      )}
                    </div>

                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={handleComplete}
                        disabled={completing}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-purple/90 disabled:opacity-50"
                      >
                        {completing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}

                        {completing
                          ? 'Updating workflow...'
                          : 'Mark action completed'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-muted/50 p-6 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />

                    <p className="mt-2 text-sm font-semibold text-foreground">
                      No active AI action
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      The AI currently does not have a pending action for
                      this lead.
                    </p>
                  </div>
                )}
              </div>

{/* WHY THIS ACTION */}
{recommendation && (
  <div className="rounded-2xl border border-border bg-card p-5">
    <div className="flex items-center gap-2">
      <Zap className="h-4 w-4 text-brand-purple" />

      <h3 className="text-sm font-bold text-foreground">
        AI Recommended Next Action
      </h3>
    </div>

    {workflow.current_task ? (
      <div className="mt-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <div className="mt-0.5 rounded-lg bg-brand-purple/10 p-2 text-brand-purple">
              <Zap className="h-4 w-4" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-foreground">
                {workflow.current_task.action_type}
              </h4>

              {workflow.current_task.reasoning && (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {workflow.current_task.reasoning}
                </p>
              )}
            </div>
          </div>

          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase text-amber-600">
            {workflow.current_task.priority || 'medium'}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />

            Due{' '}
            <strong className="text-foreground">
              {new Date(
                workflow.current_task.due_at
              ).toLocaleString([], {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </strong>
          </div>

          {workflow.current_task.current_stage && (
            <div className="text-xs text-muted-foreground">
              Current CRM stage:{' '}
              <strong className="text-foreground">
                {workflow.current_task.current_stage}
              </strong>
            </div>
          )}
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={handleComplete}
            disabled={completing}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-purple/90 disabled:opacity-50"
          >
            {completing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}

            {completing
              ? 'Updating workflow...'
              : 'Mark action completed'}
          </button>
        </div>
      </div>
    ) : (
      <div className="mt-4 rounded-xl bg-muted/50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />

        <p className="mt-2 text-sm font-semibold text-foreground">
          No active AI action
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          The AI currently does not have a pending action for this lead.
        </p>
      </div>
    )}
  </div>
)}

{/* HISTORY */}
<div className="mt-5 rounded-2xl border border-border bg-card p-5">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-sm font-bold text-foreground">
        Workflow history
      </h3>

      <p className="mt-1 text-xs text-muted-foreground">
        Previous AI actions for this lead.
      </p>
    </div>

    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      {workflow.history.length}
    </span>
  </div>

  {workflow.history.length === 0 ? (
    <div className="mt-5 rounded-xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">
      No previous workflow actions.
    </div>
  ) : (
    <div className="mt-5 space-y-3">
      {workflow.history.map((task) => (
        <div
          key={task.id}
          className="flex gap-3 rounded-xl border border-border p-3"
        >
          <div className="mt-0.5 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {task.action_type}
              </span>

              <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                {task.status}
              </span>
            </div>

            {task.reasoning && (
              <p className="mt-1 text-xs text-muted-foreground">
                {task.reasoning}
              </p>
            )}

            {task.current_stage && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Stage: {task.current_stage}
              </p>
            )}

            {task.completed_at && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Completed:{' '}
                {new Date(task.completed_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

