import { TopNav } from "@/components/TopNav";

/**
 * Page shell: sticky TopNav, then a two-column desktop layout —
 * a fixed ~320px sidebar column (the review queue) and a main scroll column
 * (optional breadcrumb + page content). Page background is the canvas tint.
 */
export function AppShell({
  sidebar,
  breadcrumb,
  children,
}: {
  sidebar: React.ReactNode;
  breadcrumb?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <TopNav />
      <div className="mx-auto flex max-w-[1240px] gap-8 px-6 py-8">
        <aside className="w-[320px] shrink-0">{sidebar}</aside>
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[880px]">
            {breadcrumb ? <div className="mb-4">{breadcrumb}</div> : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
