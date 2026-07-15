"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { fetchAnnouncements } from "@/app/actions/announcements-benefits";
import { clientCache } from "@/lib/client-cache";
import { createClient } from "@/lib/supabase/client";

export default function AnnouncementsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [allAnnouncements, setAllAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnnouncements() {
      const cached = clientCache.getAnnouncements();
      if (cached) {
        setAllAnnouncements(cached);
        setLoading(false);
      }

      try {
        const data = await fetchAnnouncements();
        if (data) {
          clientCache.setAnnouncements(data);
          setAllAnnouncements(data);
        }
      } catch (err) {
        console.error("Error loading announcements:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAnnouncements();

    // Supabase Realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel("announcements-page-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        async () => {
          const fresh = await fetchAnnouncements();
          clientCache.setAnnouncements(fresh);
          setAllAnnouncements(fresh);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 px-5 pt-8 pb-4">
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9 shrink-0 rounded-md"
          title={language === "tl" ? "Bumalik" : "Go back"}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t.announcements}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === "tl"
              ? "Mga pinakabagong balita at abiso"
              : "Latest updates and notices"}
          </p>
        </div>
      </div>

      {/* Announcements List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 bg-muted rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4.5 bg-muted rounded w-1/3" />
                    <div className="h-3.5 bg-muted rounded w-5/6" />
                    <div className="h-3 bg-muted rounded w-1/4 pt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          allAnnouncements.map((item) => {
            const title = language === "tl" ? item.title_tl || item.title_en : item.title_en;
            const description = language === "tl" ? item.description_tl || item.description_en : item.description_en;
            const date = new Date(item.created_at).toLocaleDateString(
              language === "tl" ? "fil-PH" : "en-PH",
              { month: "long", day: "numeric", year: "numeric" }
            );

            return (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-foreground leading-snug">
                      {title}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground/90 leading-relaxed whitespace-pre-line">
                      {description}
                    </p>
                    <p className="mt-3.5 text-xs font-medium text-muted-foreground/60">
                      {date}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {!loading && allAnnouncements.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {language === "tl" ? "Walang mga anunsyo sa kasalukuyan." : "No announcements available at the moment."}
          </div>
        )}
      </div>
    </div>
  );
}
