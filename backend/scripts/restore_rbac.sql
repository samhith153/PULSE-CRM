-- Restore RBAC permissions, roles, and role-permission mappings
-- Safe to re-run (uses ON CONFLICT DO NOTHING)

-- ═══════════════════════════════════════════════════════════
-- 1. PERMISSIONS (53 rows)
-- ═══════════════════════════════════════════════════════════
INSERT INTO permissions (id, codename, name, description, resource, action, is_active, created_at, updated_at)
VALUES
  -- User
  (gen_random_uuid(), 'user:create',       'Create Users',       'Create new user accounts',                     'user', 'create',       true, now(), now()),
  (gen_random_uuid(), 'user:read',         'Read Users',         'View user accounts and profiles',              'user', 'read',         true, now(), now()),
  (gen_random_uuid(), 'user:update',       'Update Users',       'Edit user account details',                    'user', 'update',       true, now(), now()),
  (gen_random_uuid(), 'user:delete',       'Delete Users',       'Delete user accounts',                         'user', 'delete',       true, now(), now()),
  (gen_random_uuid(), 'user:manage_roles', 'Manage Roles',       'Assign and modify user roles',                 'user', 'manage_roles', true, now(), now()),
  (gen_random_uuid(), 'user:activate',     'Activate Users',     'Activate suspended user accounts',             'user', 'activate',     true, now(), now()),
  (gen_random_uuid(), 'user:deactivate',   'Deactivate Users',   'Deactivate user accounts',                     'user', 'deactivate',   true, now(), now()),
  -- Org
  (gen_random_uuid(), 'org:create',        'Create Orgs',        'Create organizations',                         'org', 'create',        true, now(), now()),
  (gen_random_uuid(), 'org:read',          'Read Orgs',          'View organization details',                    'org', 'read',          true, now(), now()),
  (gen_random_uuid(), 'org:update',        'Update Orgs',        'Edit organization settings',                   'org', 'update',        true, now(), now()),
  (gen_random_uuid(), 'org:delete',        'Delete Orgs',        'Delete organizations',                         'org', 'delete',        true, now(), now()),
  -- Company
  (gen_random_uuid(), 'company:create',    'Create Companies',   'Create new company records',                   'company', 'create',     true, now(), now()),
  (gen_random_uuid(), 'company:read',      'Read Companies',     'View company records',                         'company', 'read',       true, now(), now()),
  (gen_random_uuid(), 'company:update',    'Update Companies',   'Edit company records',                         'company', 'update',     true, now(), now()),
  (gen_random_uuid(), 'company:delete',    'Delete Companies',   'Delete company records',                       'company', 'delete',     true, now(), now()),
  -- Contact
  (gen_random_uuid(), 'contact:create',    'Create Contacts',    'Create new contact records',                   'contact', 'create',     true, now(), now()),
  (gen_random_uuid(), 'contact:read',      'Read Contacts',      'View contact records',                         'contact', 'read',       true, now(), now()),
  (gen_random_uuid(), 'contact:update',    'Update Contacts',    'Edit contact records',                         'contact', 'update',     true, now(), now()),
  (gen_random_uuid(), 'contact:delete',    'Delete Contacts',    'Delete contact records',                       'contact', 'delete',     true, now(), now()),
  -- Lead
  (gen_random_uuid(), 'lead:create',       'Create Leads',       'Create new lead records',                      'lead', 'create',        true, now(), now()),
  (gen_random_uuid(), 'lead:read',         'Read Leads',         'View lead records',                            'lead', 'read',          true, now(), now()),
  (gen_random_uuid(), 'lead:update',       'Update Leads',       'Edit lead records',                            'lead', 'update',        true, now(), now()),
  (gen_random_uuid(), 'lead:delete',       'Delete Leads',       'Delete lead records',                          'lead', 'delete',        true, now(), now()),
  (gen_random_uuid(), 'lead:assign',       'Assign Leads',       'Assign ownership of leads',                   'lead', 'assign',        true, now(), now()),
  (gen_random_uuid(), 'lead:convert',      'Convert Leads',      'Convert leads to deals or contacts',           'lead', 'convert',       true, now(), now()),
  -- Deal
  (gen_random_uuid(), 'deal:create',       'Create Deals',       'Create new deal records',                      'deal', 'create',        true, now(), now()),
  (gen_random_uuid(), 'deal:read',         'Read Deals',         'View deal records',                            'deal', 'read',          true, now(), now()),
  (gen_random_uuid(), 'deal:update',       'Update Deals',       'Edit deal records',                            'deal', 'update',        true, now(), now()),
  (gen_random_uuid(), 'deal:delete',       'Delete Deals',       'Delete deal records',                          'deal', 'delete',        true, now(), now()),
  -- Pipeline
  (gen_random_uuid(), 'pipeline:read',     'Read Pipeline',      'View pipeline stages and data',                'pipeline', 'read',      true, now(), now()),
  (gen_random_uuid(), 'pipeline:update',   'Update Pipeline',    'Edit pipeline stages and settings',            'pipeline', 'update',    true, now(), now()),
  -- Activity
  (gen_random_uuid(), 'activity:create',   'Create Activities',  'Log new activities',                           'activity', 'create',    true, now(), now()),
  (gen_random_uuid(), 'activity:read',     'Read Activities',    'View activity logs',                           'activity', 'read',      true, now(), now()),
  (gen_random_uuid(), 'activity:update',   'Update Activities',  'Edit activity records',                        'activity', 'update',    true, now(), now()),
  (gen_random_uuid(), 'activity:delete',   'Delete Activities',  'Delete activity records',                      'activity', 'delete',    true, now(), now()),
  -- Email
  (gen_random_uuid(), 'email:send',        'Send Emails',        'Send emails through the CRM',                  'email', 'send',         true, now(), now()),
  (gen_random_uuid(), 'email:read',        'Read Emails',        'View email records',                           'email', 'read',         true, now(), now()),
  (gen_random_uuid(), 'email:sync',        'Sync Emails',        'Sync emails from connected accounts',          'email', 'sync',         true, now(), now()),
  -- Gmail
  (gen_random_uuid(), 'gmail:connect',     'Connect Gmail',      'Connect Gmail accounts for email sync',        'gmail', 'connect',      true, now(), now()),
  -- Event
  (gen_random_uuid(), 'event:read',        'Read Events',        'View event stream and activity events',        'event', 'read',         true, now(), now()),
  -- Dashboard
  (gen_random_uuid(), 'dashboard:read',    'Read Dashboard',     'Access dashboard views and analytics',         'dashboard', 'read',     true, now(), now()),
  -- AI
  (gen_random_uuid(), 'ai:access',         'Access AI',          'Use AI-powered features and copilot',          'ai', 'access',          true, now(), now()),
  -- Webhook
  (gen_random_uuid(), 'webhook:manage',    'Manage Webhooks',    'Create and manage webhook integrations',       'webhook', 'manage',     true, now(), now()),
  -- File
  (gen_random_uuid(), 'file:upload',       'Upload Files',       'Upload and manage files and documents',        'file', 'upload',        true, now(), now()),
  -- Team Performance
  (gen_random_uuid(), 'team_performance:view',   'View Team Performance',   'View team performance metrics',    'team_performance', 'view',   true, now(), now()),
  (gen_random_uuid(), 'team_performance:export', 'Export Team Performance', 'Export team performance reports',  'team_performance', 'export', true, now(), now()),
  -- Notification
  (gen_random_uuid(), 'notification:read',    'Read Notifications',    'View notifications',                   'notification', 'read',    true, now(), now()),
  (gen_random_uuid(), 'notification:manage',  'Manage Notifications',  'Manage notification settings',         'notification', 'manage',  true, now(), now()),
  -- Report
  (gen_random_uuid(), 'report:view',      'View Reports',       'Access reports and analytics',                  'report', 'view',        true, now(), now()),
  (gen_random_uuid(), 'report:export',    'Export Reports',     'Export reports to file',                        'report', 'export',      true, now(), now()),
  -- System
  (gen_random_uuid(), 'system:admin',     'System Admin',       'Full system administration access',             'system', 'admin',       true, now(), now())
ON CONFLICT (codename) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 2. ROLES (3 rows)
-- ═══════════════════════════════════════════════════════════
INSERT INTO roles (id, name, display_name, description, is_system, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'admin',     'Administrator',     'Full access to every workspace feature and setting.',             true, true, now(), now()),
  (gen_random_uuid(), 'manager',   'Sales Manager',     'Manages the sales team, pipeline and reporting.',                true, true, now(), now()),
  (gen_random_uuid(), 'sales_rep', 'Sales Representative', 'Works leads, contacts and deals they own.',                  true, true, now(), now())
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 3. ROLE-PERMISSIONS (join table)
-- ═══════════════════════════════════════════════════════════

-- ADMIN gets ALL permissions
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- MANAGER gets everything except system:admin and user:manage_roles
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.codename NOT IN ('system:admin', 'user:manage_roles')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- SALES_REP gets limited permissions
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'sales_rep'
  AND p.codename IN (
    'user:read',
    'company:create', 'company:read', 'company:update',
    'contact:create', 'contact:read', 'contact:update',
    'lead:create', 'lead:read', 'lead:update', 'lead:convert',
    'deal:create', 'deal:read', 'deal:update',
    'pipeline:read',
    'activity:create', 'activity:read', 'activity:update', 'activity:delete',
    'email:read', 'email:sync', 'email:send',
    'event:read',
    'dashboard:read', 'file:upload',
    'report:view', 'team_performance:view', 'notification:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Done!
SELECT
  (SELECT count(*) FROM permissions) AS permissions_count,
  (SELECT count(*) FROM roles) AS roles_count,
  (SELECT count(*) FROM role_permissions) AS role_permissions_count;
