/**
 * Platform feature definitions consumed by the marketing-style platform
 * components (PlatformHero, PlatformCapabilities, PlatformCTA).
 *
 * Each entry drives a full landing section: hero headline/description,
 * the capability grid, a UI preview, and the closing CTA.
 */

export interface PlatformAction {
  text: string;
  href: string;
}

export interface PlatformCapability {
  /** Key into the icon map in PlatformCapabilities (e.g. 'Target', 'Users'). */
  icon: string;
  title: string;
  description: string;
}

export type PlatformPreviewType =
  | 'leads'
  | 'contacts'
  | 'companies'
  | 'pipeline'
  | 'deals'
  | 'tasks';

export interface PlatformFeature {
  eyebrow: string;
  title: string;
  description: string;
  capabilities: PlatformCapability[];
  previewType: PlatformPreviewType;
  primaryAction: PlatformAction;
  secondaryAction: PlatformAction;
  ctaTitle: string;
  ctaDescription: string;
}

export const platformFeatures: PlatformFeature[] = [
  {
    eyebrow: 'LEAD MANAGEMENT',
    title: 'Capture, score, and convert every lead',
    description:
      'Track every prospect from first touch to closed deal with intelligent lead scoring, activity history, and automated follow-up nudges.',
    capabilities: [
      {
        icon: 'Target',
        title: 'Smart lead scoring',
        description:
          'AI-weighted scores surface your hottest prospects so reps always know who to call next.',
      },
      {
        icon: 'UserCheck',
        title: 'Automatic assignment',
        description:
          'Round-robin and rules-based routing put every lead in the right owner\u2019s hands instantly.',
      },
      {
        icon: 'Activity',
        title: 'Real-time activity feed',
        description:
          'Every email, call, and note attached to the lead automatically, so context is never lost.',
      },
    ],
    previewType: 'leads',
    primaryAction: { text: 'Start Free Trial', href: '/signup' },
    secondaryAction: { text: 'Learn More', href: '/signup' },
    ctaTitle: 'Ready to close more deals?',
    ctaDescription:
      'Join teams that use Pulse CRM to turn their pipeline into predictable revenue.',
  },
  {
    eyebrow: 'CONTACT MANAGEMENT',
    title: 'Your entire network, organized',
    description:
      'Keep every contact, conversation, and company relationship in one searchable place your whole team can rely on.',
    capabilities: [
      {
        icon: 'Users',
        title: 'Unified contact profiles',
        description:
          'All emails, calls, and notes roll up into a single timeline per contact.',
      },
      {
        icon: 'Database',
        title: 'Deduplication built in',
        description:
          'Duplicate detection merges repeat records before they clutter your lists.',
      },
      {
        icon: 'CheckSquare',
        title: 'Segments & lists',
        description:
          'Save dynamic segments that update automatically as your data changes.',
      },
    ],
    previewType: 'contacts',
    primaryAction: { text: 'Start Free Trial', href: '/signup' },
    secondaryAction: { text: 'Learn More', href: '/signup' },
    ctaTitle: 'Stop losing track of relationships',
    ctaDescription:
      'Bring your contacts, conversations, and follow-ups together with Pulse CRM.',
  },
  {
    eyebrow: 'COMPANY MANAGEMENT',
    title: 'See the full account picture',
    description:
      'Organize accounts, hierarchies, and relationships so your team sells to companies, not just individuals.',
    capabilities: [
      {
        icon: 'Building2',
        title: 'Account hierarchies',
        description:
          'Map parent and child companies to understand the full buying structure.',
      },
      {
        icon: 'Briefcase',
        title: 'Linked opportunities',
        description:
          'Every deal, contact, and activity ties back to the account automatically.',
      },
      {
        icon: 'BarChart3',
        title: 'Account health scores',
        description:
          'Usage and engagement signals flag at-risk accounts before they churn.',
      },
    ],
    previewType: 'companies',
    primaryAction: { text: 'Start Free Trial', href: '/signup' },
    secondaryAction: { text: 'Learn More', href: '/signup' },
    ctaTitle: 'Sell to accounts, not contacts',
    ctaDescription:
      'Pulse CRM gives you the full company context your team needs to win.',
  },
  {
    eyebrow: 'SALES PIPELINE',
    title: 'A pipeline that runs itself',
    description:
      'Visualize every stage, drag deals forward, and let automation keep follow-ups moving without manual effort.',
    capabilities: [
      {
        icon: 'TrendingUp',
        title: 'Drag-and-drop stages',
        description:
          'Move deals through your pipeline with a glance and a click.',
      },
      {
        icon: 'Activity',
        title: 'Activity-driven coaching',
        description:
          'Spot stalled deals early with engagement indicators on every card.',
      },
      {
        icon: 'Target',
        title: 'Forecast accuracy',
        description:
          'Weighted forecasts show what is real vs. what is likely to slip.',
      },
    ],
    previewType: 'pipeline',
    primaryAction: { text: 'Start Free Trial', href: '/signup' },
    secondaryAction: { text: 'Learn More', href: '/signup' },
    ctaTitle: 'See your pipeline at a glance',
    ctaDescription:
      'Track, move, and close deals faster with Pulse CRM\u2019s visual pipeline.',
  },
  {
    eyebrow: 'DEAL MANAGEMENT',
    title: 'Close bigger deals, faster',
    description:
      'Centralize every opportunity with clear stages, next steps, and revenue visibility for the whole team.',
    capabilities: [
      {
        icon: 'Briefcase',
        title: 'Revenue visibility',
        description:
          'Live deal values and weighted forecasts roll up to the dashboard.',
      },
      {
        icon: 'CheckSquare',
        title: 'Guided next steps',
        description:
          'Each deal carries its next action so nothing falls through the cracks.',
      },
      {
        icon: 'Users',
        title: 'Team collaboration',
        description:
          'Mention teammates, attach files, and keep deal context in one place.',
      },
    ],
    previewType: 'deals',
    primaryAction: { text: 'Start Free Trial', href: '/signup' },
    secondaryAction: { text: 'Learn More', href: '/signup' },
    ctaTitle: 'Win more deals with less effort',
    ctaDescription:
      'Give your reps a single source of truth for every opportunity.',
  },
  {
    eyebrow: 'TASKS & FOLLOW-UPS',
    title: 'Never miss a follow-up again',
    description:
      'Turn every conversation into an action with smart task suggestions, reminders, and a schedule that plans itself.',
    capabilities: [
      {
        icon: 'CheckSquare',
        title: 'AI task suggestions',
        description:
          'Workflows recommend the next best action for each lead automatically.',
      },
      {
        icon: 'Activity',
        title: 'Overdue tracking',
        description:
          'Know exactly what is slipping and who owns it across your team.',
      },
      {
        icon: 'TrendingUp',
        title: 'Completion analytics',
        description:
          'Measure follow-up velocity and its impact on win rates.',
      },
    ],
    previewType: 'tasks',
    primaryAction: { text: 'Start Free Trial', href: '/signup' },
    secondaryAction: { text: 'Learn More', href: '/signup' },
    ctaTitle: 'Turn conversations into closed deals',
    ctaDescription:
      'Let Pulse CRM plan the follow-ups while you focus on selling.',
  },
];
