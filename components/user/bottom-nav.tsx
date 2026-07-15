"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gift, User, Inbox } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: "/home", label: t.home, icon: Home },
    { href: "/requests", label: t.requests, icon: Inbox },
    { href: "/benefits", label: t.benefits, icon: Gift },
    { href: "/profile", label: t.profile, icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-sm items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
