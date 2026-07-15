"use client";

import React, { useState, useMemo } from "react";
import {
  useAdminStore,
  DigitalId,
  DigitalIdStatus,
} from "@/components/admin/admin-store-provider";
import {
  Search,
  Eye,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  XCircle,
  Printer,
  Download,
  Share2,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusBadges: Record<DigitalIdStatus, { label: string; style: string }> =
  {
    ACTIVE: {
      label: "Active",
      style:
        "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 inline-block text-center",
    },
    REVOKED: {
      label: "Revoked",
      style:
        "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 inline-block text-center",
    },
    EXPIRED: {
      label: "Expired",
      style:
        "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 inline-block text-center",
    },
  };

export default function DigitalIdsPage() {
  const {
    digitalIds,
    seniors,
    batchGenerateDigitalIds,
    revokeDigitalId,
    renewDigitalId,
    addToast,
  } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<DigitalIdStatus | "ALL">(
    "ALL",
  );
  const [viewingId, setViewingId] = useState<DigitalId | null>(null);

  const formatCardNumber = (num: string) => {
    if (!num) return "";
    return num.replace(/(\d{3})(\d{3})(\d{3})/, "$1-$2-$3");
  };

  // Map user IDs to senior names for fast lookups
  const seniorsMap = useMemo(() => {
    const map = new Map<string, (typeof seniors)[0]>();
    seniors.forEach((s) => map.set(s.id, s));
    return map;
  }, [seniors]);

  // Compute how many verified seniors don't have an active digital ID
  const pendingGenerationCount = useMemo(() => {
    const verified = seniors.filter(
      (s) => s.verification_status === "APPROVED",
    );
    const activeIdsUserIds = new Set(
      digitalIds.filter((d) => d.status === "ACTIVE").map((d) => d.user_id),
    );
    return verified.filter((s) => !activeIdsUserIds.has(s.id)).length;
  }, [seniors, digitalIds]);

  const filteredIds = useMemo(() => {
    return digitalIds.filter((idCard) => {
      const senior = seniorsMap.get(idCard.user_id);
      const name = senior?.full_name ?? "";
      const phone = senior?.phone ?? "";

      const matchSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idCard.id_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery);

      const matchStatus =
        selectedStatus === "ALL" || idCard.status === selectedStatus;

      return matchSearch && matchStatus;
    });
  }, [digitalIds, searchQuery, selectedStatus, seniorsMap]);

  const selectedSeniorForId = useMemo(() => {
    if (!viewingId) return null;
    return seniorsMap.get(viewingId.user_id) || null;
  }, [viewingId, seniorsMap]);

  const handlePrint = (idNumber: string) => {
    addToast(`Triggered print layout for ID Card ${idNumber}...`, "info");
  };

  return (
    <div className="space-y-5">
      {/* Page Title Header */}
      <div>
        <h1 className="text-xl font-semibold">Digital IDs</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Generate unique QR-enabled digital cards for institutions to instantly
          verify senior citizens benefits status.
        </p>
      </div>

      {/* Batch Generation Alert Banner */}
      {pendingGenerationCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400 truncate">
              {pendingGenerationCount} recently verified seniors do not have a
              digital ID.
            </p>
          </div>
          <Button
            size="sm"
            onClick={batchGenerateDigitalIds}
            className="h-8 text-xs font-semibold rounded-md"
          >
            Batch Generate {pendingGenerationCount} IDs
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, phone, card number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-10 mb-0.5"
          />
        </div>
        <Select
          value={selectedStatus}
          onValueChange={(val) => setSelectedStatus(val as any)}
        >
          <SelectTrigger className="w-full sm:w-[180px] h-10">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="REVOKED">Revoked</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* IDs Registry Table */}
      <div className="border bg-card rounded-t-lg overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-muted-foreground text-xs bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Card Number
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Senior Name
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Issue Date
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Expiry Date
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  ID Status
                </th>
                <th className="px-4 py-3 font-medium text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredIds.map((idCard) => {
                const senior = seniorsMap.get(idCard.user_id);
                const badge = statusBadges[idCard.status];
                return (
                  <tr
                    key={idCard.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {formatCardNumber(idCard.id_number)}
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {senior?.full_name ?? "Unknown Senior"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {idCard.issue_date}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {idCard.expiry_date}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={badge.style}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-semibold rounded-md border"
                          onClick={() => setViewingId(idCard)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>

                        {idCard.status === "ACTIVE" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border rounded-md"
                            title="Revoke Digital Credentials"
                            onClick={() => revokeDigitalId(idCard.id)}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Revoke
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border rounded-md"
                            title="Renew Digital Credentials"
                            onClick={() => renewDigitalId(idCard.id)}
                          >
                            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Renew
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredIds.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground text-xs"
                  >
                    No digital identification records found matching the query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DIGITAL ID PREVIEW MODAL (CSS Government Wallet Card) --- */}
      {viewingId && selectedSeniorForId && (
        <Dialog open onOpenChange={(open) => !open && setViewingId(null)}>
          <DialogContent className="!max-w-lg w-full p-0 rounded-sm overflow-hidden flex flex-col">
            <div className="flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
                <h2 className="font-semibold text-sm">
                  Verified Digital ID Details
                </h2>
              </div>

              {/* Wallet Card Body Container */}
              <div className="p-6 flex flex-col items-center justify-start bg-muted/20 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-6 w-full items-center">
                  {/* FRONT CARD */}
                  <div className="w-full max-w-[380px] aspect-[1.586/1] rounded-2xl border border-zinc-200 bg-gradient-to-tr from-[#e0f2fe] via-[#f8fafc] to-[#fef3c7] shadow-md relative overflow-hidden flex flex-col font-sans shrink-0 z-10 isolate text-zinc-900">
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
                    <div className="px-4 py-2 bg-white border-b border-zinc-200 flex items-center gap-3 shrink-0 z-10 rounded-t-[14px]">
                      {/* Left: MSWD logo */}
                      <img
                        src="/mswd.png"
                        alt="MSWD Logo"
                        className="h-10 w-10 object-contain shrink-0"
                      />

                      {/* Center Info */}
                      <div className="flex-1 text-center leading-normal">
                        <h5 className="text-xs leading-none">
                          Province of Pampanga
                        </h5>
                        <h4 className="text-xs leading-none">
                          Municipality of San Luis
                        </h4>
                        <p className="text-sm mt-1 font-bold leading-none">
                          Senior Citizen Digital ID
                        </p>
                      </div>

                      {/* Right: SLP logo */}
                      <img
                        src="/slp.png"
                        alt="San Luis Pampanga Logo"
                        className="h-10 w-10 object-contain shrink-0"
                      />
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex flex-col flex-1 min-h-0 z-10 text-left">
                      {/* Bottom Row: Photo (left) and Details (right) */}
                      <div className="flex gap-4 flex-1 items-center">
                        {/* Left: Photo */}
                        <div className="shrink-0 flex flex-col items-center">
                          {/* Card Number directly on top of Photo */}
                          <div className="text-center">
                            <span className="text-sm font-medium">
                              {formatCardNumber(viewingId.id_number)}
                            </span>
                          </div>

                          <div className="h-28 w-24 bg-white border border-zinc-200 rounded-lg flex flex-col items-center justify-center select-none relative shadow-xs">
                            <User className="h-8 w-8" />
                            <span className="text-xs">Photo</span>
                          </div>
                        </div>

                        {/* Right: Details (aligned horizontally with Photo) */}
                        <div className="flex-1 flex flex-col gap-2 min-w-0 mt-5">
                          <div>
                            <span className="text-xs font-medium">
                              Full Name
                            </span>
                            <span className="text-base font-medium block">
                              {selectedSeniorForId.full_name}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-medium block">
                              Address
                            </span>
                            <span className="text-base font-medium block">
                              {selectedSeniorForId.address.street
                                ? `${selectedSeniorForId.address.street}, `
                                : ""}
                              Brgy. {selectedSeniorForId.address.barangay}, San
                              Luis, Pampanga
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BACK CARD */}
                  <div className="w-full max-w-[380px] aspect-[1.586/1] rounded-2xl border border-zinc-200 bg-gradient-to-tr from-[#e0f2fe] via-[#f8fafc] to-[#fef3c7] shadow-md relative overflow-hidden flex flex-col font-sans shrink-0 text-zinc-900 z-10 isolate">
                    {/* Ghosted Watermark Seal */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none">
                      <img
                        src="/mswd.png"
                        alt="Watermark"
                        className="w-56 h-56 object-contain"
                      />
                    </div>

                    <div className="bg-white border-b border-zinc-200 px-4 py-2 text-center shrink-0 z-10 rounded-t-[14px]">
                      <span className="text-sm font-medium">
                        Municipal Social Welfare and Development Office
                      </span>
                    </div>

                    <div className="p-4 flex gap-4 flex-1 items-start min-h-0 z-10">
                      {/* Left: Mock QR Code (Larger) */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className="h-36 w-36 bg-white p-2.5 border border-zinc-200 rounded-xl shadow-sm flex items-center justify-center select-none overflow-hidden">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://mswdsanluispampanga.vercel.app/verify/${viewingId.id_number}`}
                            alt="Citizen Verification QR"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <span className="text-sm font-medium">
                          REF ID: {viewingId.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>

                      {/* Right: Dates stacked vertically next to QR code */}
                      <div className="flex-1 flex flex-col gap-3 pt-2 z-10 text-left justify-center">
                        <div>
                          <span className="text-xs block font-medium">
                            Date of Issue
                          </span>
                          <span className="text-base font-medium ">
                            {viewingId.issue_date}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs block font-medium">
                            Date of Expiry
                          </span>
                          <span className="text-base font-medium ">
                            {viewingId.expiry_date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Bottom Print/Download Footer */}
              <div className="px-6 py-3 border-t bg-muted/20 flex justify-between shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold rounded-md"
                  onClick={() => setViewingId(null)}
                >
                  Close Preview
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold rounded-md"
                    onClick={() => handlePrint(viewingId.id_number)}
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold rounded-md"
                    onClick={() =>
                      addToast("Downloaded PDF layout...", "success")
                    }
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" /> PDF
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 text-xs font-semibold rounded-md bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                    onClick={() =>
                      addToast("Link copied to clipboard...", "success")
                    }
                  >
                    <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
