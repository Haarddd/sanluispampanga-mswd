"use client";

import { useState, useEffect } from "react";
import {
  Pill,
  Bell,
  Inbox,
  CreditCard,
  LifeBuoy,
  Phone,
  PhilippinePeso,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SectionHeader } from "@/components/user/section-header";
import { useLanguage } from "@/context/LanguageContext";
import { fetchUserProfile } from "@/app/actions/profile";
import { fetchUserRequests } from "@/app/actions/requests";
import { fetchAnnouncements } from "@/app/actions/announcements-benefits";
import { clientCache } from "@/lib/client-cache";
import { createClient } from "@/lib/supabase/client";

function getGreetingKey(
  hour: number,
): "goodMorning" | "goodAfternoon" | "goodEvening" {
  if (hour < 12) return "goodMorning";
  if (hour < 18) return "goodAfternoon";
  return "goodEvening";
}

export default function HomePage() {
  const { t, language } = useLanguage();
  const hour = new Date().getHours();
  const greetingKey = getGreetingKey(hour);
  const greeting = t[greetingKey];

  const today = new Date().toLocaleDateString(
    language === "tl" ? "fil-PH" : "en-PH",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
    },
  );

  const [profile, setProfile] = useState<any>(() => {
    return clientCache.getProfile();
  });
  const [announcements, setAnnouncements] = useState<any[]>(() => {
    const cached = clientCache.getAnnouncements();
    return cached ? cached.slice(0, 2) : [];
  });
  const [loading, setLoading] = useState(() => {
    return !clientCache.getAnnouncements();
  });

  useEffect(() => {
    async function loadHomeData() {
      // Check if cache exists
      const cachedProfile = clientCache.getProfile();
      const cachedAnnouncements = clientCache.getAnnouncements();

      // If both cache exist, don't fetch
      if (cachedProfile && cachedAnnouncements) {
        setProfile(cachedProfile);
        return;
      }

      try {
        const [profileData, requestsData, announcementsData] =
          await Promise.all([
            fetchUserProfile(),
            fetchUserRequests(),
            fetchAnnouncements(),
          ]);

        if (profileData?.profile) {
          setProfile(profileData.profile);
          clientCache.setProfile(profileData.profile);
        }

        if (announcementsData) {
          clientCache.setAnnouncements(announcementsData);
          setAnnouncements(announcementsData.slice(0, 2));
        }
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();

    // Setup Supabase Realtime listener
    const supabase = createClient();
    const channel = supabase
      .channel("home-announcements-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        async () => {
          const fresh = await fetchAnnouncements();
          clientCache.setAnnouncements(fresh);
          setAnnouncements(fresh.slice(0, 2));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const firstName = profile?.full_name ? profile.full_name.split(" ")[0] : "";

  return (
    <div className="flex flex-col gap-6 px-5 pt-8 pb-4">
      {/* Header with greeting + theme toggle */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Announcements */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title={t.announcements}
          actionLabel={t.seeAll}
          actionHref="/announcements"
        />
        <div className="flex flex-col gap-2.5">
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card p-4 animate-pulse"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-5/6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            announcements.map((item) => {
              const title =
                language === "tl"
                  ? item.title_tl || item.title_en
                  : item.title_en;
              const description =
                language === "tl"
                  ? item.description_tl || item.description_en
                  : item.description_en;
              const date = new Date(item.created_at).toLocaleDateString(
                language === "tl" ? "fil-PH" : "en-PH",
                { month: "long", day: "numeric", year: "numeric" },
              );
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {description}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground/70">
                        {date}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {!loading && announcements.length === 0 && (
            <div className="text-center py-6 border border-dashed rounded-xl text-xs text-muted-foreground italic">
              {language === "tl"
                ? "Walang bagong anunsyo."
                : "No new announcements."}
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions (Mabilisang Serbisyo) */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title={language === "tl" ? "Mabilisang Serbisyo" : "Quick Services"}
        />
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/requests"
            className="rounded-xl border border-border bg-card p-4 hover:bg-accent/40 transition-colors flex flex-col gap-2.5 active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Pill className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {language === "tl" ? "Humiling ng Gamot" : "Medicine Request"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === "tl" ? "Libreng gamot" : "Free prescriptions"}
              </p>
            </div>
          </Link>

          <Link
            href="/requests"
            className="rounded-xl border border-border bg-card p-4 hover:bg-accent/40 transition-colors flex flex-col gap-2.5 active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <PhilippinePeso className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {language === "tl" ? "Tulong Pinansyal" : "Cash Assistance"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === "tl" ? "Social Pension" : "Apply for support"}
              </p>
            </div>
          </Link>

          <Link
            href="/profile"
            className="rounded-xl border border-border bg-card p-4 hover:bg-accent/40 transition-colors flex flex-col gap-2.5 active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {language === "tl" ? "Aking Digital ID" : "My Digital ID"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === "tl" ? "Ipakita ang QR" : "Show credentials"}
              </p>
            </div>
          </Link>

          <Link
            href="/support"
            className="rounded-xl border border-border bg-card p-4 hover:bg-accent/40 transition-colors flex flex-col gap-2.5 active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {language === "tl" ? "Suporta at Gabay" : "Get Support"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === "tl" ? "MSWD Helpdesk" : "Ask questions"}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Emergency Hotlines */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title={
            language === "tl"
              ? "Mga Numero sa Sakuna / Emergency"
              : "Emergency Hotlines"
          }
        />
        <div className="rounded-xl border border-border bg-card p-4 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  MSWD San Luis Office
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "tl"
                    ? "Lunes hanggang Biyernes, 8 AM - 5 PM"
                    : "Monday to Friday, 8 AM - 5 PM"}
                </p>
              </div>
            </div>
            <a
              href="tel:09171234567"
              className="text-xs font-bold text-red-600 bg-red-500/10 dark:bg-red-950/40 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              CALL
            </a>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border pt-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  MDRRMO Rescue Hotline
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "tl"
                    ? "24/7 Oras ng Pagsagip at Ambulansya"
                    : "24/7 Emergency & Rescue Services"}
                </p>
              </div>
            </div>
            <a
              href="tel:09179998888"
              className="text-xs font-bold text-red-600 bg-red-500/10 dark:bg-red-950/40 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              CALL
            </a>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border pt-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Municipal Health Office
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "tl"
                    ? "Tulong Medikal at Konsultasyon"
                    : "Medical Assistance & Health Consultations"}
                </p>
              </div>
            </div>
            <a
              href="tel:09178887777"
              className="text-xs font-bold text-red-600 bg-red-500/10 dark:bg-red-950/40 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              CALL
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
