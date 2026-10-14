export const roles = ['Sales', 'Service', 'Admin'] as const;
export type UserRole = (typeof roles)[number];

export const roleAccess: Record<UserRole, readonly string[]> = {
  Sales: ['/invitations', '/dashboard', '/leads', '/customers', '/pipeline', '/stock', '/deliveries', '/reports'],
  Service: ['/invitations', '/dashboard', '/customers', '/deliveries', '/service', '/reports'],
  Admin: ['/invitations', '/dashboard', '/leads', '/customers', '/pipeline', '/stock', '/deliveries', '/service', '/imports', '/sync', '/reports', '/settings'],
};

export const roleHome: Record<UserRole, string> = {
  Sales: '/dashboard',
  Service: '/dashboard',
  Admin: '/dashboard',
};

export function canAccess(role: UserRole, pathname: string) {
  return roleAccess[role].some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
