"use client";

import { RequestsSections } from "@/components/user/requests-sections";
import { useLanguage } from "@/context/LanguageContext";

export default function RequestsPage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-6 px-5 pt-8 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t.requests}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t.requestsSubtitle}
        </p>
      </div>

      {/* Main Tabs Sections */}
      <RequestsSections />
    </div>
  );
}
