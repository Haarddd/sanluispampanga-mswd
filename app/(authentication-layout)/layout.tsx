"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { HelpCircle, Globe } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function AuthenticationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center">
      {/* Top bar */}
      <header className="w-full max-w-sm px-6 pt-8 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="default"
          asChild
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Link href="/support">
            <HelpCircle className="w-4 h-4" />
            <span>{t.help}</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          size="default"
          onClick={() => setLanguage(language === "en" ? "tl" : "en")}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm">{language === "en" ? "En" : "Tl"}</span>
        </Button>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="w-full max-w-sm flex-1 flex flex-col px-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-sm p-6 mt-auto">
        <p className="text-xs text-muted-foreground text-center">v1.0.0</p>
      </footer>
    </div>
  );
}
