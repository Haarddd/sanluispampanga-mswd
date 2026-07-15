import { BottomNav } from "@/components/user/bottom-nav";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      {/* Main content — padded at bottom for fixed nav */}
      <main className="mx-auto max-w-sm pb-20">{children}</main>

      {/* Fixed bottom navigation */}
      <BottomNav />
    </div>
  );
}
