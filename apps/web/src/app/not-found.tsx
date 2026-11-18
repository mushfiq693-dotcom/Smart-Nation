import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <h2 className="text-3xl font-bold text-white mb-2">404 - Page Not Found</h2>
      <p className="text-sm text-slate-400 mb-6">The page or resource you are looking for does not exist.</p>
      <Link
        href="/"
        className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 text-xs transition-all"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
