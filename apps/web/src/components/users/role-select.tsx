"use client";

import type { Role } from "@eop/access";
import { canAssignRole, ALL_ROLES } from "@eop/access";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Role select dropdown that respects canAssignRole() rules.
 * - super_admin is never selectable
 * - Roles the assigner can't assign are visually disabled
 * - Uses native <select> for accessibility
 */
export function RoleSelect({
    currentRole,
    assignerRole,
    disabled = false,
    onChange,
}: {
    currentRole: Role;
    assignerRole: Role;
    disabled?: boolean;
    onChange: (role: Role) => void;
}) {
    // Filter to assignable roles only (excluding super_admin)
    const selectableRoles = ALL_ROLES.filter(
        (role) => role !== "super_admin" && canAssignRole(assignerRole, role),
    );

    // If the assigner can't change this role at all, show static text
    if (selectableRoles.length === 0) {
        return (
            <span className="text-sm text-zinc-300">
                {ROLE_LABELS[currentRole] ?? currentRole}
            </span>
        );
    }

    return (
        <select
            value={currentRole}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value as Role)}
            className={cn(
                "cursor-pointer rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-300",
                "transition-colors hover:border-zinc-700 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600",
            )}
        >
            {/* Always include current role so the select shows correctly */}
            {!selectableRoles.includes(currentRole) && (
                <option value={currentRole} disabled>
                    {ROLE_LABELS[currentRole] ?? currentRole}
                </option>
            )}
            {selectableRoles.map((role) => (
                <option key={role} value={role}>
                    {ROLE_LABELS[role] ?? role}
                </option>
            ))}
        </select>
    );
}
