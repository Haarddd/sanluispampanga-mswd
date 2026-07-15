"use client";

import { useState, useEffect, useRef } from "react";
import {
  sendOTP,
  verifyOTP,
  checkUserStatus,
  loginWithPIN,
} from "@/app/actions/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useLanguage } from "@/context/LanguageContext";

const RESEND_SECONDS = 180;

export function OTPForm() {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<"phone" | "otp" | "pin">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Formatted display: e.g. "912 345 6789"
  const displayPhone = phone
    .replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")
    .trim();

  const startResendTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.startsWith("0")) val = val.substring(1);
    val = val.substring(0, 10);
    setPhone(val);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formattedPhone = phone.startsWith("+63")
      ? phone
      : `+63${phone.replace(/^0+/, "")}`;

    // Check user status
    const statusRes = await checkUserStatus(formattedPhone);

    if (statusRes.error) {
      setError(statusRes.error);
      setLoading(false);
      return;
    }

    if (statusRes.exists) {
      setStep("pin");
      setPin("");
      setLoading(false);
    } else {
      const formData = new FormData();
      formData.append("phone", phone);

      const res = await sendOTP(formData);

      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setStep("otp");
        setOtp("");
        startResendTimer();
        setLoading(false);
      }
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formattedPhone = phone.startsWith("+63")
      ? phone
      : `+63${phone.replace(/^0+/, "")}`;
    const res = await verifyOTP(formattedPhone, otp);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formattedPhone = phone.startsWith("+63")
      ? phone
      : `+63${phone.replace(/^0+/, "")}`;
    const res = await loginWithPIN(formattedPhone, pin);

    if (res?.error) {
      setError(
        res.error === "Invalid login credentials"
          ? language === "tl"
            ? "Maling PIN code."
            : "Invalid PIN code."
          : res.error,
      );
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError(null);
    setOtp("");
    const formData = new FormData();
    formData.append("phone", phone);
    const res = await sendOTP(formData);
    if (res.error) {
      setError(res.error);
    } else {
      startResendTimer();
    }
  };

  const handleBack = () => {
    setStep("phone");
    setOtp("");
    setPin("");
    setError(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(0);
  };

  if (step === "phone") {
    return (
      <div className="w-full flex flex-col gap-8">
        {/* Step heading */}
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {t.enterMobile}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t.sendCodeDesc}</p>
        </div>

        {error && (
          <div className="p-3 -my-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
          <div className="relative flex items-center">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-base md:text-base">
              +63
            </span>
            <Input
              id="phone"
              type="tel"
              value={displayPhone}
              onChange={handlePhoneChange}
              placeholder={t.phonePlaceholder}
              required
              inputMode="numeric"
              className="pl-12 h-12 text-base md:text-base rounded-md"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || phone.length < 9}
            className="w-full h-12 text-base rounded-md font-medium"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t.continue
            )}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center">
          {t.authDisclaimer}
        </p>
      </div>
    );
  }

  if (step === "pin") {
    // PIN step
    return (
      <div className="w-full flex flex-col gap-8">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 -ml-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.changeNumber}
          </button>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {language === "tl" ? "Ilagay ang iyong PIN" : "Enter your PIN"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {language === "tl"
              ? "I-verify ang iyong account gamit ang 6-digit PIN para kay"
              : "Verify your account with your 6-digit PIN for"}{" "}
            <span className="font-medium text-foreground text-nowrap">
              +63 {displayPhone}
            </span>
          </p>
        </div>

        {error && (
          <div className="p-3 -my-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={pin}
              onChange={(value) => setPin(value)}
              disabled={loading}
            >
              <InputOTPGroup className="gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="w-12 h-12 text-lg border-l rounded-md first:border-l password-field-dot"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="w-full h-12 text-base rounded-md font-medium"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : language === "tl" ? (
              "Pumasok"
            ) : (
              "Log In"
            )}
          </Button>
        </form>
      </div>
    );
  }

  // OTP step
  return (
    <div className="w-full flex flex-col gap-8">
      {/* Back + heading */}
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 -ml-1"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.changeNumber}
        </button>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t.enterCode}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t.sentTo}{" "}
          <span className="font-medium text-foreground text-nowrap">
            +63 {displayPhone}
          </span>
        </p>
      </div>

      {error && (
        <div className="p-3 -my-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
        {/* OTP Slots — large, centered */}
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
            disabled={loading}
          >
            <InputOTPGroup className="gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="w-12 h-12 text-lg border-l rounded-md first:border-l"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full h-12 text-base rounded-md font-medium"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.verify}
        </Button>
      </form>

      {/* Resend */}
      <div className="text-center text-sm text-muted-foreground">
        {t.didNotReceiveCode}{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendTimer > 0}
          className="font-medium text-foreground disabled:text-muted-foreground underline underline-offset-4 disabled:no-underline transition-colors"
        >
          {resendTimer > 0
            ? `${t.resendIn} ${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, "0")}`
            : t.resend}
        </button>
      </div>
    </div>
  );
}
