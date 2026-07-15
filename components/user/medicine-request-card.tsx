"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { StatusBadge } from "@/components/user/status-badge";
import { useLanguage } from "@/context/LanguageContext";

type RequestStatus = "pending" | "approved" | "completed" | "rejected";

interface MedicineRequest {
  id: number;
  medicineName: string;
  genericName: string;
  quantity: number;
  unit: string;
  requestDate: string;
  status: RequestStatus;
  notes?: string;
  pharmacistNotes?: string;
  prescriptionUrl?: string;
}

export function MedicineRequestCard({
  request,
}: {
  request: MedicineRequest;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t, language } = useLanguage();

  const statusLabels: Record<RequestStatus, string> = {
    pending: t.pending,
    approved: t.approved,
    completed: t.completed,
    rejected: t.rejected,
  };

  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {request.medicineName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {request.genericName} · {request.quantity} {request.unit}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge variant={request.status}>
            {statusLabels[request.status]}
          </StatusBadge>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t border-border pt-3 flex flex-col gap-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Requested</span>
            <span className="text-foreground font-medium">
              {request.requestDate}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t.quantity}</span>
            <span className="text-foreground font-medium">
              {request.quantity} {request.unit}
            </span>
          </div>
          {request.notes && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t.notes}</span>
              <span className="text-foreground font-medium text-right max-w-[60%]">
                {request.notes}
              </span>
            </div>
          )}
          {request.prescriptionUrl && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                {language === "tl" ? "Reseta" : "Prescription"}
              </span>
              <a
                href={request.prescriptionUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-semibold"
                onClick={(e) => e.stopPropagation()}
              >
                {language === "tl" ? "Tignan ang Reseta" : "View Prescription"}
              </a>
            </div>
          )}
          {request.pharmacistNotes && (
            <div className="mt-1 rounded-lg bg-muted p-2.5">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Pharmacist:</span>{" "}
                {request.pharmacistNotes}
              </p>
            </div>
          )}
        </div>
      )}
    </button>
  );
}
