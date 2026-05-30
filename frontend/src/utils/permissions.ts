type Role = string;

type PermissionSet = {
  view?: string[];
  create?: string[];
  edit?: string[];
  delete?: string[];
};

const rolePermissions: Record<string, PermissionSet> = {
  director: { view: ['*'], create: ['*'], edit: ['*'], delete: ['*'] },
  administrativo: { view: ['*'], create: ['*'], edit: ['*'], delete: ['*'] },
  docente: { view: ['dashboard', 'alumnos', 'cursos', 'asistencia', 'calificaciones', 'notificaciones'], create: ['asistencia', 'calificaciones'], edit: ['asistencia', 'calificaciones'], delete: [] },
  profesor: { view: ['dashboard', 'alumnos', 'cursos', 'asistencia', 'calificaciones', 'notificaciones'], create: ['asistencia', 'calificaciones'], edit: ['asistencia', 'calificaciones'], delete: [] },
  alumno: { view: ['dashboard', 'cursos', 'matriculas', 'pagos', 'asistencia', 'calificaciones', 'notificaciones', 'perfil'], create: [], edit: [], delete: [] },
  padre: { view: ['dashboard', 'pagos', 'asistencia', 'calificaciones', 'notificaciones', 'perfil'], create: [], edit: [], delete: [] }
};

function matches(list: string[] | undefined, resource: string) {
  if (!list) return false;
  if (list.includes('*')) return true;
  return list.includes(resource);
}

export function can(role: Role | undefined | null, resource: string, action: 'view' | 'create' | 'edit' | 'delete') {
  if (!role) return false;
  const perms = rolePermissions[role.toLowerCase()];
  if (!perms) return false;
  switch (action) {
    case 'view':
      return matches(perms.view, resource);
    case 'create':
      return matches(perms.create, resource);
    case 'edit':
      return matches(perms.edit, resource);
    case 'delete':
      return matches(perms.delete, resource);
    default:
      return false;
  }
}

export function filterMenuByRole(role: Role | undefined | null, menuItems: Array<{ path: string; label: string; icon?: string }>) {
  const normalize = (p: string) => p.replace(/^\//, '').split('/')[0];
  return menuItems.filter(item => can(role, normalize(item.path), 'view'));
}

const permissions = { can, filterMenuByRole };

export default permissions;
