import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7fa] p-6">
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#0b111c] text-lg font-black text-white">
          GS
        </span>
        <h1 className="mt-5 text-3xl font-black text-[#10182b]">
          Page not found
        </h1>
        <p className="mt-2 text-slate-500">
          The workspace page you requested does not exist.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
