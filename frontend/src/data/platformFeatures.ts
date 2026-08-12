export interface PlatformFeature {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: {
    text: string;
    href: string;
  };
  secondaryAction: {
    text: string;
    href: string;
  };
  capabilities: Array<{
    icon: string; // Changed to string
    title: string;
    description: string;
  }>;
  previewType: 'leads' | 'contacts' | 'companies' | 'pipeline' | 'deals' | 'tasks';
  ctaTitle: string;
  ctaDescription: string;
}

export const platformFeatures: Record<string, PlatformFeature> = {
  'lead-management': {
    slug: 'lead-management',
    eyebrow: 'LEAD MANAGEMENT',
    title: 'Turn every lead into an opportunity',
    description: 'Capture, qualify, and manage your leads from one organized Pulse CRM workspace.',
    primaryAction: {
      text: 'Get Started',
      href: '/signup'
    },
    secondaryAction: {
      text: 'Learn More',
      href: '#capabilities'
    },
    capabilities: [
      {
        icon: 'Target',
        title: 'Capture',
        description: 'Bring new leads into one organized workspace and keep important information easy to access.'
      },
      {
        icon: 'UserCheck',
        title: 'Qualify',
        description: 'Identify high-value opportunities and focus your team\'s attention where it matters.'
      },
      {
        icon: 'Activity',
        title: 'Track',
        description: 'Keep lead status, ownership, activities, and follow-ups visible.'
      }
    ],
    previewType: 'leads',
    ctaTitle: 'Ready to manage your leads better?',
    ctaDescription: 'Bring your lead workflow together with Pulse CRM.'
  },

  'contact-management': {
    slug: 'contact-management',
    eyebrow: 'CONTACT MANAGEMENT',
    title: 'Keep every customer relationship organized',
    description: 'Manage customer contacts, communication details, and relationship history from one organized Pulse CRM workspace.',
    primaryAction: {
      text: 'Get Started',
      href: '/signup'
    },
    secondaryAction: {
      text: 'Learn More',
      href: '#capabilities'
    },
    capabilities: [
      {
        icon: 'Users',
        title: 'Organize',
        description: 'Keep customer contact information structured and easy to access.'
      },
      {
        icon: 'Building2',
        title: 'Connect',
        description: 'Keep contacts connected to their companies, deals, and sales activities.'
      },
      {
        icon: 'Activity',
        title: 'Track',
        description: 'Maintain visibility into interactions and follow-ups.'
      }
    ],
    previewType: 'contacts',
    ctaTitle: 'Keep every customer relationship within reach',
    ctaDescription: 'Give your sales team a complete and organized view of every contact.'
  },

  'company-management': {
    slug: 'company-management',
    eyebrow: 'COMPANY MANAGEMENT',
    title: 'Manage every company relationship in one place',
    description: 'Centralize company information and give your team a clear view of every account.',
    primaryAction: {
      text: 'Get Started',
      href: '/signup'
    },
    secondaryAction: {
      text: 'Learn More',
      href: '#capabilities'
    },
    capabilities: [
      {
        icon: 'Database',
        title: 'Centralize',
        description: 'Keep important company information in one organized workspace.'
      },
      {
        icon: 'Building2',
        title: 'Connect',
        description: 'Connect companies with contacts, deals, and sales activities.'
      },
      {
        icon: 'BarChart3',
        title: 'Manage',
        description: 'Give your team a clear view of account ownership and activity.'
      }
    ],
    previewType: 'companies',
    ctaTitle: 'Build a clearer view of every account',
    ctaDescription: 'Keep your company relationships organized with Pulse CRM.'
  },

  'sales-pipeline': {
    slug: 'sales-pipeline',
    eyebrow: 'SALES PIPELINE',
    title: 'See every opportunity clearly',
    description: 'Track deals through every stage of your sales process with a clear pipeline view.',
    primaryAction: {
      text: 'Get Started',
      href: '/signup'
    },
    secondaryAction: {
      text: 'Learn More',
      href: '#capabilities'
    },
    capabilities: [
      {
        icon: 'TrendingUp',
        title: 'Visualize',
        description: 'See opportunities and their current stages at a glance.'
      },
      {
        icon: 'Activity',
        title: 'Track',
        description: 'Follow every deal as it moves through the sales process.'
      },
      {
        icon: 'BarChart3',
        title: 'Manage',
        description: 'Keep your team focused on the opportunities that matter.'
      }
    ],
    previewType: 'pipeline',
    ctaTitle: 'Take control of your sales pipeline',
    ctaDescription: 'Give your team a clear view of every opportunity.'
  },

  'deal-management': {
    slug: 'deal-management',
    eyebrow: 'DEAL MANAGEMENT',
    title: 'Move deals from opportunity to close',
    description: 'Create, organize, and manage sales opportunities throughout the entire deal lifecycle.',
    primaryAction: {
      text: 'Get Started',
      href: '/signup'
    },
    secondaryAction: {
      text: 'Learn More',
      href: '#capabilities'
    },
    capabilities: [
      {
        icon: 'Briefcase',
        title: 'Create',
        description: 'Create and organize opportunities with the information your team needs.'
      },
      {
        icon: 'Activity',
        title: 'Manage',
        description: 'Keep deal stage, ownership, activity, and important details visible.'
      },
      {
        icon: 'TrendingUp',
        title: 'Close',
        description: 'Move qualified opportunities toward successful outcomes.'
      }
    ],
    previewType: 'deals',
    ctaTitle: 'Keep every deal moving forward',
    ctaDescription: 'Manage your opportunities with a clear and organized sales workflow.'
  },

  'tasks-follow-ups': {
    slug: 'tasks-follow-ups',
    eyebrow: 'TASKS & FOLLOW-UPS',
    title: 'Never lose track of the next step',
    description: 'Keep sales activities, tasks, and follow-ups organized so important opportunities keep moving.',
    primaryAction: {
      text: 'Get Started',
      href: '/signup'
    },
    secondaryAction: {
      text: 'Learn More',
      href: '#capabilities'
    },
    capabilities: [
      {
        icon: 'CheckSquare',
        title: 'Plan',
        description: 'Organize upcoming sales activities and tasks.'
      },
      {
        icon: 'Target',
        title: 'Prioritize',
        description: 'Focus your team\'s attention on important follow-ups.'
      },
      {
        icon: 'Activity',
        title: 'Follow Up',
        description: 'Keep every next step visible and actionable.'
      }
    ],
    previewType: 'tasks',
    ctaTitle: 'Keep your sales process moving',
    ctaDescription: 'Make follow-ups easier to manage with Pulse CRM.'
  }
};