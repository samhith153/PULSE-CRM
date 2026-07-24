export type DrawerType = 'product' | 'solutions' | 'pricing' | 'resources' | null;

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
  badge?: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
}
