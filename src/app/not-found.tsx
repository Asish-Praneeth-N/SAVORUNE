import Link from 'next/link';
import { Compass, Leaf } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center px-4 py-16 text-center">
      <div className="panel relative w-full overflow-hidden p-8 sm:p-12">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-lime/25 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid size-14 place-items-center rounded-[14px] bg-forest text-lime shadow-lg">
          <Compass className="size-6" />
        </div>
        <p className="eyebrow mt-7">404 · Route unavailable</p>
        <h2 className="mt-3 font-heading text-3xl font-extrabold text-forest sm:text-4xl">This rescue route ends here.</h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-forest/60">The screen may have moved, or the link may no longer be active. Return home to continue.</p>
        <div className="mt-8">
        <Link
          href="/"
          className="btn-primary px-6"
        >
          <Leaf className="size-4 text-lime" /> Return home
        </Link>
        </div>
      </div>
    </div>
  );
}
