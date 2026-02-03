/**
 * Admin authorization utilities
 *
 * ⚠️ SECURITY WARNING:
 * This is a basic admin check for development/testing.
 * For production, implement proper Firebase Authentication with custom claims.
 *
 * Production requirements:
 * 1. Firebase Authentication with admin custom claims
 * 2. Server-side Firebase Security Rules
 * 3. Token verification on every admin operation
 * 4. Audit logging for all admin actions
 */

/**
 * Check if admin features should be enabled
 *
 * In production, this should check:
 * - Firebase Auth currentUser
 * - Custom claims for admin role
 * - Server-side verification
 */
export function isAdminModeEnabled(): boolean {
  // For development: Check if explicitly enabled
  const isDev = import.meta.env.DEV;
  const adminEnabled = import.meta.env.VITE_ADMIN_MODE_ENABLED === 'true';

  return isDev && adminEnabled;
}

/**
 * Verify admin action with strong confirmation
 *
 * @param action - Description of the action
 * @param itemCount - Number of items affected
 * @returns true if user confirms
 */
export function confirmAdminAction(action: string, itemCount: number): boolean {
  const message = `⚠️ ADMIN ACTION WARNING ⚠️

Action: ${action}
Items affected: ${itemCount}

This action:
- CANNOT be undone
- Will affect ALL users
- May cause data loss

Type "DELETE" to confirm:`;

  const confirmation = prompt(message);
  return confirmation === 'DELETE';
}

/**
 * Log admin action for audit trail
 * In production, send to server-side logging service
 */
export function logAdminAction(action: string, details: Record<string, unknown>): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    details,
    deviceId: localStorage.getItem('save-the-past-device-id'),
    userAgent: navigator.userAgent,
  };

  console.warn('[ADMIN ACTION]', logEntry);

  // TODO: In production, send to server-side audit log
  // await fetch('/api/admin/audit-log', {
  //   method: 'POST',
  //   body: JSON.stringify(logEntry),
  // });
}
