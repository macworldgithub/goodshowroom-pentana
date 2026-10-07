export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="mt-3 h-10 w-72 rounded bg-slate-200" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-28 rounded-xl bg-slate-200" />
        ))}
      </div>
      <div className="mt-5 h-80 rounded-xl bg-slate-200" />
    </div>
  );
}
