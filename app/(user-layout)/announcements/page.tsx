"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

export default function AnnouncementsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  // Mocked comprehensive list of announcements
  const allAnnouncements = [
    {
      id: 1,
      title:
        language === "tl"
          ? "Iskedyul ng Pag-release ng Pension"
          : "Pension Release Schedule Update",
      date: language === "tl" ? "Hulyo 15, 2026" : "July 15, 2026",
      description:
        language === "tl"
          ? "Ang buwanang pension para sa mga senior citizen ay ipapamahagi sa Hulyo 15-17 sa Municipal Hall mula 8:00 AM hanggang 3:00 PM. Mangyaring dalhin ang inyong Senior Citizen ID at isang photocopy nito."
          : "The monthly pension for senior citizens will be released on July 15-17 at the Municipal Hall from 8:00 AM to 3:00 PM. Please bring your Senior Citizen ID and a photocopy of it.",
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
          ? "Libreng check-up sa medikal at dental para sa mga rehistradong senior citizen sa Barangay Health Center. May kasama ring libreng pagsusuri ng blood sugar at pamimigay ng mga pangunahing bitamina."
          : "Free medical and dental check-up for registered senior citizens at the Barangay Health Center. Includes free blood sugar testing and distribution of basic vitamins.",
    },
    {
      id: 3,
      title:
        language === "tl"
          ? "Pamamahagi ng Ayuda (Food Pack)"
          : "Emergency Food Pack Distribution",
      date: language === "tl" ? "Hulyo 25, 2026" : "July 25, 2026",
      description:
        language === "tl"
          ? "Magkakaroon ng pamamahagi ng food pack para sa lahat ng rehistradong senior citizen sa barangay covered court. Dalhin lamang ang inyong digital o pisikal na ID card."
          : "There will be a food pack distribution program for all registered senior citizens at the barangay covered court. Please present your digital or physical ID card.",
    },
    {
      id: 4,
      title:
        language === "tl"
          ? "Polisiya sa Libreng Sine para sa mga Senior"
          : "Free Movie Admission Policy Updated",
      date: language === "tl" ? "Hulyo 30, 2026" : "July 30, 2026",
      description:
        language === "tl"
          ? "Maaari nang gamitin ang Senior Citizen ID para sa libreng panonood ng sine sa mga nakatalagang sinehan tuwing Lunes at Martes. Sumunod lamang sa alituntunin ng sinehan."
          : "Senior Citizen IDs can now be used for free movie admission at participating cinemas every Monday and Tuesday. Please follow local cinema scheduling guidelines.",
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
        {allAnnouncements.map((item) => (
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
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-muted-foreground/90 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
                <p className="mt-3.5 text-xs font-medium text-muted-foreground/60">
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
