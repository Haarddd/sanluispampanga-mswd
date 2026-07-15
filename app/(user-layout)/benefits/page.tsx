"use client";

import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/user/status-badge";
import { useLanguage } from "@/context/LanguageContext";
import { fetchBenefits } from "@/app/actions/announcements-benefits";
import { clientCache } from "@/lib/client-cache";
import { createClient } from "@/lib/supabase/client";

function getStatusLabel(status: string, language: string) {
  if (status === "active") return language === "tl" ? "Aktibo" : "Active";
  if (status === "eligible") return language === "tl" ? "Kwalipikado" : "Eligible";
  if (status === "not_in_scope" || status === "pending") return language === "tl" ? "Hindi pa Sakop" : "Not in Scope";
  return status;
}

export default function BenefitsPage() {
  const { t, language } = useLanguage();
  const [allBenefits, setAllBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBenefits() {
      const cached = clientCache.getBenefits();
      if (cached) {
        setAllBenefits(cached);
        setLoading(false);
      }

      try {
        const data = await fetchBenefits();
        if (data) {
          clientCache.setBenefits(data);
          setAllBenefits(data);
        }
      } catch (err) {
        console.error("Error loading benefits:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBenefits();

    // Supabase Realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel("benefits-page-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "benefits" },
        async () => {
          const fresh = await fetchBenefits();
          clientCache.setBenefits(fresh);
          setAllBenefits(fresh);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 px-5 pt-8 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground ">
          {t.benefits}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t.benefitsSubtitle}
        </p>
      </div>

      {/* Benefits List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-muted rounded w-1/3" />
                  <div className="h-5 bg-muted rounded w-16" />
                </div>
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          allBenefits.map((benefit) => {
            const name = language === "tl" ? benefit.name_tl || benefit.name_en : benefit.name_en;
            const description = language === "tl" ? benefit.description_tl || benefit.description_en : benefit.description_en;
            const statusLabel = getStatusLabel(benefit.status, language);

            return (
              <div
                key={benefit.id}
                className="rounded-xl border border-border bg-card p-5 space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-bold text-foreground leading-tight">
                    {name}
                  </h3>
                  <StatusBadge variant={benefit.status === "not_in_scope" ? "pending" : benefit.status}>
                    {statusLabel}
                  </StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            );
          })
        )}
        {!loading && allBenefits.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {language === "tl" ? "Walang mga benepisyo sa kasalukuyan." : "No benefits programs available at the moment."}
          </div>
        )}
      </div>
    </div>
  );
}
