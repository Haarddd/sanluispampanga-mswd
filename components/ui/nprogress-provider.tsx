"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.1 });

function NProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.currentTarget as HTMLAnchorElement;
      const href = target.href;
      if (!href) return;

      const url = new URL(href);
      const currentUrl = new URL(window.location.href);

      // Only trigger for same-origin navigation
      if (url.origin !== currentUrl.origin) return;
      // Skip if same URL
      if (url.pathname === currentUrl.pathname && url.search === currentUrl.search) return;

      NProgress.start();
    };

    const handleMutation = () => {
      const anchors = document.querySelectorAll<HTMLAnchorElement>("a[href]");
      anchors.forEach((anchor) => {
        anchor.removeEventListener("click", handleAnchorClick);
        anchor.addEventListener("click", handleAnchorClick);
      });
    };

    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, { childList: true, subtree: true });
    handleMutation();

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}

export function NProgressProvider() {
  return (
    <Suspense fallback={null}>
      <NProgressInner />
    </Suspense>
  );
}
