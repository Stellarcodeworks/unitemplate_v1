import Link from "next/link";
import { FileQuestion } from "lucide-react";

/**
 * Custom 404 page for dashboard routes.
 * Shown when a user navigates to a route that doesn't exist
 * within the dashboard layout.
 */
export default function DashboardNotFound() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <div className="w-full max-w-md text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50 ring-1 ring-zinc-700">
                    <FileQuestion className="h-8 w-8 text-zinc-400" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-50">
                    Page not found
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="mt-6 inline-flex items-center gap-2 rounded-md bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
                >
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
