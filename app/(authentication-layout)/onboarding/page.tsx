"use client";

import { useState, useRef } from "react";
import { submitOnboarding } from "@/app/actions/onboarding";
import { signOut } from "@/app/actions/auth";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Phone,
  CalendarIcon,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const SAN_LUIS_BARANGAYS = [
  "Baculas",
  "Cabagsan",
  "Cabensaan",
  "Calantipay",
  "San Agustin",
  "San Carlos",
  "San Isidro",
  "San Jose",
  "San Juan",
  "San Nicolas",
  "San Roque",
  "San Sebastian",
  "Santa Cruz",
  "Santa Cruz Pambilog",
  "Santa Lucia",
  "Santa Monica",
  "Santa Rita",
  "Santo Rosario",
  "Santo Tomas",
  "Talang",
];

type Step = 1 | 2 | 3;

interface FormState {
  // Step 1
  fullName: string;
  birthdate: string;
  sex: string;
  civilStatus: string;
  street: string;
  // Step 2
  emergencyContactName: string;
  emergencyContactNumber: string;
  idFrontFile: File | null;
  idFrontPreview: string | null;
  idBackFile: File | null;
  idBackPreview: string | null;
  // Address coords (from location)
  barangay: string;
  latitude: number | null;
  longitude: number | null;
  // Step 3
  pin: string;
  pinConfirm: string;
}

export default function OnboardingPage() {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationUnlocked, setLocationUnlocked] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const [form, setForm] = useState<FormState>({
    fullName: "",
    birthdate: "",
    sex: "",
    civilStatus: "",
    street: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    idFrontFile: null,
    idFrontPreview: null,
    idBackFile: null,
    idBackPreview: null,
    barangay: "",
    latitude: null,
    longitude: null,
    pin: "",
    pinConfirm: "",
  });

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    new Date(new Date().getFullYear() - 60, 0, 1),
  );

  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const goNext = () => {
    setTransitioning(true);
    setTimeout(() => {
      setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
      setTransitioning(false);
    }, 300);
  };

  const goBack = () => {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  };

  // --- Sign Out / Use Different Number ---
  const handleUseDifferentPhone = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  // --- Use My Location ---
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error(
        language === "tl"
          ? "Hindi sinusuportahan ng iyong browser ang Geolocation."
          : "Geolocation is not supported by your browser.",
      );
      return;
    }
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            {
              headers: { "Accept-Language": "en" },
            },
          );
          const data = await res.json();
          const addr = data.address ?? {};

          // Build street: house number + road
          const houseNumber = addr.house_number || "";
          const roadName =
            addr.road ||
            addr.pedestrian ||
            addr.footway ||
            addr.path ||
            addr.neighbourhood ||
            "";
          const street = [houseNumber, roadName].filter(Boolean).join(" ");

          // Barangay: try multiple Nominatim fields in priority order
          const rawBarangay =
            addr.suburb ||
            addr.quarter ||
            addr.neighbourhood ||
            addr.village ||
            addr.city_district ||
            addr.hamlet ||
            "";

          // Try to match against our known barangays; fall back to raw value
          const matchedBarangay =
            SAN_LUIS_BARANGAYS.find(
              (b) =>
                rawBarangay.toLowerCase().includes(b.toLowerCase()) ||
                b.toLowerCase().includes(rawBarangay.toLowerCase()),
            ) ?? rawBarangay;

          // Single atomic update — lat, lng, street, barangay all together
          setForm((prev) => ({
            ...prev,
            latitude,
            longitude,
            street: street || prev.street,
            barangay: matchedBarangay || prev.barangay,
          }));
        } catch {
          // Even if reverse geocode fails, still save coordinates and unlock
          setForm((prev) => ({ ...prev, latitude, longitude }));
          toast.error(
            language === "tl"
              ? "Hindi makuha ang tirahan. Pakisulat ito nang manu-mano."
              : "Could not fetch address. Please enter it manually.",
          );
        } finally {
          setLocating(false);
          setLocationUnlocked(true);
        }
      },
      () => {
        toast.error(
          language === "tl"
            ? "Tinatanggihan ang lokasyon. Pakisulat ito nang manu-mano."
            : "Location access denied. Please enter your address manually.",
        );
        setLocating(false);
        setLocationUnlocked(true);
      },
      { timeout: 10000, maximumAge: 0 },
    );
  };

  // --- File Uploads ---
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(
        language === "tl"
          ? "Mangyaring mag-upload ng JPG, PNG, o WEBP na larawan."
          : "Please upload a JPG, PNG, or WEBP image.",
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        language === "tl"
          ? "Dapat mas mababa sa 5MB ang laki ng larawan."
          : "Image must be under 5MB.",
      );
      return;
    }
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

  // --- Step 1 Validation ---
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error(
        language === "tl"
          ? "Kailangan ang buong pangalan."
          : "Full name is required.",
      );
      return;
    }
    if (!form.birthdate) {
      toast.error(
        language === "tl"
          ? "Kailangan ang petsa ng kapanganakan."
          : "Date of birth is required.",
      );
      return;
    }
    if (!form.street.trim()) {
      toast.error(
        language === "tl"
          ? "Kailangan ang address."
          : "Street address is required.",
      );
      return;
    }
    goNext();
  };

  // --- Step 2 Validation ---
  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      form.emergencyContactNumber &&
      form.emergencyContactNumber.replace(/\D/g, "").length !== 11
    ) {
      toast.error(
        language === "tl"
          ? "Dapat eksaktong 11 digits ang emergency contact number."
          : "Emergency contact number must be exactly 11 digits.",
      );
      return;
    }
    if (!form.idFrontFile || !form.idBackFile) {
      toast.error(
        language === "tl"
          ? "Mangyaring mag-upload ng harap at likod na larawan ng iyong ID."
          : "Please upload both front and back views of your ID.",
      );
      return;
    }
    goNext();
  };

  // --- Step 3 Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.pin.length !== 6) {
      toast.error(
        language === "tl"
          ? "Ang PIN ay dapat eksaktong 6 na numero."
          : "PIN must be exactly 6 digits.",
      );
      return;
    }
    if (form.pin !== form.pinConfirm) {
      toast.error(
        language === "tl"
          ? "Hindi nagtutugma ang mga PIN."
          : "PINs do not match.",
      );
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("fullName", form.fullName.trim());
    formData.append("birthdate", form.birthdate);
    formData.append("sex", form.sex);
    formData.append("civilStatus", form.civilStatus);
    formData.append("emergencyContactName", form.emergencyContactName);
    formData.append("emergencyContactNumber", form.emergencyContactNumber);
    formData.append("street", form.street);
    formData.append("barangay", form.barangay);
    formData.append("municipality", "San Luis");
    formData.append("province", "Pampanga");
    formData.append("pin", form.pin);
    if (form.latitude !== null)
      formData.append("latitude", String(form.latitude));
    if (form.longitude !== null)
      formData.append("longitude", String(form.longitude));
    if (form.idFrontFile) formData.append("idFrontFile", form.idFrontFile);
    if (form.idBackFile) formData.append("idBackFile", form.idBackFile);

    const res = await submitOnboarding(formData);
    if (res?.error) {
      toast.error(res.error);
      setLoading(false);
    }
  };

  // ── Progress indicator ──
  const stepLabels = [
    language === "tl" ? "Personal" : "Personal",
    language === "tl" ? "Contact & ID" : "Contact & ID",
    language === "tl" ? "PIN" : "PIN",
  ];

  return (
    <div className="flex flex-col flex-1 pb-10">
      {/* Step progress */}
      <div className="mt-6 mb-4 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center gap-1 ${step >= s ? "opacity-100" : "opacity-40"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step > s
                    ? "bg-foreground text-background"
                    : step === s
                      ? "bg-foreground text-background"
                      : "border-2 border-muted-foreground text-muted-foreground"
                }`}
              >
                {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${step === s ? "text-foreground" : "text-muted-foreground"}`}
              >
                {stepLabels[s - 1]}
              </span>
            </div>
            {s < 3 && (
              <div
                className={`h-px flex-1 ${step > s ? "bg-foreground" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ─────────────────── STEP 1 ─────────────────── */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="flex flex-col gap-4 flex-1">
          <div className="">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t.yourDetails}
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              {t.onboardingDesc}
            </p>
          </div>

          {/* Full Name */}
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
              className="h-11 text-base rounded-md"
            />
          </div>

          {/* Date of Birth */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-base font-medium">
              {language === "tl" ? "Petsa ng Kapanganakan" : "Date of Birth"}{" "}
              <span className="text-destructive font-bold">*</span>
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full h-11 justify-start text-base font-normal rounded-md ${
                    !form.birthdate ? "text-muted-foreground" : ""
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {form.birthdate
                    ? format(
                        new Date(form.birthdate + "T00:00:00"),
                        "MMMM d, yyyy",
                      )
                    : language === "tl"
                      ? "Piliin ang petsa"
                      : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  selected={
                    form.birthdate
                      ? new Date(form.birthdate + "T00:00:00")
                      : undefined
                  }
                  onSelect={(date) => {
                    if (date) {
                      const iso = date.toISOString().split("T")[0];
                      setField("birthdate", iso);
                      setCalendarOpen(false);
                    }
                  }}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  disabled={(date) => date > new Date()}
                  startMonth={new Date(1800, 0)}
                  endMonth={new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Sex + Civil Status — same row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sex" className="text-base font-medium">
                {language === "tl" ? "Kasarian" : "Sex"}
              </Label>
              <Select
                value={form.sex}
                onValueChange={(val) => setField("sex", val)}
              >
                <SelectTrigger id="sex" className="h-12 text-base w-full">
                  <SelectValue
                    placeholder={language === "tl" ? "Pumili" : "Select"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">
                    {language === "tl" ? "Lalaki" : "Male"}
                  </SelectItem>
                  <SelectItem value="Female">
                    {language === "tl" ? "Babae" : "Female"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="civilStatus" className="text-base font-medium">
                {language === "tl" ? "Sibil" : "Civil Status"}
              </Label>
              <Select
                value={form.civilStatus}
                onValueChange={(val) => setField("civilStatus", val)}
              >
                <SelectTrigger
                  id="civilStatus"
                  className="h-11 text-base w-full"
                >
                  <SelectValue
                    placeholder={language === "tl" ? "Pumili" : "Select"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">
                    {language === "tl" ? "Binata/Dalaga" : "Single"}
                  </SelectItem>
                  <SelectItem value="Married">
                    {language === "tl" ? "Kasal" : "Married"}
                  </SelectItem>
                  <SelectItem value="Widowed">
                    {language === "tl" ? "Biyudo/Biyuda" : "Widowed"}
                  </SelectItem>
                  <SelectItem value="Separated">
                    {language === "tl" ? "Hiwalay" : "Separated"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                {t.streetAddress}{" "}
                <span className="text-destructive font-bold">*</span>
              </Label>
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={locating}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              >
                {locating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                {locating ? t.locating : t.useMyLocation}
              </button>
            </div>

            {!locationUnlocked && (
              <p className="text-xs text-muted-foreground bg-muted/50 border border-dashed border-border rounded-md px-3 py-2">
                {language === "tl"
                  ? `I-tap ang "Gamitin ang Aking Lokasyon" para ma-enable ang address fields.`
                  : `Tap "Use My Location" to enable the address fields.`}
              </p>
            )}

            <Input
              id="street"
              type="text"
              placeholder={
                language === "tl"
                  ? "Blk 1 Lot 2, San Agustin"
                  : "Blk 1 Lot 2, San Agustin"
              }
              value={form.street}
              disabled={!locationUnlocked}
              onChange={(e) => setField("street", e.target.value)}
              className="h-11 text-base rounded-md disabled:opacity-50"
            />

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="barangay"
                className="text-sm text-muted-foreground"
              >
                {t.barangay}
              </Label>
              <Input
                id="barangay"
                type="text"
                placeholder="San Agustin"
                value={form.barangay}
                disabled={!locationUnlocked}
                onChange={(e) => setField("barangay", e.target.value)}
                className="h-11 text-base rounded-md disabled:opacity-50"
              />
            </div>

            <div className="flex items-center gap-2 px-4 h-11 rounded-md bg-muted">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <p className="text-muted-foreground text-base">
                San Luis, Pampanga
              </p>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <Button
              type="submit"
              disabled={
                !form.fullName.trim() ||
                !form.birthdate ||
                !form.street.trim() ||
                transitioning
              }
              className="w-full h-11 text-base rounded-md font-medium"
            >
              {transitioning ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t.continue
              )}
            </Button>
            <button
              type="button"
              onClick={handleUseDifferentPhone}
              disabled={signingOut}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors text-center disabled:opacity-50"
            >
              {signingOut ? (
                <span className="flex items-center justify-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === "tl" ? "Naglalabas" : "Signing out"}
                </span>
              ) : language === "tl" ? (
                "Gumamit ng ibang numero ng telepono"
              ) : (
                "Use a different phone number"
              )}
            </button>
          </div>
        </form>
      )}

      {/* ─────────────────── STEP 2 ─────────────────── */}
      {step === 2 && (
        <form onSubmit={handleStep2Next} className="flex flex-col gap-4 flex-1">
          <div className="">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {language === "tl" ? "Contact at ID" : "Contact & ID"}
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              {language === "tl"
                ? "Ibigay ang iyong emergency contact at i-upload ang iyong ID."
                : "Provide your emergency contact and upload your ID."}
            </p>
          </div>

          {/* Emergency Contact */}
          <div className="flex flex-col gap-3">
            <Label className="text-base font-medium">
              {language === "tl" ? "Emergency Contact" : "Emergency Contact"}{" "}
              <span className="text-destructive font-bold">*</span>
            </Label>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="emergencyContactName"
                className="text-sm text-muted-foreground"
              >
                {language === "tl" ? "Pangalan" : "Name"}{" "}
                <span className="text-destructive font-bold">*</span>
              </Label>
              <Input
                id="emergencyContactName"
                type="text"
                required
                placeholder="Maria Dela Cruz"
                value={form.emergencyContactName}
                onChange={(e) =>
                  setField("emergencyContactName", e.target.value)
                }
                className="h-11 text-base rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="emergencyContactNumber"
                className="text-sm text-muted-foreground"
              >
                {language === "tl"
                  ? "Numero ng Telepono (11 digits)"
                  : "Phone Number (11 digits)"}{" "}
                <span className="text-destructive font-bold">*</span>
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="emergencyContactNumber"
                  type="tel"
                  required
                  inputMode="numeric"
                  placeholder="09171234567"
                  maxLength={11}
                  value={form.emergencyContactNumber}
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/\D/g, "")
                      .substring(0, 11);
                    setField("emergencyContactNumber", val);
                  }}
                  className="h-11 text-base rounded-md w-full"
                />
              </div>
              {form.emergencyContactNumber.length > 0 &&
                form.emergencyContactNumber.length < 11 && (
                  <p className="text-xs text-muted-foreground">
                    {11 - form.emergencyContactNumber.length}{" "}
                    {language === "tl"
                      ? "digits pa ang kailangan"
                      : "more digits needed"}
                  </p>
                )}
            </div>
          </div>

          {/* ID Upload */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <Label className="text-base font-medium">
                {t.seniorCitizenId}{" "}
                <span className="text-destructive font-bold">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                {t.onboardingIdSub}
              </p>
            </div>

            {/* Front */}
            <div className="flex flex-col gap-2">
              {form.idFrontPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.idFrontPreview}
                    alt="Front of ID"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile("front")}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
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

            {/* Back */}
            <div className="flex flex-col gap-2">
              {form.idBackPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.idBackPreview}
                    alt="Back of ID"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile("back")}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
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
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <Button
              type="submit"
              disabled={
                !form.idFrontFile ||
                !form.idBackFile ||
                !form.emergencyContactName.trim() ||
                form.emergencyContactNumber.length !== 11 ||
                transitioning
              }
              className="w-full h-11 text-base rounded-md font-medium"
            >
              {transitioning ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t.continue
              )}
            </Button>
            <button
              type="button"
              onClick={goBack}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors text-center"
            >
              {language === "tl" ? "Bumalik" : "Go back"}
            </button>
          </div>
        </form>
      )}

      {/* ─────────────────── STEP 3: PIN ─────────────────── */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t.createPin}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t.pinDesc}</p>
          </div>

          {/* PIN */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">
              {language === "tl"
                ? "Lumikha ng 6-digit PIN"
                : "Create 6-digit PIN"}{" "}
              <span className="text-destructive font-bold">*</span>
            </Label>
            <div className="flex justify-start">
              <div className="relative">
                <InputOTP
                  maxLength={6}
                  value={form.pin}
                  onChange={(val) => setField("pin", val)}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        isPassword={!showPin}
                        className="h-11 w-11 text-lg font-bold"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPin ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Confirm PIN */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">
              {language === "tl" ? "Kumpirmahin ang PIN" : "Confirm PIN"}{" "}
              <span className="text-destructive font-bold">*</span>
            </Label>
            <div className="flex justify-start">
              <InputOTP
                maxLength={6}
                value={form.pinConfirm}
                onChange={(val) => setField("pinConfirm", val)}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      isPassword={!showPin}
                      className="h-11 w-11 text-lg font-bold"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {form.pin.length === 6 &&
              form.pinConfirm.length === 6 &&
              form.pin !== form.pinConfirm && (
                <p className="text-xs text-destructive">
                  {language === "tl"
                    ? "Hindi nagtutugma ang mga PIN."
                    : "PINs do not match."}
                </p>
              )}
            {form.pin.length === 6 &&
              form.pinConfirm.length === 6 &&
              form.pin === form.pinConfirm && (
                <p className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {language === "tl"
                    ? "Nagtutugma ang mga PIN!"
                    : "PINs match!"}
                </p>
              )}
          </div>

          <div className="mt-auto pt-4 flex flex-col gap-3">
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
              ) : language === "tl" ? (
                "Isumite ang Aplikasyon"
              ) : (
                "Submit Application"
              )}
            </Button>
            <button
              type="button"
              onClick={goBack}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors text-center"
            >
              {language === "tl" ? "Bumalik" : "Go back"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
