"use client";

import { Shield, Heart, Banknote, IdCard, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/user/status-badge";
import { useLanguage } from "@/context/LanguageContext";

export default function BenefitsPage() {
  const { t, language } = useLanguage();

  // Localized benefits data
  const benefits = [
    {
      id: 1,
      name: "PhilHealth",
      description:
        language === "tl"
          ? "Pambansang programa ng seguro sa kalusugan na sumasaklaw sa pagpapagamot sa ospital, outpatient, at emergency care."
          : "National health insurance program covering inpatient, outpatient, and emergency care.",
      status: "active" as const,
      statusLabel: language === "tl" ? "Aktibo" : "Active",
      icon: Heart,
      details:
        language === "tl"
          ? "Miyembro mula noong 2019 · Awtomatikong nire-renew taon-taon"
          : "Member since 2019 · Auto-renewed annually",
    },
    {
      id: 2,
      name: "SSS Pension",
      description:
        language === "tl"
          ? "Buwanang benepisyo sa pension mula sa Social Security System para sa mga kwalipikadong retirado."
          : "Monthly pension benefit from the Social Security System for qualified retirees.",
      status: "eligible" as const,
      statusLabel: language === "tl" ? "Karapat-dapat" : "Eligible",
      icon: Banknote,
      details:
        language === "tl"
          ? "Araw ng pag-claim: Hulyo 1–30, 2026"
          : "Claim period: July 1–30, 2026",
    },
    {
      id: 3,
      name: "DSWD Social Pension",
      description:
        language === "tl"
          ? "₱500/buwan na tulong pinansyal para sa mga kapus-palad na senior citizen na may edad 60 pataas."
          : "₱500/month stipend for indigent senior citizens aged 60 and above.",
      status: "pending" as const,
      statusLabel: language === "tl" ? "Pinoproseso" : "Pending Application",
      icon: Shield,
      details:
        language === "tl"
          ? "Ipinadala noong Hunyo 15, 2026"
          : "Application submitted June 15, 2026",
    },
    {
      id: 4,
      name: "Senior Citizen Discount Card",
      description:
        language === "tl"
          ? "20% na discount at exemption sa 12% VAT sa mga gamot, pagkain, pamasahe, at iba pa."
          : "20% discount and 12% VAT exemption on medicines, food, transportation, and more.",
      status: "active" as const,
      statusLabel: language === "tl" ? "Aktibo" : "Active",
      icon: IdCard,
      details:
        language === "tl"
          ? "Wasto hanggang Disyembre 2027"
          : "Valid until December 2027",
    },
  ];

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
        {benefits.map((benefit) => (
          <div
            key={benefit.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <benefit.icon className="h-5 w-5 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {benefit.name}
                  </p>
                  <StatusBadge variant={benefit.status}>
                    {benefit.statusLabel}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {benefit.description}
                </p>
                <p className="mt-2 text-xs text-muted-foreground/70">
                  {benefit.details}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              {t.viewDetails}
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
