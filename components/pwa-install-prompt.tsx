"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const IS_DEV = process.env.NODE_ENV === "development";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // In development mode, automatically show the banner after 2 seconds for UI testing
    if (IS_DEV) {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }

    const wasDismissed = sessionStorage.getItem("pwa-banner-dismissed");
    if (wasDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay so the page loads before showing banner
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    if (!IS_DEV) {
      sessionStorage.setItem("pwa-banner-dismissed", "true");
    }
  };

  if (!showBanner || dismissed) return null;

  return (
    <div
      role="banner"
      aria-label="Install app banner"
      className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-sm border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex mt-1 h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-blue-600">
          <Download className="h-5 w-5 text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 ">
          <p className="text-base font-semibold text-foreground">
            Install MSWD SLP App
          </p>
          <p className="text-sm text-muted-foreground">
            I-add sa iyong home screen para sa mabilis na access!
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <Button
          id="pwa-install-btn"
          size="sm"
          className="flex-1 h-9 text-sm bg-blue-600 text-white hover:bg-blue-700"
          onClick={handleInstall}
        >
          Install
        </Button>
        <Button
          id="pwa-banner-not-now"
          size="sm"
          variant="outline"
          className="flex-1 text-sm h-9"
          onClick={handleDismiss}
        >
          Later
        </Button>
      </div>
    </div>
  );
}
