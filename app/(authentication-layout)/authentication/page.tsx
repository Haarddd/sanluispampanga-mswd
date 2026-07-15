"use client";

import Image from "next/image";
import { OTPForm } from "@/components/auth/otp-form";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col flex-1 pt-16 pb-10">
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-5 mb-14">
        <div className="flex items-center gap-4">
          <Image
            src="/mswd.png"
            alt="MSWD Logo"
            width={64}
            height={64}
            className="rounded-xl object-contain"
            priority
          />
          <Image
            src="/slp.png"
            alt="SLP Logo"
            width={64}
            height={64}
            className="rounded-xl object-contain"
            priority
          />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t.seniorCitizenSystem}
          </h1>
        </div>
      </div>

      {/* Auth Form */}
      <OTPForm />
    </div>
  );
}
