export const API_PATHS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  QUERIES: '/queries',
  INTEGRATIONS: '/integrations',
  USERS: '/users',
  INVITATIONS: '/invitations',
  ORGANIZATION: '/organization',
  ACTIVITY_LOGS: '/activity-logs',
} as const;

export const AUTH_EXCLUSION_PATHS = [
  '/auth/register',
  '/auth/login',
  '/auth/refresh',
  '/invitations/accept',
] as const;
