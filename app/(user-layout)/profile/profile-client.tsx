"use client";

import { QrCode, MapPin, Phone, Cake } from "lucide-react";
import { ProfileHeader } from "@/components/user/profile-header";
import { SettingsMenu } from "@/components/user/settings-menu";
import { SectionHeader } from "@/components/user/section-header";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/LanguageContext";

interface ProfileClientProps {
  profile: any;
  address: any;
  digitalId: any;
}

export function ProfileClient({
  profile,
  address,
  digitalId,
}: ProfileClientProps) {
  const { t, language } = useLanguage();

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
        {language === "tl"
          ? "Hindi nahanap ang profile."
          : "Profile not found."}
      </div>
    );
  }

  // Format birthdate and address based on database values and current language
  const birthdateStr = profile.birthdate
    ? new Date(profile.birthdate).toLocaleDateString(
        language === "tl" ? "fil-PH" : "en-PH",
        { month: "long", day: "numeric", year: "numeric" },
      )
    : t.optional;

  const formattedAddress = address
    ? `${address.street ? address.street + ", " : ""}${address.barangay || ""}, ${
        address.municipality || ""
      }, ${address.province || ""}`
    : language === "tl"
      ? "Walang nakarehistrong address"
      : "No registered address";

  const qrCodeText = digitalId?.qr_code_url || digitalId?.id_number || "";

  return (
    <div className="flex flex-col gap-6 px-5 pt-8 pb-4">
      {/* Profile Header */}
      <ProfileHeader
        name={profile.full_name || "Senior Citizen"}
        phone={profile.phone}
      />

      {/* Digital Senior Citizen ID */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t.digitalId} />
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* ID Card */}
          <div className="bg-foreground p-5 text-background">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-background/60 font-medium">
                  {t.seniorCitizenId}
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight">
                  {digitalId?.id_number || "PENDING VERIFICATION"}
                </p>
              </div>
              {/* QR Code Dynamic Display */}
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-background p-0.5 overflow-hidden select-none">
                {qrCodeText ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://mswdsanluispampanga.vercel.app/verify/${digitalId?.id_number}`}
                    alt="Verification QR"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <QrCode className="h-8 w-8 text-foreground/40" />
                )}
              </div>
            </div>
            <Separator className="my-3 bg-background/15" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{profile.full_name}</p>
              <p className="text-xs text-background/60">
                {digitalId?.issue_date
                  ? `${new Date(digitalId.issue_date).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        year: "numeric",
                      },
                    )} – ${
                      digitalId.expiry_date
                        ? new Date(digitalId.expiry_date).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "No Expiry"
                    }`
                  : "Verification In Progress"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Information */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t.personalInfo} />
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <InfoRow
            icon={<Cake className="h-4 w-4" />}
            label={t.birthdate}
            value={
              profile.birthdate
                ? `${birthdateStr} ${profile.age ? `(${profile.age} ${t.age})` : ""}`
                : t.optional
            }
          />
          <Separator />
          <InfoRow
            icon={<Phone className="h-4 w-4" />}
            label={t.phone}
            value={profile.phone}
          />
          <Separator />
          <InfoRow
            icon={<MapPin className="h-4 w-4" />}
            label={t.address}
            value={formattedAddress}
          />
        </div>
      </section>

      {/* Account Settings */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t.accountSettings} />
        <SettingsMenu initialSmsNotifications={profile.sms_notifications} />
      </section>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}
