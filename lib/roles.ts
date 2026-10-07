export const roles = ['Sales', 'Service', 'Admin'] as const;
export type UserRole = (typeof roles)[number];

export const roleAccess: Record<UserRole, readonly string[]> = {
  Sales: ['/dashboard', '/leads', '/customers', '/pipeline', '/stock', '/deliveries', '/reports'],
  Service: ['/dashboard', '/customers', '/deliveries', '/service', '/reports'],
  Admin: ['/dashboard', '/leads', '/customers', '/pipeline', '/stock', '/deliveries', '/service', '/sync', '/reports', '/settings'],
};

export const roleHome: Record<UserRole, string> = {
  Sales: '/dashboard',
  Service: '/dashboard',
  Admin: '/dashboard',
};

export function canAccess(role: UserRole, pathname: string) {
  return roleAccess[role].some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
