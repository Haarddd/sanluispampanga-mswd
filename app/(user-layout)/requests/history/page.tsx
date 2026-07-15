"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, Pill, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/user/status-badge";
import { useLanguage } from "@/context/LanguageContext";

export default function RequestsHistoryPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  // Integrated list of all mock requests
  const historyList = [
    {
      id: 1,
      type: "medicine",
      title: "Amlodipine Besilate",
      subtitle: "Amlodipine · 30 tablets",
      date: language === "tl" ? "Hulyo 8, 2026" : "July 8, 2026",
      status: "approved" as const,
      statusLabel: language === "tl" ? "Inaprubahan" : "Approved",
      details: language === "tl" ? "Handa nang kunin sa Health Office." : "Ready for pickup at the Health Office.",
    },
    {
      id: 2,
      type: "assistance",
      title: language === "tl" ? "Tulong sa Transportasyon" : "Transportation Support",
      subtitle: language === "tl" ? "Libreng biyahe patungong Ospital" : "Free shuttle to General Hospital",
      date: language === "tl" ? "Hulyo 11, 2026" : "July 11, 2026",
      status: "pending" as const,
      statusLabel: language === "tl" ? "Pinoproseso" : "Pending",
      details: language === "tl" ? "Para sa aking check-up sa Miyerkules" : "For my follow-up check-up this Wednesday",
    },
    {
      id: 3,
      type: "assistance",
      title: language === "tl" ? "Tulong Medikal (Financial)" : "Medical Support (Financial Grant)",
      subtitle: language === "tl" ? "Tulong pambili ng Insulin" : "Financial assistance for insulin",
      date: language === "tl" ? "Hulyo 6, 2026" : "July 6, 2026",
      status: "approved" as const,
      statusLabel: language === "tl" ? "Inaprubahan" : "Approved",
      details: language === "tl" ? "Maaari nang kunin ang tseke sa MSWD cashier." : "Check is ready for release at MSWD Cashier.",
    },
    {
      id: 4,
      type: "medicine",
      title: "Metformin HCl",
      subtitle: "Metformin · 60 tablets",
      date: language === "tl" ? "Hulyo 5, 2026" : "July 5, 2026",
      status: "completed" as const,
      statusLabel: language === "tl" ? "Tapos na" : "Completed",
    },
    {
      id: 5,
      type: "medicine",
      title: "Losartan Potassium",
      subtitle: "Losartan · 30 tablets",
      date: language === "tl" ? "Hulyo 10, 2026" : "July 10, 2026",
      status: "pending" as const,
      statusLabel: language === "tl" ? "Pinoproseso" : "Pending",
      details: language === "tl" ? "Para sa maintenance — high blood" : "For maintenance — high blood pressure",
    },
    {
      id: 6,
      type: "assistance",
      title: language === "tl" ? "Tulong sa Pagkain" : "Food Assistance",
      subtitle: language === "tl" ? "Kahon ng pagkain (Food pack)" : "Emergency food pack supply",
      date: language === "tl" ? "Hunyo 20, 2026" : "June 20, 2026",
      status: "completed" as const,
      statusLabel: language === "tl" ? "Tapos na" : "Completed",
    },
  ];

  return (
    <div className="flex flex-col gap-6 px-5 pt-8 pb-4">
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/requests")}
          className="h-9 w-9 shrink-0 rounded-md"
          title={language === "tl" ? "Bumalik" : "Go back"}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {language === "tl" ? "Kasaysayan ng mga Request" : "Request History"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === "tl" ? "Mga nakaraang kahilingan para sa gamot at tulong" : "Full record of your medicine and general requests"}
          </p>
        </div>
      </div>

      {/* History List */}
      <div className="flex flex-col gap-3">
        {historyList.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                  {item.type === "medicine" ? (
                    <Pill className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <HandHeart className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
              <StatusBadge variant={item.status} className="shrink-0">
                {item.statusLabel}
              </StatusBadge>
            </div>

            <div className="mt-3 border-t border-border pt-3 flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {language === "tl" ? "Petsa" : "Date"}
                </span>
                <span className="text-foreground font-medium">
                  {item.date}
                </span>
              </div>
              {item.details && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {language === "tl" ? "Mga detalye" : "Details"}
                  </span>
                  <span className="text-foreground font-medium text-right max-w-[70%]">
                    {item.details}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
