"use client";

import { useState, useRef } from "react";
import { submitOnboarding } from "@/app/actions/onboarding";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Loader2,
  MapPin,
  Upload,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const SAN_LUIS_BARANGAYS = [
  { name: "Baculas", lat: 15.0150, lng: 120.7680 },
  { name: "Cabagsan", lat: 15.0280, lng: 120.7720 },
  { name: "Cabensaan", lat: 15.0320, lng: 120.7650 },
  { name: "Calantipay", lat: 15.0510, lng: 120.8120 },
  { name: "San Agustin", lat: 15.0290, lng: 120.7810 },
  { name: "San Carlos", lat: 15.0450, lng: 120.8050 },
  { name: "San Isidro", lat: 15.0110, lng: 120.7620 },
  { name: "San Jose", lat: 15.0380, lng: 120.7790 },
  { name: "San Juan", lat: 15.0211, lng: 120.7812 },
  { name: "San Nicolas", lat: 15.0402, lng: 120.7963 },
  { name: "San Roque", lat: 15.0550, lng: 120.8210 },
  { name: "San Sebastian", lat: 15.0312, lng: 120.7915 },
  { name: "Santa Cruz", lat: 15.0211, lng: 120.7712 },
  { name: "Santa Cruz Pambilog", lat: 15.0180, lng: 120.7980 },
  { name: "Santa Lucia", lat: 15.0120, lng: 120.7890 },
  { name: "Santa Monica", lat: 15.0350, lng: 120.8010 },
  { name: "Santa Rita", lat: 15.0480, lng: 120.8190 },
  { name: "Santo Rosario", lat: 15.0420, lng: 120.8110 },
  { name: "Santo Tomas", lat: 15.0253, lng: 120.7854 },
  { name: "Talang", lat: 15.0590, lng: 120.8290 },
];

type Step = "profile" | "pin";

interface FormState {
  fullName: string;
  street: string;
  barangay: string;
  latitude: number | null;
  longitude: number | null;
  idFrontFile: File | null;
  idFrontPreview: string | null;
  idBackFile: File | null;
  idBackPreview: string | null;
  pin: string;
  pinConfirm: string;
}

export default function OnboardingPage() {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<Step>("profile");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  const [form, setForm] = useState<FormState>({
    fullName: "",
    street: "",
    barangay: "",
    latitude: null,
    longitude: null,
    idFrontFile: null,
    idFrontPreview: null,
    idBackFile: null,
    idBackPreview: null,
    pin: "",
    pinConfirm: "",
  });

  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // --- Step 1: Use My Location ---
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError(
        language === "tl"
          ? "Hindi sinusuportahan ng iyong browser ang Geolocation."
          : "Geolocation is not supported by your browser.",
      );
      return;
    }
    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((prev) => ({ ...prev, latitude, longitude }));
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            {
              headers: { "Accept-Language": language === "tl" ? "fil" : "en" },
            },
          );
          const data = await res.json();
          const addr = data.address ?? {};
          const houseNumber = addr.house_number || "";
          const roadName =
            addr.road || addr.pedestrian || addr.footway || addr.path || "";
          const areaName =
            addr.neighbourhood || addr.village || addr.suburb || addr.quarter || "";
          const streetParts = [houseNumber, roadName || areaName].filter(
            Boolean,
          );
          const street = streetParts.join(" ");

          const rawBarangay = addr.city_district || addr.quarter || addr.suburb || addr.village || "";
          const matchedB = SAN_LUIS_BARANGAYS.find(
            (b) =>
              rawBarangay.toLowerCase().includes(b.name.toLowerCase()) ||
              b.name.toLowerCase().includes(rawBarangay.toLowerCase())
          );

          setField("street", street);
          if (matchedB) {
            setField("barangay", matchedB.name);
          } else {
            setField("barangay", "");
          }
        } catch {
          setError(
            language === "tl"
              ? "Hindi makuha ang tirahan. Pakisulat ito nang manu-mano."
              : "Could not fetch address. Please enter it manually.",
          );
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError(
          language === "tl"
            ? "Tinatanggihan ang lokasyon. Pakisulat ito nang manu-mano."
            : "Location access denied. Please enter your address manually.",
        );
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 0 },
    );
  };

  // --- Step 1: File Uploads ---
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(
        language === "tl"
          ? "Mangyaring mag-upload ng JPG, PNG, o WEBP na larawan."
          : "Please upload a JPG, PNG, or WEBP image.",
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(
        language === "tl"
          ? "Dapat mas mababa sa 5MB ang laki ng larawan."
          : "Image must be under 5MB.",
      );
      return;
    }

    setError(null);
    const previewUrl = URL.createObjectURL(file);
    if (side === "front") {
      setField("idFrontFile", file);
      setField("idFrontPreview", previewUrl);
    } else {
      setField("idBackFile", file);
      setField("idBackPreview", previewUrl);
    }
  };

  const removeFile = (side: "front" | "back") => {
    if (side === "front") {
      if (form.idFrontPreview) URL.revokeObjectURL(form.idFrontPreview);
      setField("idFrontFile", null);
      setField("idFrontPreview", null);
      if (frontFileInputRef.current) frontFileInputRef.current.value = "";
    } else {
      if (form.idBackPreview) URL.revokeObjectURL(form.idBackPreview);
      setField("idBackFile", null);
      setField("idBackPreview", null);
      if (backFileInputRef.current) backFileInputRef.current.value = "";
    }
  };

  const [transitioning, setTransitioning] = useState(false);

  // --- Step 1 → Step 2 ---
  const handleProfileNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.fullName.trim()) {
      setError(
        language === "tl"
          ? "Kailangan ang buong pangalan."
          : "Full name is required.",
      );
      return;
    }
    if (!form.idFrontFile || !form.idBackFile) {
      setError(
        language === "tl"
          ? "Mangyaring mag-upload ng harap at likod na larawan ng iyong ID."
          : "Please upload both front and back views of your ID.",
      );
      return;
    }

    setTransitioning(true);
    setTimeout(() => {
      setStep("pin");
      setTransitioning(false);
    }, 600);
  };

  // --- Step 2 → Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.pin.length !== 6) {
      setError(
        language === "tl"
          ? "Ang PIN ay dapat eksaktong 6 na numero."
          : "PIN must be exactly 6 digits.",
      );
      return;
    }
    if (form.pin !== form.pinConfirm) {
      setError(
        language === "tl"
          ? "Hindi nagtutugma ang mga PIN. Pakisubukang muli."
          : "PINs do not match. Please try again.",
      );
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("fullName", form.fullName.trim());
    formData.append("street", form.street);
    formData.append("barangay", form.barangay);
    formData.append("municipality", "San Luis");
    formData.append("province", "Pampanga");
    formData.append("pin", form.pin);
    if (form.latitude !== null) {
      formData.append("latitude", String(form.latitude));
    }
    if (form.longitude !== null) {
      formData.append("longitude", String(form.longitude));
    }
    if (form.idFrontFile) {
      formData.append("idFrontFile", form.idFrontFile);
    }
    if (form.idBackFile) {
      formData.append("idBackFile", form.idBackFile);
    }

    const res = await submitOnboarding(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  // ---- STEP 1: Profile ----
  if (step === "profile") {
    return (
      <div className="flex flex-col flex-1 pb-10">
        {/* Heading */}
        <div className="mb-8 mt-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t.yourDetails}
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            {t.onboardingDesc}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleProfileNext} className="flex flex-col gap-4">
          {/* Personal Info */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName" className="text-base font-medium">
              {t.fullName} <span className="text-destructive font-bold">*</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              required
              placeholder="Juan Dela Cruz"
              value={form.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              className="pl-4 h-12 text-base md:text-base rounded-md"
            />
          </div>

          {/* Address */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="street" className="text-base font-medium">
                  {t.streetAddress}{" "}
                  <span className="text-destructive font-bold">*</span>
                </Label>

                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={locating}
                  className="flex items-center gap-1.5 text-base font-medium text-foreground hover:text-muted-foreground transition-colors disabled:opacity-50"
                >
                  {locating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  {locating ? t.locating : t.useMyLocation}
                </button>
              </div>
              <Input
                id="street"
                type="text"
                placeholder="San Agustin Chapel"
                value={form.street}
                onChange={(e) => setField("street", e.target.value)}
                className="pl-4 h-12 text-base md:text-base rounded-md"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="barangay" className="text-base font-medium">
                {t.barangay}{" "}
                <span className="text-destructive font-bold">*</span>
              </Label>
              <select
                id="barangay"
                required
                value={form.barangay}
                onChange={(e) => {
                  const bName = e.target.value;
                  const found = SAN_LUIS_BARANGAYS.find((b) => b.name === bName);
                  setForm((prev) => ({
                    ...prev,
                    barangay: bName,
                    latitude: found ? found.lat : prev.latitude,
                    longitude: found ? found.lng : prev.longitude,
                  }));
                }}
                className="pl-4 pr-10 h-12 text-base md:text-base rounded-md border border-input bg-background"
              >
                <option value="">
                  {language === "tl" ? "-- Pumili ng Barangay --" : "-- Select Barangay --"}
                </option>
                {SAN_LUIS_BARANGAYS.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-4 h-12 text-base md:text-base rounded-md bg-muted">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <p className="text-muted-foreground">San Luis, Pampanga</p>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex flex-col">
              <Label className="text-base font-medium">
                {t.seniorCitizenId}{" "}
                <span className="text-destructive font-bold">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                {t.onboardingIdSub}
              </p>
            </div>

            {/* FRONT OF ID */}
            <div className="flex flex-col gap-2">
              {form.idFrontPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.idFrontPreview}
                    alt="Front of ID"
                    className="w-full h-45 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile("front")}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-foreground shrink-0" />
                    <span className="text-xs font-medium truncate max-w-[200px]">
                      {form.idFrontFile?.name}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => frontFileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 h-28 rounded-xl border border-dashed border-border bg-muted/40 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {language === "tl" ? "I-upload ang" : "Upload"}{" "}
                      <span className="font-semibold">
                        {language === "tl" ? "Harap" : "Front"}
                      </span>{" "}
                      {language === "tl" ? "na Larawan" : "Photo"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG | PNG | WEBP (Max 5MB)
                    </p>
                  </div>
                </button>
              )}
              <input
                ref={frontFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFileChange(e, "front")}
              />
            </div>

            {/* BACK OF ID */}
            <div className="flex flex-col gap-2">
              {form.idBackPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.idBackPreview}
                    alt="Back of ID"
                    className="w-full h-45 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile("back")}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-foreground shrink-0" />
                    <span className="text-xs font-medium truncate max-w-[200px]">
                      {form.idBackFile?.name}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => backFileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 h-28 rounded-xl border border-dashed border-border bg-muted/40 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {language === "tl" ? "I-upload ang" : "Upload"}{" "}
                      <span className="font-semibold">
                        {language === "tl" ? "Likod" : "Back"}
                      </span>{" "}
                      {language === "tl" ? "na Larawan" : "Photo"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG | PNG | WEBP (Max 5MB)
                    </p>
                  </div>
                </button>
              )}
              <input
                ref={backFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFileChange(e, "back")}
              />
            </div>
          </section>

          <Button
            type="submit"
            disabled={
              !form.fullName.trim() ||
              !form.street.trim() ||
              !form.barangay.trim() ||
              !form.idFrontFile ||
              !form.idBackFile ||
              transitioning
            }
            className="w-full h-12 text-base rounded-md font-medium"
          >
            {transitioning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t.continue
            )}
          </Button>
        </form>
      </div>
    );
  }

  // ---- STEP 2: PIN ----
  return (
    <div className="flex flex-col flex-1 pb-10">
      {/* Heading */}
      <div className="mb-8 mt-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t.createPin}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t.pinDesc}</p>
      </div>

      {error && (
        <div className="mb-6 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        {/* PIN entry — InputOTP for ATM feel */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">
              {t.pinLabel} <span className="text-destructive font-bold">*</span>
            </Label>
            <div className="flex justify-start">
              <InputOTP
                maxLength={6}
                value={form.pin}
                onChange={(v) => setField("pin", v)}
                type={showPin ? "text" : "password"}
              >
                <InputOTPGroup className="gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      isPassword={!showPin}
                      className="w-12 h-12 text-lg border-l rounded-md first:border-l"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">
              {t.confirmPinLabel}{" "}
              <span className="text-destructive font-bold">*</span>
            </Label>
            <div className="flex justify-start">
              <InputOTP
                maxLength={6}
                value={form.pinConfirm}
                onChange={(v) => setField("pinConfirm", v)}
                type={showPin ? "text" : "password"}
              >
                <InputOTPGroup className="gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      isPassword={!showPin}
                      className={`w-12 h-12 text-lg border-l rounded-md first:border-l ${
                        form.pinConfirm.length === 6 &&
                        form.pin !== form.pinConfirm
                          ? "border-destructive text-destructive"
                          : ""
                      }`}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Unified PIN Visibility Toggle */}
            <button
              type="button"
              onClick={() => setShowPin((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mt-1"
            >
              {showPin ? (
                <EyeOff className="w-5 h-5 mt-0.5" />
              ) : (
                <Eye className="w-5 h-5 mt-0.5" />
              )}
              {showPin ? t.hidePins : t.showPins}
            </button>
          </div>
        </section>

        <p className="text-sm text-muted-foreground">{t.pinDisclaimer}</p>

        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            disabled={
              loading ||
              form.pin.length !== 6 ||
              form.pinConfirm.length !== 6 ||
              form.pin !== form.pinConfirm
            }
            className="w-full h-12 text-base rounded-md font-medium"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t.completeRegistration
            )}
          </Button>

          <button
            type="button"
            onClick={() => {
              setStep("profile");
              setError(null);
            }}
            className="underline underline-offset-4 w-full text-base text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            {t.backToDetails}
          </button>
        </div>
      </form>
    </div>
  );
}
