import Link from "next/link";
import { ROUTES } from "@/lib/constants";

/**
 * 404 Not Found page.
 */
export default function NotFoundPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-zinc-50">404</h1>
                <p className="mt-3 text-zinc-400">
                    The page you&apos;re looking for doesn&apos;t exist.
                </p>
                <Link
                    href={ROUTES.HOME}
                    className="mt-6 inline-block rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700"
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}
