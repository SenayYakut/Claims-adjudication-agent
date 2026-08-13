import { ShieldCheck } from "lucide-react";

/**
 * Persistent top navigation. Sticky, white, hairline bottom border (no shadow —
 * the shadow belongs to the decision panel). "Queue" is the active section for
 * both screens in this build; "Policies"/"Analytics" are real-looking but
 * non-functional placeholders.
 */
export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-white">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-6 px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} strokeWidth={2} className="text-brand" aria-hidden />
          <span className="font-semibold text-brand-deep">Meridian</span>
        </div>

        <nav className="flex items-center gap-1 text-sm">
          <span
            aria-current="page"
            className="rounded-sm bg-brand-soft px-3 py-1.5 font-medium text-brand-deep"
          >
            Queue
          </span>
          <a
            href="#"
            className="rounded-sm px-3 py-1.5 font-normal text-ink-2 hover:text-ink"
          >
            Policies
          </a>
          <a
            href="#"
            className="rounded-sm px-3 py-1.5 font-normal text-ink-2 hover:text-ink"
          >
            Analytics
          </a>
        </nav>

        <div className="ml-auto flex items-center">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-sm font-medium text-brand-deep"
            aria-label="Reviewer"
          >
            RJ
          </span>
        </div>
      </div>
    </header>
  );
}
