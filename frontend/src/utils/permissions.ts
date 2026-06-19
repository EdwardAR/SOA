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
  docente: { view: ['alumnos', 'cursos', 'asistencia', 'calificaciones', 'notificaciones'], create: ['asistencia', 'calificaciones'], edit: ['asistencia', 'calificaciones'], delete: [] },
  profesor: { view: ['alumnos', 'cursos', 'asistencia', 'calificaciones'], create: ['calificaciones'], edit: ['calificaciones'], delete: [] },
  padre: { view: ['alumnos', 'pagos', 'notificaciones', 'asistencia', 'calificaciones', 'cursos', 'matriculas'], create: [], edit: [], delete: [] },
  alumno: { view: ['calificaciones', 'asistencia', 'notificaciones', 'alumnos', 'cursos', 'matriculas', 'pagos'], create: [], edit: [], delete: [] }
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
  const singularize = (r: string) => {
    if (!r) return r;
    // common spanish plural -> singular heuristics
    if (r.endsWith('es')) return r.slice(0, -2);
    if (r.endsWith('s')) return r.slice(0, -1);
    return r;
  };

  return menuItems.filter(item => {
    const res = normalize(item.path);
    const candidates = [res, singularize(res), `${res}es`, `${res}s`].filter(Boolean);
    return candidates.some(c => can(role, c, 'view'));
  });
}

const permissions = { can, filterMenuByRole };

export default permissions;
