"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Pill, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

export default function RemindersPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  // Comprehensive list of active and historical reminders
  const reminders = [
    {
      id: 1,
      title: t.medicinePickupReady,
      description:
        language === "tl"
          ? "Maaari nang kunin ang Amlodipine Besilate (30 tableta) sa Municipal Health Office."
          : "Amlodipine Besilate (30 tablets) is approved and ready for pickup at the Municipal Health Office.",
      date: language === "tl" ? "Ngayon" : "Today",
      icon: Pill,
      status: "active",
    },
    {
      id: 2,
      title: t.benefitsClaimDeadline,
      description:
        language === "tl"
          ? "Huling araw ng pag-claim ng SSS Pension para sa buwan na ito. Magtatapos sa Hulyo 30."
          : "Last day to claim your SSS Pension for this month. Period ends July 30.",
      date: "Jul 30, 2026",
      icon: Calendar,
      status: "active",
    },
    {
      id: 3,
      title:
        language === "tl" ? "Iskedyul ng Bakuna" : "Vaccination Appointment",
      description:
        language === "tl"
          ? "Libreng Bakuna laban sa Flu para sa mga Senior Citizen sa Barangay Covered Court."
          : "Free Flu Vaccination for Senior Citizens at the Barangay Covered Court.",
      date: "Jun 12, 2026",
      icon: AlertCircle,
      status: "completed",
    },
  ];

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
            {t.reminders}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === "tl"
              ? "Kasaysayan ng iyong mga paalala"
              : "History of your active and past reminders"}
          </p>
        </div>
      </div>

      {/* Reminders List */}
      <div className="flex flex-col gap-3">
        {reminders.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border p-4 bg-card ${
              item.status === "completed"
                ? "opacity-60 border-border"
                : "border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  {item.status === "completed" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">
                      {language === "tl" ? "Tapos na" : "Completed"}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground/60 font-medium">
                  {item.date}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
