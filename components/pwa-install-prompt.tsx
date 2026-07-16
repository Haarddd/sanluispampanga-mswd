"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as { standalone?: boolean }).standalone === true);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPwaInstalled(isStandalone);

    if (isStandalone) return;

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem("pwa-prompt-dismissed") === "true";
    if (isDismissed) return;

    // 2. Handle Android/Chrome beforeinstallprompt event
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowAndroidPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);

    // 3. Handle iOS/Safari detection
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as { MSStream?: unknown }).MSStream;
    if (isIos && !isStandalone) {
      setShowIosPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!installPrompt) return;
    setShowAndroidPrompt(false);
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setIsPwaInstalled(true);
      toast.success(
        "App successfully installed! You can now access it from your home screen.",
      );
    } else {
      // If they dismissed the browser prompt, trigger session-wide dismiss
      sessionStorage.setItem("pwa-prompt-dismissed", "true");
    }
    setInstallPrompt(null);
  };

  const handleDismissAndroid = () => {
    setShowAndroidPrompt(false);
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  const handleDismissIos = () => {
    setShowIosPrompt(false);
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (isPwaInstalled) return null;

  return (
    <>
      {/* Android/Chrome Bottom Install Banner */}
      {showAndroidPrompt && (
        <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-sm border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
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
              onClick={handleAndroidInstall}
            >
              Install
            </Button>
            <Button
              id="pwa-banner-not-now"
              size="sm"
              variant="outline"
              className="flex-1 text-sm h-9"
              onClick={handleDismissAndroid}
            >
              Later
            </Button>
          </div>
        </div>
      )}

      {/* iOS/Safari Install Tutorial Banner */}
      {showIosPrompt && (
        <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-sm border border-border bg-background/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex mt-1 h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-blue-600">
              <Share className="h-5 w-5 text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 ">
              <p className="text-base font-semibold text-foreground">
                Install MSWD SLP App
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                I-tap ang <strong className="text-foreground">Share</strong>{" "}
                icon sa Safari browser at piliin ang{" "}
                <strong className="text-foreground">Add to Home Screen</strong>.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex">
            <Button
              size="sm"
              className="w-full h-9 text-sm bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleDismissIos}
            >
              Nakuha ko na
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
