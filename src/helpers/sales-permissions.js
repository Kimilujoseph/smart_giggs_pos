/**
 * Single source of truth for sales field-level access control.
 *
 * All role-based visibility decisions for sales data go through here.
 * To grant/restrict a role or add a new protected field, edit ONLY this file.
 *
 * @param {string} role - The requesting user's role.
 * @returns {{ canViewProfit: boolean, canViewConsignmentSoldPrice: boolean, canViewProductCost: boolean }}
 */
function getSalesPermissions(role) {
  const normalizedRole = String(role || "").toLowerCase();
  const isPrivileged = ["superuser", "manager"].includes(normalizedRole);
  return {
    canViewProfit: isPrivileged,
    canViewConsignmentSoldPrice: isPrivileged,
    canViewProductCost: isPrivileged,
    canViewCommission: isPrivileged || normalizedRole === "seller",
  };
}

export { getSalesPermissions };
