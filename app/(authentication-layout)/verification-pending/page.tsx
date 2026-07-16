"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  LogOut,
  RefreshCw,
  Loader2,
  Upload,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { fetchUserProfile } from "@/app/actions/profile";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";

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

export default function VerificationPendingPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [status, setStatus] = useState<string>("PENDING_ADMIN_REVIEW");

  // Resubmission state
  const [resubmitFields, setResubmitFields] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Resubmission Form Inputs
  const [fullName, setFullName] = useState("");
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function checkStatus() {
      const data = await fetchUserProfile();
      if (data?.profile?.verification_status === "APPROVED") {
        router.replace("/");
      } else if (data?.profile) {
        setStatus(data.profile.verification_status);
        setResubmitFields(data.profile.resubmit_fields || []);
      }
      if (data?.idDocument) {
        setRejectionReason(data.idDocument.rejection_reason || "");
      }
    }
    checkStatus();
  }, [router]);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const data = await fetchUserProfile();
      if (data?.profile?.verification_status === "APPROVED") {
        router.replace("/");
      } else if (data?.profile) {
        const newStatus = data.profile.verification_status;
        setStatus(newStatus);
        setResubmitFields(data.profile.resubmit_fields || []);

        // Show current status instead of "updated"
        const statusLabel =
          newStatus === "PENDING_ADMIN_REVIEW"
            ? language === "tl"
              ? "Naghihintay ng pagsusuri"
              : "Pending review"
            : newStatus === "NEEDS_RESUBMISSION"
              ? language === "tl"
                ? "Kailangan ng pagbabago"
                : "Needs resubmission"
              : language === "tl"
                ? "Tinatanggihan"
                : "Rejected";

        toast.info(statusLabel);
        setChecking(false);
      }
      if (data?.idDocument) {
        setRejectionReason(data.idDocument.rejection_reason || "");
      }
    } catch (err) {
      console.error(err);
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setFormError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setFormError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        setLocating(false);
        toast.success(
          language === "tl"
            ? "Nakuha na ang GPS coordinates!"
            : "GPS coordinates pinned successfully!",
        );
      },
      (err) => {
        setFormError(
          language === "tl"
            ? "Hindi makuha ang lokasyon. Pakisiguro na naka-on ang GPS."
            : "Could not retrieve GPS coordinates. Please ensure GPS is enabled.",
        );
        setLocating(false);
      },
    );
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    if (type === "front") {
      setIdFrontFile(file);
      setIdFrontPreview(previewUrl);
    } else {
      setIdBackFile(file);
      setIdBackPreview(previewUrl);
    }
  };

  const handleSubmitResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    // Dynamic Validations
    if (resubmitFields.includes("fullName") && !fullName.trim()) {
      setFormError(
        language === "tl"
          ? "Kailangan ang Buong Pangalan."
          : "Full Name is required.",
      );
      setSubmitting(false);
      return;
    }
    if (resubmitFields.includes("barangay") && !barangay) {
      setFormError(
        language === "tl"
          ? "Pumili ng Barangay."
          : "Barangay selection is required.",
      );
      setSubmitting(false);
      return;
    }
    if (resubmitFields.includes("location") && !latitude) {
      setFormError(
        language === "tl"
          ? "Kailangan i-pin ang GPS location."
          : "GPS Location Pin is required.",
      );
      setSubmitting(false);
      return;
    }
    if (resubmitFields.includes("idFrontFile") && !idFrontFile) {
      setFormError(
        language === "tl"
          ? "I-upload ang harap ng ID."
          : "Government ID Front image is required.",
      );
      setSubmitting(false);
      return;
    }
    if (resubmitFields.includes("pin")) {
      if (pin.length !== 6) {
        setFormError(
          language === "tl"
            ? "Dapat 6-digit ang PIN."
            : "PIN must be exactly 6 digits.",
        );
        setSubmitting(false);
        return;
      }
      if (pin !== pinConfirm) {
        setFormError(
          language === "tl"
            ? "Hindi nagtutugma ang PIN."
            : "PINs do not match.",
        );
        setSubmitting(false);
        return;
      }
    }

    const formData = new FormData();
    if (resubmitFields.includes("fullName"))
      formData.append("fullName", fullName);
    if (resubmitFields.includes("street")) formData.append("street", street);
    if (resubmitFields.includes("barangay"))
      formData.append("barangay", barangay);
    if (resubmitFields.includes("location") && latitude && longitude) {
      formData.append("latitude", latitude.toString());
      formData.append("longitude", longitude.toString());
    }
    if (resubmitFields.includes("idFrontFile") && idFrontFile) {
      formData.append("idFrontFile", idFrontFile);
    }
    if (resubmitFields.includes("idBackFile") && idBackFile) {
      formData.append("idBackFile", idBackFile);
    }
    if (resubmitFields.includes("pin")) formData.append("pin", pin);

    try {
      const { submitResubmission } = await import("@/app/actions/resubmit");
      const res = await submitResubmission(formData);
      if (res.error) {
        setFormError(res.error);
      } else {
        toast.success(
          language === "tl"
            ? "Matagumpay na naipadala ang mga sagot!"
            : "Updates resubmitted successfully!",
        );
        setStatus("PENDING_ADMIN_REVIEW");
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "NEEDS_RESUBMISSION") {
    return (
      <div className="flex flex-col flex-1 justify-center px-5 py-8 gap-6 max-w-md mx-auto">
        <div className="flex flex-col gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400 mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mt-2">
            {language === "tl"
              ? "Kailangan ng Pag-aayos"
              : "Action Required: Update Details"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {language === "tl"
              ? "May mga impormasyon na kailangang ayusin o ibigay muli ayon sa MSWD Admin."
              : "The MSWD social worker requested updates to your profile. Please submit the items below."}
          </p>
        </div>

        {rejectionReason && (
          <div className="border border-orange-200 bg-orange-50/20 dark:border-orange-900/30 dark:bg-orange-950/10 p-3 rounded-lg text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
              {language === "tl"
                ? "PAUNAWA MULA SA ADMIN"
                : "MESSAGE FROM SOCIAL WORKER"}
            </p>
            <p className="text-xs mt-1 text-foreground italic">
              {rejectionReason}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmitResubmit} className="space-y-4 text-left">
          {formError && (
            <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded-lg dark:bg-red-950/20 dark:text-red-400">
              {formError}
            </div>
          )}

          {/* Dynamic Inputs based on resubmitFields */}
          {resubmitFields.includes("fullName") && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {language === "tl" ? "Buong Pangalan" : "Full Name"}
              </label>
              <Input
                type="text"
                placeholder="Juan Dela Cruz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 text-sm"
                required
              />
            </div>
          )}

          {resubmitFields.includes("street") && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {language === "tl"
                  ? "Kalye / Street Address"
                  : "Street Address"}
              </label>
              <Input
                type="text"
                placeholder="Purok 3, Barangay Road"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="h-10 text-sm"
                required
              />
            </div>
          )}

          {resubmitFields.includes("barangay") && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Barangay
              </label>
              <select
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
                className="w-full h-10 border border-input bg-background px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                required
              >
                <option value="">
                  {language === "tl" ? "-- Pumili --" : "-- Select Barangay --"}
                </option>
                {SAN_LUIS_BARANGAYS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          {resubmitFields.includes("location") && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                {language === "tl" ? "GPS Pin Lokasyon" : "GPS Pin Location"}
              </label>
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 h-10 text-xs rounded-md"
                onClick={handleUseLocation}
                disabled={locating}
              >
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4 text-red-500" />
                )}
                {latitude ? (
                  <span className="text-emerald-600 font-medium">
                    {language === "tl" ? "Naka-pin na: " : "Pinned: "}{" "}
                    {latitude.toFixed(4)}, {longitude?.toFixed(4)}
                  </span>
                ) : (
                  <span>
                    {language === "tl"
                      ? "I-pin ang Kasalukuyang Lokasyon"
                      : "Pin Current Location"}
                  </span>
                )}
              </Button>
            </div>
          )}

          {resubmitFields.includes("idFrontFile") && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                {language === "tl"
                  ? "Harap ng Government ID"
                  : "Government ID Front Image"}
              </label>
              <div
                onClick={() => frontInputRef.current?.click()}
                className="border border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-1.5 min-h-[90px]"
              >
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "front")}
                  className="hidden"
                />
                {idFrontPreview ? (
                  <img
                    src={idFrontPreview}
                    alt="ID Front Preview"
                    className="h-16 object-contain rounded-md"
                  />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {language === "tl"
                        ? "Pindutin para mag-upload"
                        : "Click to upload image"}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {resubmitFields.includes("idBackFile") && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                {language === "tl"
                  ? "Likod ng Government ID"
                  : "Government ID Back Image"}
              </label>
              <div
                onClick={() => backInputRef.current?.click()}
                className="border border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-1.5 min-h-[90px]"
              >
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "back")}
                  className="hidden"
                />
                {idBackPreview ? (
                  <img
                    src={idBackPreview}
                    alt="ID Back Preview"
                    className="h-16 object-contain rounded-md"
                  />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {language === "tl"
                        ? "Pindutin para mag-upload"
                        : "Click to upload image"}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {resubmitFields.includes("pin") && (
            <div className="space-y-3 pt-2 border-t">
              <h3 className="text-xs font-bold text-foreground">
                {language === "tl"
                  ? "Baguhin ang 6-Digit PIN"
                  : "Update 6-Digit login PIN"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block">
                    PIN
                  </label>
                  <Input
                    type="password"
                    maxLength={6}
                    placeholder="123456"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="h-10 text-sm tracking-widest text-center"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Kumpirmahin PIN
                  </label>
                  <Input
                    type="password"
                    maxLength={6}
                    placeholder="123456"
                    value={pinConfirm}
                    onChange={(e) =>
                      setPinConfirm(e.target.value.replace(/\D/g, ""))
                    }
                    className="h-10 text-sm tracking-widest text-center"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 text-sm font-semibold rounded-md"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : language === "tl" ? (
                "Ipadala ang mga Pagbabago"
              ) : (
                "Submit Updated Details"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              disabled={loggingOut || submitting}
              className="w-full h-11 text-sm font-semibold rounded-md flex items-center justify-center gap-2"
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  {t.logout}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 justify-center px-6 py-12 gap-6 text-center max-w-sm mx-auto">
      {/* Icon and status badge */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/10 text-amber-600 dark:text-amber-400">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {language === "tl"
            ? "I-verify ang iyong Account"
            : "Verification Pending"}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {status === "REJECTED"
            ? language === "tl"
              ? "Ang iyong pagpaparehistro ay tinanggihan ng MSWD Admin. Mangyaring makipag-ugnayan sa opisina para sa karagdagang detalye."
              : "Your registration has been rejected by the MSWD Admin. Please contact the office for more details."
            : language === "tl"
              ? "Ang iyong pagpaparehistro ay kasalukuyang sinusuri ng MSWD Admin. Makakatanggap ka ng SMS na paalala kapag inaprubahan na ang iyong account."
              : "Your registration is currently under review by the MSWD Admin. You will receive an SMS notification once your account has been approved."}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 mt-4">
        <Button
          onClick={handleCheckStatus}
          disabled={checking}
          className="h-12 text-base font-semibold gap-2 "
        >
          <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
          {language === "tl" ? "Tignan ang Katayuan" : "Check Status"}
        </Button>

        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={loggingOut || checking}
          className="h-12 text-base font-semibold gap-2 "
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              {t.logout}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
