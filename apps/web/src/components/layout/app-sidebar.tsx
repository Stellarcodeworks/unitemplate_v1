"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { hasRole } from "@eop/access";
import type { Role, UserContext } from "@eop/access";
import {
    Building2,
    Users,
    ScrollText,
    Settings,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Navigation item definition.
 * minRole: minimum role required to see this item.
 * null means any authenticated user can see it.
 */
interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    minRole: Role | null;
}

const NAV_ITEMS: NavItem[] = [
    { label: "Outlets", href: "/outlets", icon: Building2, minRole: "org_admin" },
    { label: "Users", href: "/users", icon: Users, minRole: "manager" },
    { label: "My Activity", href: "/audit", icon: ScrollText, minRole: null },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        minRole: "super_admin",
    },
    {
        label: "Organizations",
        href: "/organizations",
        icon: Building2,
        minRole: "super_admin",
    },
];

/**
 * Role-aware sidebar navigation.
 * Filters nav items using hasRole() from @eop/access.
 * UI-filtering only — actual enforcement is in RSC pages.
 */
export function AppSidebar({ userContext }: { userContext: UserContext }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const outletParam = searchParams.get("outlet");

    // Filter nav items by role
    const visibleItems = NAV_ITEMS.filter(({ minRole }) => {
        if (minRole === null) return true;
        return hasRole(userContext, minRole);
    });

    // Preserve outlet param when navigating
    function buildHref(href: string) {
        if (outletParam) {
            return `${href}?outlet=${outletParam}`;
        }
        return href;
    }

    return (
        <nav className="flex-1 space-y-1 px-3 py-3">
            {visibleItems.map(({ label, href, icon: Icon }) => {
                const isActive =
                    pathname === href || pathname.startsWith(`${href}/`);

                return (
                    <Link
                        key={href}
                        href={buildHref(href)}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                                ? "bg-zinc-800 text-zinc-50"
                                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
                        )}
                    >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
