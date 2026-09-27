/**
 * Backward compatibility re-export bridge for permissions.
 * Canonical location: src/constants/permissions.js and src/constants/roles.js
 */
export { ROLES } from './constants/roles';
export {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from './constants/permissions';
export { default } from './constants/permissions';
