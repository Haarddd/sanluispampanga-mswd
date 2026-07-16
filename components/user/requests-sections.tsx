"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Minus,
  Plus,
  Send,
  Heart,
  HandHeart,
  Loader2,
  Handshake,
  AlertCircle,
  Upload,
  X,
  CheckCircle2,
  ClipboardList,
  Inbox,
} from "lucide-react";
import { MedicineRequestCard } from "@/components/user/medicine-request-card";
import { SectionHeader } from "@/components/user/section-header";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import {
  fetchMedicines,
  fetchUserRequests,
  submitMedicineRequest,
  submitAssistanceRequest,
} from "@/app/actions/requests";
import { clientCache } from "@/lib/client-cache";

export function RequestsSectionsContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get active tab from URL search parameters, default to "medicine"
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>("medicine");

  useEffect(() => {
    if (tabParam === "medicine" || tabParam === "assistance") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    router.replace(`/requests?tab=${val}`);
  };

  const [quantity, setQuantity] = useState(1);
  const [medicine, setMedicine] = useState<string>("");
  const [assistanceType, setAssistanceType] = useState<string>("");
  const [medicineNotes, setMedicineNotes] = useState<string>("");
  const [assistanceReason, setAssistanceReason] = useState<string>("");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [availableMedicines, setAvailableMedicines] = useState<any[]>(() => {
    return clientCache.getMedicines() ?? [];
  });
  const [medicineRequests, setMedicineRequests] = useState<any[]>(() => {
    return clientCache.getUserRequests()?.medicineRequests ?? [];
  });
  const [assistanceRequests, setAssistanceRequests] = useState<any[]>(() => {
    return clientCache.getUserRequests()?.assistanceRequests ?? [];
  });
  const [loading, setLoading] = useState(() => {
    return !clientCache.getUserRequests();
  });
  const [submittingMed, setSubmittingMed] = useState(false);
  const [submittingAssist, setSubmittingAssist] = useState(false);
  const [showRequestsSheet, setShowRequestsSheet] = useState(false);
  const [isClosingSheet, setIsClosingSheet] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(
          language === "tl"
            ? "Masyadong malaki ang file (Max 5MB)"
            : "File size too large (Max 5MB)",
        );
        return;
      }
      setPrescriptionFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setPrescriptionFile(null);
    setPrescriptionPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeRequestsSheet = () => {
    setIsClosingSheet(true);
    setTimeout(() => {
      setShowRequestsSheet(false);
      setIsClosingSheet(false);
    }, 250);
  };

  useEffect(() => {
    if (showRequestsSheet) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showRequestsSheet]);

  useEffect(() => {
    async function loadData() {
      // 1. Read from client cache first to prevent redundant loader states
      const cachedMeds = clientCache.getMedicines();
      const cachedReqs = clientCache.getUserRequests();

      if (cachedMeds) {
        setAvailableMedicines(cachedMeds);
      }
      if (cachedReqs) {
        setMedicineRequests(cachedReqs.medicineRequests);
        setAssistanceRequests(cachedReqs.assistanceRequests);
        setLoading(false);
      }

      try {
        const [meds, reqs] = await Promise.all([
          cachedMeds ? Promise.resolve(cachedMeds) : fetchMedicines(),
          fetchUserRequests(),
        ]);

        if (meds) {
          clientCache.setMedicines(meds);
          setAvailableMedicines(meds);
        }
        if (reqs) {
          clientCache.setUserRequests(reqs);
          setMedicineRequests(reqs.medicineRequests);
          setAssistanceRequests(reqs.assistanceRequests);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const countWords = (text: string) => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const medicineWordCount = countWords(medicineNotes);
  const assistanceWordCount = countWords(assistanceReason);

  const selectedMedicine = availableMedicines.find((m) => m.id === medicine);
  const maxQuantity = selectedMedicine?.available_quantity ?? 9999;

  const handleMedicineSubmit = async () => {
    if (!medicine) return;

    if (quantity > maxQuantity) {
      const medicineUnit = selectedMedicine?.unit || "units";
      toast.error(
        language === "tl"
          ? `Mayroon lang ${maxQuantity} ${medicineUnit} available na stocks.`
          : `Only ${maxQuantity} ${medicineUnit} available in stock.`,
      );
      return;
    }

    setSubmittingMed(true);
    try {
      const formData = new FormData();
      formData.append("medicineId", medicine);
      formData.append("quantity", quantity.toString());
      formData.append("notes", medicineNotes);
      if (prescriptionFile) {
        formData.append("prescriptionFile", prescriptionFile);
      }

      const res = await submitMedicineRequest(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        setMedicine("");
        setQuantity(1);
        setMedicineNotes("");
        removeFile();
        const reqs = await fetchUserRequests();
        if (reqs) {
          clientCache.setUserRequests(reqs);
          setMedicineRequests(reqs.medicineRequests);
        }
        toast.success(
          language === "tl"
            ? "Matagumpay na naipadala ang kahilingan!"
            : "Request submitted successfully!",
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(
        language === "tl"
          ? "May problema sa pagpadala ng kahilingan."
          : "Failed to submit request.",
      );
    } finally {
      setSubmittingMed(false);
    }
  };

  const handleAssistanceSubmit = async () => {
    if (!assistanceType || !assistanceReason.trim()) return;
    setSubmittingAssist(true);
    try {
      const res = await submitAssistanceRequest(
        assistanceType,
        assistanceReason,
      );
      if (res.error) {
        toast.error(res.error);
      } else {
        setAssistanceType("");
        setAssistanceReason("");
        const reqs = await fetchUserRequests();
        if (reqs) {
          clientCache.setUserRequests(reqs);
          setAssistanceRequests(reqs.assistanceRequests);
        }
        toast.success(
          language === "tl"
            ? "Matagumpay na naipadala ang kahilingan!"
            : "Request submitted successfully!",
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(
        language === "tl"
          ? "May problema sa pagpadala ng kahilingan."
          : "Failed to submit request.",
      );
    } finally {
      setSubmittingAssist(false);
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full flex flex-col gap-6"
    >
      <TabsList className="grid w-full grid-cols-2 h-11 bg-muted p-1 rounded-lg">
        <TabsTrigger
          value="medicine"
          className="gap-2 text-sm font-medium rounded-md"
        >
          <Heart className="h-4 w-4" />
          {t.medicineLabel}
        </TabsTrigger>
        <TabsTrigger
          value="assistance"
          className="gap-2 text-sm font-medium rounded-md"
        >
          <Handshake className="h-4 w-4" />
          {t.assistance}
        </TabsTrigger>
      </TabsList>

      {/* Medicine Tab Content */}
      <TabsContent
        value="medicine"
        className="flex flex-col gap-8 mt-0 pb-24 focus-visible:outline-none"
      >
        {/* Section 1: Request Medicine */}
        <section className="flex flex-col gap-3">
          <SectionHeader title={t.requestMedicine} />
          <div className="rounded border border-border bg-card p-5 flex flex-col gap-5">
            {/* Medicine Selector */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="medicine" className="text-base font-medium">
                {t.medicineLabel}
              </Label>
              <Select value={medicine} onValueChange={setMedicine}>
                <SelectTrigger id="medicine" className="w-full h-10">
                  <SelectValue placeholder={t.selectMedicine} />
                </SelectTrigger>
                <SelectContent>
                  {availableMedicines.map((med) => (
                    <SelectItem key={med.id} value={med.id}>
                      {med.name}{" "}
                      {med.dosage_strength ? `(${med.dosage_strength})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity Stepper */}
            <div className="flex flex-col gap-2">
              <Label className="text-base font-medium">{t.quantity}</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-md"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="h-10 text-center text-lg font-semibold rounded-md"
                  min={1}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-md"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="notes" className="text-base font-medium">
                  {t.notes}{" "}
                  <span className="text-muted-foreground font-normal">
                    {t.optional}
                  </span>
                </Label>
                <span
                  className={`text-sm ${
                    medicineWordCount > 300
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {medicineWordCount} / 300{" "}
                  {language === "tl" ? "salita" : "words"}
                </span>
              </div>
              <Textarea
                id="notes"
                value={medicineNotes}
                onChange={(e) => setMedicineNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                className={`w-full min-h-20 resize-none ${
                  medicineWordCount > 300
                    ? "border-destructive focus-visible:ring-destructive/20"
                    : ""
                }`}
              />
              {medicineWordCount > 300 && (
                <span className="text-xs text-destructive font-medium">
                  {language === "tl"
                    ? "Masyadong mahaba (300 salita max)"
                    : "Too long (300 words max)"}
                </span>
              )}
            </div>

            {/* Prescription Upload */}
            <div className="flex flex-col gap-2">
              <Label className="text-base font-medium flex items-center justify-between">
                <span>
                  {language === "tl"
                    ? "Reseta ng Doktor"
                    : "Doctor's Prescription"}{" "}
                  <span className="text-muted-foreground text-base font-normal">
                    {language === "tl" ? "(opsyonal)" : "(optional)"}
                  </span>
                </span>
              </Label>
              {prescriptionPreview ? (
                <div className="relative rounded-lg overflow-hidden border">
                  <img
                    src={prescriptionPreview}
                    alt="Prescription Preview"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-foreground" />
                  </button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-medium truncate max-w-[200px]">
                      {prescriptionFile?.name}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 h-24 rounded-lg border bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer"
                >
                  <div className="text-center">
                    <p className="text-base font-medium text-foreground">
                      {language === "tl"
                        ? "I-upload ang Reseta"
                        : "Upload Prescription"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG | PNG | WEBP (Max 5MB)
                    </p>
                  </div>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleMedicineSubmit}
              disabled={
                medicineWordCount > 300 ||
                !medicine ||
                submittingMed ||
                quantity > maxQuantity
              }
              className="h-10 w-full text-base font-medium gap-2 rounded-md"
            >
              {submittingMed ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t.submitRequest}
            </Button>
          </div>
        </section>
      </TabsContent>

      {/* Assistance Tab Content */}
      <TabsContent
        value="assistance"
        className="flex flex-col gap-8 mt-0 pb-24 focus-visible:outline-none"
      >
        {/* Section 1: Request Assistance */}
        <section className="flex flex-col gap-3">
          <SectionHeader title={t.requestAssistance} />
          <div className="rounded border border-border bg-card p-5 flex flex-col gap-5">
            {/* Assistance Type Selector */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="assistanceType" className="text-base font-medium">
                {t.assistanceType}
              </Label>
              <Select value={assistanceType} onValueChange={setAssistanceType}>
                <SelectTrigger id="assistanceType" className="w-full h-10">
                  <SelectValue placeholder={t.selectAssistanceType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">{t.medicalHelp}</SelectItem>
                  <SelectItem value="non-medical">
                    {t.nonMedicalHelp}
                  </SelectItem>
                  <SelectItem value="transport">{t.transportHelp}</SelectItem>
                  <SelectItem value="healthcare">{t.healthcareHelp}</SelectItem>
                  <SelectItem value="social">{t.socialHelp}</SelectItem>
                  <SelectItem value="other">{t.otherHelp}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason/Description */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="reason" className="text-base font-medium">
                  {t.assistanceReason}
                </Label>
                <span
                  className={`text-sm ${
                    assistanceWordCount > 500
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {assistanceWordCount} / 500{" "}
                  {language === "tl" ? "salita" : "words"}
                </span>
              </div>
              <Textarea
                id="reason"
                value={assistanceReason}
                onChange={(e) => setAssistanceReason(e.target.value)}
                placeholder={t.assistanceReasonPlaceholder}
                className={`w-full min-h-24 resize-none ${
                  assistanceWordCount > 500
                    ? "border-destructive focus-visible:ring-destructive/20"
                    : ""
                }`}
              />
              {assistanceWordCount > 500 && (
                <span className="text-sm text-destructive font-medium">
                  {language === "tl"
                    ? "Masyadong mahaba (500 salita max)"
                    : "Too long (500 words max)"}
                </span>
              )}
            </div>

            {/* Submit */}
            <Button
              onClick={handleAssistanceSubmit}
              disabled={
                assistanceWordCount > 500 ||
                !assistanceType ||
                !assistanceReason.trim() ||
                submittingAssist
              }
              className="h-10 w-full text-base font-medium gap-2 rounded-md"
            >
              {submittingAssist ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t.submitRequest}
            </Button>
          </div>
        </section>
      </TabsContent>

      {/* Floating Button */}
      <div className="fixed bottom-22 max-w-sm w-full left-1/2 -translate-x-1/2 px-5 flex justify-end pointer-events-none z-40">
        <Button
          onClick={() => setShowRequestsSheet(true)}
          className="relative w-12 h-12 rounded-full shadow-lg flex items-center justify-center pointer-events-auto bg-primary hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Inbox size={24} />
          {(activeTab === "medicine"
            ? medicineRequests.length
            : assistanceRequests.length) > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
              {activeTab === "medicine"
                ? medicineRequests.length
                : assistanceRequests.length}
            </span>
          )}
        </Button>
      </div>

      {/* Bottom Sheet */}
      {showRequestsSheet && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in duration-300"
            onClick={closeRequestsSheet}
          />
          <div
            className={`absolute bottom-0 bg-card rounded-t-2xl max-h-[80vh] w-full max-w-sm flex flex-col border-t border-border ${
              isClosingSheet
                ? "animate-out slide-out-to-bottom duration-300"
                : "animate-in slide-in-from-bottom duration-300"
            }`}
          >
            <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
              <p className="font-semibold text-base text-foreground">
                {activeTab === "medicine"
                  ? language === "tl"
                    ? "Mga Kahilingan sa Gamot"
                    : "Medicine Requests"
                  : language === "tl"
                    ? "Mga Kahilingan sa Tulong"
                    : "Assistance Requests"}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeRequestsSheet}
                className="h-8 w-8 rounded-full hover:bg-muted"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1 flex flex-col gap-3">
              {activeTab === "medicine" ? (
                medicineRequests.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {language === "tl"
                      ? "Walang mga kahilingan sa gamot"
                      : "No medicine requests found"}
                  </div>
                ) : (
                  medicineRequests
                    .slice(0, 3)
                    .map((request) => (
                      <MedicineRequestCard key={request.id} request={request} />
                    ))
                )
              ) : assistanceRequests.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {language === "tl"
                    ? "Walang mga kahilingan sa tulong"
                    : "No assistance requests found"}
                </div>
              ) : (
                assistanceRequests
                  .slice(0, 3)
                  .map((request) => (
                    <MedicineRequestCard key={request.id} request={request} />
                  ))
              )}
            </div>

            <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-between shrink-0">
              <span className="text-xs text-muted-foreground">
                {activeTab === "medicine"
                  ? `${medicineRequests.length} total`
                  : `${assistanceRequests.length} total`}
              </span>
              <Link
                href="/requests/history"
                className="text-sm font-semibold text-primary hover:underline"
                onClick={() => {
                  document.body.style.overflow = "unset";
                  setShowRequestsSheet(false);
                }}
              >
                {t.seeAll}
              </Link>
            </div>
          </div>
        </div>
      )}
    </Tabs>
  );
}

import { Suspense } from "react";

export function RequestsSections() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-6 text-sm text-muted-foreground">
          Loading
        </div>
      }
    >
      <RequestsSectionsContent />
    </Suspense>
  );
}
