"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { Minus, Plus, Send, Heart, HandHeart, Loader2 } from "lucide-react";
import { MedicineRequestCard } from "@/components/user/medicine-request-card";
import { SectionHeader } from "@/components/user/section-header";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchMedicines,
  fetchUserRequests,
  submitMedicineRequest,
  submitAssistanceRequest,
} from "@/app/actions/requests";

export function RequestsSectionsContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get active tab from URL search parameters, default to "medicine"
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>("medicine");

  useEffect(() => {
    if (tabParam === "medicine" || tabParam === "assistance") {
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

  const [availableMedicines, setAvailableMedicines] = useState<any[]>([]);
  const [medicineRequests, setMedicineRequests] = useState<any[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingMed, setSubmittingMed] = useState(false);
  const [submittingAssist, setSubmittingAssist] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [meds, reqs] = await Promise.all([
          fetchMedicines(),
          fetchUserRequests(),
        ]);
        setAvailableMedicines(meds);
        setMedicineRequests(reqs.medicineRequests);
        setAssistanceRequests(reqs.assistanceRequests);
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

  const handleMedicineSubmit = async () => {
    if (!medicine) return;
    setSubmittingMed(true);
    try {
      const res = await submitMedicineRequest(
        medicine,
        quantity,
        medicineNotes,
      );
      if (res.error) {
        alert(res.error);
      } else {
        setMedicine("");
        setQuantity(1);
        setMedicineNotes("");
        // Reload requests
        const reqs = await fetchUserRequests();
        setMedicineRequests(reqs.medicineRequests);
        alert(
          language === "tl"
            ? "Matagumpay na naipadala ang kahilingan!"
            : "Request submitted successfully!",
        );
      }
    } catch (err) {
      console.error(err);
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
        alert(res.error);
      } else {
        setAssistanceType("");
        setAssistanceReason("");
        // Reload requests
        const reqs = await fetchUserRequests();
        setAssistanceRequests(reqs.assistanceRequests);
        alert(
          language === "tl"
            ? "Matagumpay na naipadala ang kahilingan!"
            : "Request submitted successfully!",
        );
      }
    } catch (err) {
      console.error(err);
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
          <HandHeart className="h-4 w-4" />
          {t.assistance}
        </TabsTrigger>
      </TabsList>

      {/* Medicine Tab Content */}
      <TabsContent
        value="medicine"
        className="flex flex-col gap-8 mt-0 focus-visible:outline-none"
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

            {/* Submit */}
            <Button
              onClick={handleMedicineSubmit}
              disabled={medicineWordCount > 300 || !medicine || submittingMed}
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

        {/* Section 2: My Medicine Requests */}
        <section className="flex flex-col gap-3">
          <SectionHeader
            title={t.myRequests}
            actionLabel={t.seeAll}
            actionHref="/requests/history"
          />
          <div className="flex flex-col gap-2.5">
            {medicineRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/30 p-6 text-center text-xs text-muted-foreground italic">
                {language === "tl"
                  ? "Walang mga kahilingan sa gamot"
                  : "No medicine requests found"}
              </div>
            ) : (
              medicineRequests.map((request) => (
                <MedicineRequestCard key={request.id} request={request} />
              ))
            )}
          </div>
        </section>
      </TabsContent>

      {/* Assistance Tab Content */}
      <TabsContent
        value="assistance"
        className="flex flex-col gap-8 mt-0 focus-visible:outline-none"
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

        {/* Section 2: My Assistance Requests */}
        <section className="flex flex-col gap-3">
          <SectionHeader
            title={t.myRequests}
            actionLabel={t.seeAll}
            actionHref="/requests/history"
          />
          <div className="flex flex-col gap-2.5">
            {assistanceRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/30 p-6 text-center text-xs text-muted-foreground italic">
                {language === "tl"
                  ? "Walang mga kahilingan sa tulong"
                  : "No assistance requests found"}
              </div>
            ) : (
              assistanceRequests.map((request) => (
                <MedicineRequestCard key={request.id} request={request} />
              ))
            )}
          </div>
        </section>
      </TabsContent>
    </Tabs>
  );
}

import { Suspense } from "react";

export function RequestsSections() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-6 text-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <RequestsSectionsContent />
    </Suspense>
  );
}
