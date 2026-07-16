"use client";

import { useState } from "react";
import { QrCode, RefreshCw, User } from "lucide-react";
import { ProfileHeader } from "@/components/user/profile-header";
import { SettingsMenu } from "@/components/user/settings-menu";
import { SectionHeader } from "@/components/user/section-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface ProfileClientProps {
  profile: any;
  address: any;
  digitalId: any;
  isLoading?: boolean;
  hasFetched?: boolean;
}

export function ProfileClient({
  profile,
  address,
  digitalId,
  isLoading,
  hasFetched,
}: ProfileClientProps) {
  const { t, language } = useLanguage();
  const [showBack, setShowBack] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // Only show "not found" after the fetch has resolved with no data
  if (!profile && !isLoading && hasFetched) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
        {language === "tl"
          ? "Hindi nahanap ang profile."
          : "Profile not found."}
      </div>
    );
  }

  const qrCodeText = digitalId?.qr_code_url || digitalId?.id_number || "";

  const handleToggleFlip = () => {
    setIsRotating(true);
    setShowBack(!showBack);
    setTimeout(() => {
      setIsRotating(false);
    }, 600);
  };

  const formatCardNumber = (num: string) => {
    if (!num) return "";
    return num.replace(/(\d{3})(\d{3})(\d{3})/, "$1-$2-$3");
  };

  return (
    <div className="flex flex-col gap-6 px-5 pt-8 pb-4">
      {/* Profile Header */}
      {isLoading && !profile ? (
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      ) : (
        <ProfileHeader
          name={profile?.full_name || "Senior Citizen"}
          phone={profile?.phone}
          isVerified={profile?.verification_status?.toLowerCase() === "approved"}
        />
      )}

      {/* Digital Senior Citizen ID */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionHeader title={t.digitalId} />
          {digitalId && (
            <Button
              variant="ghost"
              onClick={handleToggleFlip}
              className="text-sm flex items-center gap-2 h-8"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4 transition-transform",
                  isRotating && "animate-spin",
                )}
              />
              {showBack
                ? language === "tl"
                  ? "Ipakita ang Harap"
                  : "Show Front"
                : language === "tl"
                  ? "Ipakita ang Likod"
                  : "Show Back"}
            </Button>
          )}
        </div>

        {/* Outer card wrapper */}
        <div className="w-full flex justify-center">
          {isLoading && !digitalId ? (
            /* FRONT CARD SKELETON - MATCHES REAL ID CARD DESIGN EXACTLY */
            <div
              className="w-full max-w-[380px] aspect-[1.586/1] rounded-2xl border border-zinc-200 bg-gradient-to-tr from-[#e0f2fe] via-[#f8fafc] to-[#fef3c7] shadow-md relative overflow-hidden flex flex-col font-sans shrink-0 z-10 isolate text-zinc-900"
            >
              {/* Top Header Flag Ribbon decoration */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-white to-red-600 shrink-0 z-10 rounded-t-2xl" />

              {/* Card Title Header */}
              <div className="px-3 py-1.5 bg-white border-b border-zinc-200 flex items-center gap-2 shrink-0 z-10 rounded-t-[14px]">
                <img
                  src="/mswd.png"
                  alt="MSWD Logo"
                  className="h-9 w-9 object-contain shrink-0 opacity-40"
                />
                <div className="flex-1 text-center leading-tight flex flex-col items-center gap-0.5 justify-center">
                  <h5 className="text-[10px] leading-none opacity-40">Province of Pampanga</h5>
                  <h4 className="text-[10px] leading-none opacity-40">Municipality of San Luis</h4>
                  <p className="text-xs mt-0.5 font-bold leading-none opacity-40">Senior Citizen Digital ID</p>
                </div>
                <img
                  src="/slp.png"
                  alt="San Luis Pampanga Logo"
                  className="h-9 w-9 object-contain shrink-0 opacity-40"
                />
              </div>

              {/* Card Body */}
              <div className="p-3 -mt-4 flex flex-col flex-1 min-h-0 z-10 text-left">
                <div className="flex gap-3 flex-1 items-center">
                  {/* Left: Photo */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="text-center mb-1">
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                    <div className="h-24 w-20 bg-white border border-zinc-200 rounded-lg flex flex-col items-center justify-center relative shadow-xs">
                      <Skeleton className="h-20 w-16 rounded-md" />
                    </div>
                  </div>

                  {/* Right: Details (aligned horizontally with Photo) */}
                  <div className="flex-1 flex flex-col gap-2 min-w-0 mt-5">
                    <div>
                      <span className="text-[10px] font-medium opacity-40">Full Name</span>
                      <Skeleton className="h-4 w-32 mt-0.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-medium block opacity-40">Address</span>
                      <Skeleton className="h-3.5 w-full mt-0.5" />
                      <Skeleton className="h-3 w-2/3 mt-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : !showBack ? (
            /* FRONT CARD - OPTIMIZED FOR CLIENT VIEW */
            <div
              className="w-full max-w-[380px] aspect-[1.586/1] rounded-2xl border border-zinc-200 bg-gradient-to-tr from-[#e0f2fe] via-[#f8fafc] to-[#fef3c7] shadow-md relative overflow-hidden flex flex-col font-sans shrink-0 z-10 isolate text-zinc-900"
              style={{
                transformOrigin: "top center",
              }}
            >
              {/* Ghosted Watermark Seal */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none">
                <img
                  src="/slp.png"
                  alt="Watermark"
                  className="w-56 h-56 object-contain"
                />
              </div>

              {/* Top Header Flag Ribbon decoration */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-white to-red-600 shrink-0 z-10 rounded-t-2xl" />

              {/* Card Title Header */}
              <div className="px-3 py-1.5 bg-white border-b border-zinc-200 flex items-center gap-2 shrink-0 z-10 rounded-t-[14px]">
                {/* Left: MSWD logo */}
                <img
                  src="/mswd.png"
                  alt="MSWD Logo"
                  className="h-9 w-9 object-contain shrink-0"
                />

                {/* Center Info */}
                <div className="flex-1 text-center leading-tight">
                  <h5 className="text-[10px] leading-none">
                    Province of Pampanga
                  </h5>
                  <h4 className="text-[10px] leading-none">
                    Municipality of San Luis
                  </h4>
                  <p className="text-xs mt-0.5 font-bold leading-none">
                    Senior Citizen Digital ID
                  </p>
                </div>

                {/* Right: SLP logo */}
                <img
                  src="/slp.png"
                  alt="San Luis Pampanga Logo"
                  className="h-9 w-9 object-contain shrink-0"
                />
              </div>

              {/* Card Body */}
              <div className="p-3 -mt-4 flex flex-col flex-1 min-h-0 z-10 text-left">
                <div className="flex gap-3 flex-1 items-center">
                  {/* Left: Photo */}
                  <div className="shrink-0 flex flex-col items-center">
                    {/* Card Number directly on top of Photo */}
                    <div className="text-center mb-1">
                      <span className="text-xs font-medium">
                        {formatCardNumber(digitalId?.id_number || "000000000")}
                      </span>
                    </div>

                    <div className="h-24 w-20 bg-white border border-zinc-200 rounded-lg flex flex-col items-center justify-center select-none relative shadow-xs text-zinc-400">
                      <User className="h-7 w-7" />
                      <span className="text-[10px]">Photo</span>
                    </div>
                  </div>

                  {/* Right: Details (aligned horizontally with Photo) */}
                  <div className="flex-1 flex flex-col gap-1.5 min-w-0 mt-5">
                    <div>
                      <span className="text-[10px] font-medium">Full Name</span>
                      <span className="-mt-1 text-sm font-medium block truncate">
                        {profile?.full_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium block">
                        Address
                      </span>
                      <span className="text-sm font-medium block line-clamp-2 leading-tight">
                        {address?.street ? `${address.street}, ` : ""}Brgy.{" "}
                        {address?.barangay || "---"}, San Luis, Pampanga
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* BACK CARD - OPTIMIZED FOR CLIENT VIEW */
            <div
              className="w-full max-w-[380px] aspect-[1.586/1] rounded-2xl border border-zinc-200 bg-gradient-to-tr from-[#e0f2fe] via-[#f8fafc] to-[#fef3c7] shadow-md relative overflow-hidden flex flex-col font-sans shrink-0 text-zinc-900 z-10 isolate"
              style={{
                transformOrigin: "top center",
              }}
            >
              {/* Ghosted Watermark Seal */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none">
                <img
                  src="/mswd.png"
                  alt="Watermark"
                  className="w-56 h-56 object-contain"
                />
              </div>

              {/* Card Header */}
              <div className="bg-white border-b border-zinc-200 px-3 py-1.5 text-center shrink-0 z-10 rounded-t-[14px]">
                <span className="text-xs font-medium">
                  Municipal Social Welfare and Development Office
                </span>
              </div>

              <div className="p-3 flex gap-3 flex-1 items-start min-h-0 z-10 text-left">
                {/* Left: Mock QR Code */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="h-32 w-32 bg-white p-2 border border-zinc-200 rounded-xl shadow-sm flex items-center justify-center select-none overflow-hidden">
                    {qrCodeText ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://mswdsanluispampanga.vercel.app/verify/${digitalId?.id_number}`}
                        alt="Citizen Verification QR"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <QrCode className="h-7 w-7 text-zinc-400" />
                    )}
                  </div>
                  <span className="text-xs font-medium">
                    REF ID:{" "}
                    {digitalId?.id
                      ? digitalId.id.substring(0, 8).toUpperCase()
                      : "PENDING"}
                  </span>
                </div>

                {/* Right: Dates stacked vertically next to QR code */}
                <div className="flex-1 flex flex-col gap-3 pt-1 z-10">
                  <div>
                    <span className="text-[10px] block font-medium">
                      Date of Issue
                    </span>
                    <span className="text-sm font-medium">
                      {digitalId?.issue_date
                        ? new Date(digitalId.issue_date).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            },
                          )
                        : "Verification In Progress"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] block font-medium">
                      Date of Expiry
                    </span>
                    <span className="text-sm font-medium">
                      {digitalId?.expiry_date
                        ? new Date(digitalId.expiry_date).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            },
                          )
                        : "No Expiry"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Account Settings */}
      <section className="flex flex-col gap-3">
        <SectionHeader title={t.accountSettings} />
        <SettingsMenu initialSmsNotifications={profile?.sms_notifications ?? false} />
      </section>
    </div>
  );
}
