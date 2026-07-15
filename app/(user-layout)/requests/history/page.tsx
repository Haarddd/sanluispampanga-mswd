"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Pill, HandHeart, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/user/status-badge";
import { useLanguage } from "@/context/LanguageContext";
import { fetchUserRequests } from "@/app/actions/requests";
import { clientCache } from "@/lib/client-cache";

export default function RequestsHistoryPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function getStatusLabel(status: string, lang: string) {
    if (status === "pending") return lang === "tl" ? "Pinoproseso" : "Pending";
    if (status === "approved")
      return lang === "tl" ? "Inaprubahan" : "Approved";
    if (status === "completed") return lang === "tl" ? "Tapos na" : "Completed";
    if (status === "rejected")
      return lang === "tl" ? "Tinanggihan" : "Rejected";
    return status;
  }

  function mergeRequests(reqs: any) {
    const meds = (reqs.medicineRequests || []).map((m: any) => ({
      id: `med-${m.id}`,
      type: "medicine",
      title: m.medicineName,
      subtitle: `${m.genericName} · ${m.quantity} ${m.unit}`,
      rawDate: new Date(m.requestDate),
      date: m.requestDate,
      status: m.status,
      statusLabel: getStatusLabel(m.status, language),
      details: m.pharmacistNotes || null,
    }));

    const assists = (reqs.assistanceRequests || []).map((a: any) => ({
      id: `assist-${a.id}`,
      type: "assistance",
      title: a.medicineName, // Mapped to Category name
      subtitle: a.genericName, // Mapped to Description
      rawDate: new Date(a.requestDate),
      date: a.requestDate,
      status: a.status,
      statusLabel: getStatusLabel(a.status, language),
      details: null,
    }));

    return [...meds, ...assists].sort(
      (a, b) => b.rawDate.getTime() - a.rawDate.getTime(),
    );
  }

  useEffect(() => {
    async function loadHistory() {
      const cached = clientCache.getUserRequests();
      if (cached) {
        setHistoryList(mergeRequests(cached));
        setLoading(false);
      }

      try {
        const reqs = await fetchUserRequests();
        if (reqs) {
          clientCache.setUserRequests(reqs);
          setHistoryList(mergeRequests(reqs));
        }
      } catch (err) {
        console.error("Error loading history:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [language]); // Reload to update status labels when language shifts

  return (
    <div className="flex flex-col gap-6 px-5 pt-8 pb-4">
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/requests")}
          className="h-9 w-9 shrink-0 rounded-md"
          title={language === "tl" ? "Bumalik" : "Go back"}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {language === "tl"
              ? "Kasaysayan ng mga Request"
              : "Request History"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {language === "tl"
              ? "Mga nakaraang kahilingan para sa gamot at tulong"
              : "Full record of your medicine and general requests"}
          </p>
        </div>
      </div>

      {/* History List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-4 animate-pulse"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 bg-muted rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-5 bg-muted rounded w-16 shrink-0" />
                </div>
                <div className="mt-3 border-t border-border pt-3 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          historyList.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                    {item.type === "medicine" ? (
                      <Pill className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Handshake className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <StatusBadge variant={item.status} className="shrink-0">
                  {item.statusLabel}
                </StatusBadge>
              </div>

              <div className="mt-3 border-t border-border pt-3 flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {language === "tl" ? "Petsa" : "Date"}
                  </span>
                  <span className="text-foreground font-medium">
                    {item.date}
                  </span>
                </div>
                {item.details && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {language === "tl" ? "Mga detalye" : "Details"}
                    </span>
                    <span className="text-foreground font-medium text-right max-w-[70%]">
                      {item.details}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {!loading && historyList.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {language === "tl"
              ? "Walang mga nakaraang request."
              : "No request history available."}
          </div>
        )}
      </div>
    </div>
  );
}
