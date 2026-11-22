export default function Loading() {
  return (
    <div className="flex min-h-[58vh] items-center justify-center px-4" role="status" aria-live="polite">
      <div className="panel w-full max-w-sm p-8 text-center">
        <div className="relative mx-auto grid size-14 place-items-center rounded-[14px] bg-forest text-lime shadow-lg">
          <span className="absolute inset-0 animate-ping rounded-[14px] bg-natural/15" />
          <span className="relative size-5 animate-spin rounded-full border-2 border-lime/35 border-t-lime" />
        </div>
        <p className="mt-5 text-sm font-extrabold text-forest">Preparing your workspace</p>
        <p className="mt-2 text-sm text-forest/50">Loading the latest rescue activity…</p>
      </div>
    </div>
  );
}
