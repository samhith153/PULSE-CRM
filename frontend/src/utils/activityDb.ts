export interface RelatedRecord {
  id: string;
  name: string;
  type: 'lead' | 'contact' | 'company' | 'deal';
}

export interface Activity {
  id: string;
  type: 'task' | 'call' | 'meeting' | 'email' | 'note';
  subject: string;
  status: string; // colored badges
  priority: string; // colored badges
  dueDate: string; // Date & Time string
  owner: string;
  relatedRecord?: RelatedRecord;
  details: {
    // Task
    title?: string;
    description?: string;
    assignedTo?: string;
    reminder?: string;
    repeat?: string;
    attachments?: string[];
    
    // Call
    contactName?: string;
    phoneNumber?: string;
    callType?: string;
    duration?: string;
    outcome?: string;
    notes?: string;
    recording?: string;
    nextFollowUp?: string;

    // Meeting
    agenda?: string;
    participants?: string[];
    date?: string;
    time?: string;
    location?: string;
    meetingUrl?: string;

    // Email
    from?: string;
    to?: string;
    sentTime?: string;
    thread?: string;
    isRead?: boolean;

    // Note
    body?: string;
  };
  timeline?: {
    action: string;
    time: string;
    user: string;
    desc: string;
  }[];
}

const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    type: 'task',
    subject: 'Follow up on Cloud SaaS contract proposal',
    status: 'Pending',
    priority: 'Urgent',
    dueDate: new Date().toISOString().slice(0, 10) + 'T14:30:00Z',
    owner: 'Sarah Johnson',
    relatedRecord: { id: 'lead-1', name: 'Acme Corp Cloud Migration', type: 'lead' },
    details: {
      title: 'Follow up on Cloud SaaS contract proposal',
      description: 'Call Marcus to review security annex and get signing deadline.',
      assignedTo: 'Sarah Johnson',
      reminder: '15 mins before',
      repeat: 'None',
      attachments: []
    },
    timeline: [
      { action: 'Created', time: '2026-08-04T10:00:00Z', user: 'System', desc: 'Task created automatically on lead intake.' },
      { action: 'Assigned', time: '2026-08-04T10:05:00Z', user: 'Sarah Johnson', desc: 'Assigned to Sarah Johnson.' }
    ]
  },
  {
    id: 'act-2',
    type: 'meeting',
    subject: 'Security & Compliance Review Panel',
    status: 'Scheduled',
    priority: 'High',
    dueDate: new Date().toISOString().slice(0, 10) + 'T10:00:00Z',
    owner: 'Sarah Johnson',
    relatedRecord: { id: 'deal-2', name: 'Enterprise SSO Rollout', type: 'deal' },
    details: {
      title: 'Security & Compliance Review Panel',
      agenda: 'Present SOC2 report and get agreement on data isolation.',
      participants: ['Sarah Johnson', 'Alex Rivera', 'Marcus Aurelius'],
      date: new Date().toISOString().slice(0, 10),
      time: '10:00 AM',
      location: 'https://zoom.us/j/9928172615',
      meetingUrl: 'https://zoom.us/j/9928172615',
      reminder: '30 mins before',
      notes: 'Prepare slide deck on tenant partition architecture.'
    },
    timeline: [
      { action: 'Created', time: '2026-08-03T14:20:00Z', user: 'Alex Rivera', desc: 'Meeting scheduled with clients.' }
    ]
  },
  {
    id: 'act-3',
    type: 'call',
    subject: 'Outbound Discovery: Helena Troy',
    status: 'Completed',
    priority: 'Medium',
    dueDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    owner: 'Sarah Johnson',
    relatedRecord: { id: 'contact-3', name: 'Helena Troy', type: 'contact' },
    details: {
      contactName: 'Helena Troy',
      phoneNumber: '+91 98765 43210',
      callType: 'Outbound',
      duration: '15 mins',
      outcome: 'Connected',
      notes: 'Helena is interested in SSO custom login options. She requested a brochure.',
      recording: 'https://pulse-crm-recordings/calls/rec-992.mp3',
      nextFollowUp: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
    },
    timeline: [
      { action: 'Created', time: '2026-08-04T12:00:00Z', user: 'Sarah Johnson', desc: 'Call logged manually.' },
      { action: 'Outcome Set', time: '2026-08-04T12:15:00Z', user: 'Sarah Johnson', desc: 'Call marked as Connected.' }
    ]
  },
  {
    id: 'act-4',
    type: 'task',
    subject: 'Send custom security SLA draft',
    status: 'Overdue',
    priority: 'High',
    dueDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    owner: 'Sarah Johnson',
    relatedRecord: { id: 'lead-4', name: 'Apex Dynamics CRM Migration', type: 'lead' },
    details: {
      title: 'Send custom security SLA draft',
      description: 'Incorporate 99.99% availability language into SLA.',
      assignedTo: 'Sarah Johnson',
      reminder: '1 hour before',
      repeat: 'None',
      attachments: []
    },
    timeline: [
      { action: 'Created', time: '2026-08-01T09:00:00Z', user: 'Sarah Johnson', desc: 'Task created manually.' },
      { action: 'Overdue', time: '2026-08-04T00:00:00Z', user: 'System', desc: 'Due date passed without completion.' }
    ]
  },
  {
    id: 'act-5',
    type: 'email',
    subject: 'Re: SSO integration question',
    status: 'Completed',
    priority: 'Low',
    dueDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    owner: 'Sarah Johnson',
    relatedRecord: { id: 'contact-3', name: 'Helena Troy', type: 'contact' },
    details: {
      from: 'helena.troy@techcorp.com',
      to: 'sarah.johnson@pulsecrm.com',
      sentTime: '2 hours ago',
      thread: 'SSO configuration queries',
      isRead: true,
      notes: 'We need to know if you support SAML 2.0 out-of-the-box or if we need a custom plugin.'
    },
    timeline: [
      { action: 'Received', time: '2026-08-05T05:00:00Z', user: 'System', desc: 'Email synchronized automatically.' }
    ]
  },
  {
    id: 'act-6',
    type: 'note',
    subject: 'Meeting follow-up summary notes',
    status: 'Completed',
    priority: 'Medium',
    dueDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    owner: 'Sarah Johnson',
    relatedRecord: { id: 'lead-1', name: 'Acme Corp Cloud Migration', type: 'lead' },
    details: {
      body: 'Clients seem slightly skeptical about migration downtime. We should emphasize our blue-green deployment strategy during the next call.'
    },
    timeline: [
      { action: 'Created', time: '2026-08-04T16:00:00Z', user: 'Sarah Johnson', desc: 'Internal note added.' }
    ]
  },
  {
    id: 'act-7',
    type: 'call',
    subject: 'Inbound follow-up call with Alex',
    status: 'Pending',
    priority: 'Urgent',
    dueDate: new Date(Date.now() + 3600000 * 4).toISOString(),
    owner: 'Sarah Johnson',
    relatedRecord: { id: 'contact-2', name: 'Alex Rivera', type: 'contact' },
    details: {
      contactName: 'Alex Rivera',
      phoneNumber: '+91 91122 33445',
      callType: 'Inbound',
      duration: '10 mins',
      outcome: 'Call Back Later',
      notes: 'Scheduled quick alignment call to discuss contract signature barriers.'
    },
    timeline: [
      { action: 'Created', time: '2026-08-05T01:00:00Z', user: 'Sarah Johnson', desc: 'Call scheduled.' }
    ]
  },
  {
    id: 'act-8',
    type: 'email',
    subject: 'Contract signature links sent',
    status: 'Completed',
    priority: 'High',
    dueDate: new Date(Date.now() - 3600000 * 8).toISOString(),
    owner: 'Sarah Johnson',
    relatedRecord: { id: 'deal-2', name: 'Enterprise SSO Rollout', type: 'deal' },
    details: {
      from: 'sarah.johnson@pulsecrm.com',
      to: 'helena.troy@techcorp.com',
      sentTime: '8 hours ago',
      thread: 'SSO configuration queries',
      isRead: true,
      notes: 'Here are the DocuSign links for the custom SLA. Let me know when they are signed!'
    },
    timeline: [
      { action: 'Sent', time: '2026-08-04T22:00:00Z', user: 'Sarah Johnson', desc: 'Email dispatched through integrated Gmail connection.' }
    ]
  }
];

export function getActivitiesFromStorage(): Activity[] {
  if (typeof window === 'undefined') return DEFAULT_ACTIVITIES;
  const saved = localStorage.getItem('pulse-crm-activities');
  if (saved) {
    try {
      return JSON.parse(saved) as Activity[];
    } catch {
      return DEFAULT_ACTIVITIES;
    }
  } else {
    localStorage.setItem('pulse-crm-activities', JSON.stringify(DEFAULT_ACTIVITIES));
    return DEFAULT_ACTIVITIES;
  }
}

export function saveActivitiesToStorage(activities: Activity[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pulse-crm-activities', JSON.stringify(activities));
  }
}

export function seedActivities(): Activity[] {
  saveActivitiesToStorage(DEFAULT_ACTIVITIES);
  return DEFAULT_ACTIVITIES;
}
