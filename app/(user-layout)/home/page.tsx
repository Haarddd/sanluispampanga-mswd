"use client";

import { useState, useEffect } from "react";
import { Pill, Bell, Calendar, Check, Inbox, Loader2 } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SectionHeader } from "@/components/user/section-header";
import { useLanguage } from "@/context/LanguageContext";
import { fetchUserProfile } from "@/app/actions/profile";
import { fetchUserRequests } from "@/app/actions/requests";

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

  const [profile, setProfile] = useState<any>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Mocked data with reactive labels
  const announcements = [
    {
      id: 1,
      title:
        language === "tl"
          ? "Iskedyul ng Pag-release ng Pension"
          : "Pension Release Schedule Update",
      date: language === "tl" ? "Hulyo 15, 2026" : "July 15, 2026",
      description:
        language === "tl"
          ? "Ang buwanang pension para sa mga senior citizen ay ipapamahagi sa Hulyo 15-17 sa Municipal Hall."
          : "The monthly pension for senior citizens will be released on July 15-17 at the Municipal Hall.",
    },
    {
      id: 2,
      title:
        language === "tl"
          ? "Libreng Check-up sa Kalusugan"
          : "Free Medical Check-up",
      date: language === "tl" ? "Hulyo 20, 2026" : "July 20, 2026",
      description:
        language === "tl"
          ? "Libreng check-up sa medikal at dental para sa mga rehistradong senior citizen sa Barangay Health Center."
          : "Free medical and dental check-up for registered senior citizens at the Barangay Health Center.",
    },
  ];

  const [activeReminders, setActiveReminders] = useState([
    {
      id: 1,
      title: t.medicinePickupReady,
      description: "Amlodipine 5mg — approved & ready",
      date: language === "tl" ? "Ngayon" : "Today",
      icon: Pill,
      href: "/requests?tab=medicine",
    },
    {
      id: 2,
      title: t.benefitsClaimDeadline,
      description:
        language === "tl"
          ? "Matatapos ang claim sa Hulyo 30"
          : "SSS Pension claim period ends July 30",
      date: "Jul 30",
      icon: Calendar,
      href: "/benefits",
    },
  ]);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [profileData, requestsData] = await Promise.all([
          fetchUserProfile(),
          fetchUserRequests(),
        ]);
        if (profileData?.profile) {
          setProfile(profileData.profile);
        }
        if (requestsData) {
          const totalPending =
            requestsData.medicineRequests.filter((r) => r.status === "pending").length +
            requestsData.assistanceRequests.filter((r) => r.status === "pending").length;
          setPendingRequestsCount(totalPending);
        }
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleDismissReminder = (id: number) => {
    setActiveReminders((prev) => prev.filter((item) => item.id !== id));
  };

  const firstName = profile?.full_name ? profile.full_name.split(" ")[0] : "Senior";



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
          {announcements.map((item) => (
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
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground/70">
                    {item.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Status Overview */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t.status} />
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/requests"
            className="rounded-xl border border-border bg-card p-5 hover:bg-accent/40 transition-colors block active:scale-[0.98]"
          >
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3 w-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-3xl font-bold tracking-tight text-foreground leading-none">
                  {pendingRequestsCount}
                </p>
              </div>
              <p className="text-xs font-semibold text-muted-foreground leading-snug">
                {t.pendingRequests}
              </p>
            </div>
          </Link>
          <Link
            href="/announcements"
            className="rounded-xl border border-border bg-card p-5 hover:bg-accent/40 transition-colors block active:scale-[0.98]"
          >
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3 w-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-3xl font-bold tracking-tight text-foreground leading-none">
                  {announcements.length}
                </p>
              </div>
              <p className="text-xs font-semibold text-muted-foreground leading-snug">
                {t.newAnnouncements}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Upcoming Reminders */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title={t.reminders}
          actionLabel={t.seeAll}
          actionHref="/reminders"
        />
        <div className="flex flex-col gap-2">
          {activeReminders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/30 p-6 text-center ">
              <p className="text-xs text-muted-foreground italic">
                {language === "tl"
                  ? "Walang mga paalala sa kasalukuyan"
                  : "No reminders at the moment"}
              </p>
            </div>
          ) : (
            activeReminders.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 "
              >
                <Link
                  href={item.href}
                  className="flex-1 min-w-0 flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {item.description}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground/70 font-medium mr-1.5">
                    {item.date}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDismissReminder(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title={
                      language === "tl"
                        ? "Markahan bilang tapos"
                        : "Mark as done"
                    }
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
