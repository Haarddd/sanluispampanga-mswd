"use client";

import React, { useState, useMemo } from "react";
import {
  useAdminStore,
  MedicineRequest,
  AssistanceRequest,
  MedicineRequestStatus,
  AssistanceRequestStatus,
} from "@/components/admin/admin-store-provider";
import {
  Search,
  Eye,
  Check,
  X,
  Clipboard,
  MapPin,
  Phone,
  FileText,
  User,
  Pill,
  Clock,
  AlertTriangle,
  Navigation,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  IN_PROGRESS: "In Progress",
};

const medStatusColors: Record<MedicineRequestStatus, string> = {
  PENDING:
    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 inline-block text-center",
  APPROVED:
    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 inline-block text-center",
  COMPLETED:
    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 inline-block text-center",
  REJECTED:
    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 inline-block text-center",
};

const astStatusColors: Record<AssistanceRequestStatus, string> = {
  PENDING:
    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 inline-block text-center",
  IN_PROGRESS:
    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 inline-block text-center",
  COMPLETED:
    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 inline-block text-center",
  REJECTED:
    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 inline-block text-center",
};

export default function RequestQueuePage() {
  const {
    medicineRequests,
    assistanceRequests,
    seniors,
    medicines,
    updateMedicineRequestStatus,
    updateAssistanceRequestStatus,
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState<"medicine" | "assistance">(
    "medicine",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("ALL");

  // Details Modal States
  const [selectedMedReq, setSelectedMedReq] = useState<MedicineRequest | null>(
    null,
  );
  const [selectedAstReq, setSelectedAstReq] =
    useState<AssistanceRequest | null>(null);

  // Rejection notes / Notes editing state
  const [adminNotes, setAdminNotes] = useState("");

  // Lightbox Image Dialog
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Rejection confirmation states
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(
    null,
  );
  const [rejectingRequestType, setRejectingRequestType] = useState<
    "medicine" | "assistance" | null
  >(null);
  const [rejectionNotes, setRejectionNotes] = useState("");

  // Completion confirmation states
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false);
  const [completingRequestId, setCompletingRequestId] = useState<string | null>(
    null,
  );
  const [completingRequestType, setCompletingRequestType] = useState<
    "medicine" | "assistance" | null
  >(null);

  // Map seniors for rapid name lookup
  const seniorsMap = useMemo(() => {
    const map = new Map<string, (typeof seniors)[0]>();
    seniors.forEach((s) => map.set(s.id, s));
    return map;
  }, [seniors]);

  // Map medicines for name lookup
  const medicinesMap = useMemo(() => {
    const map = new Map<string, (typeof medicines)[0]>();
    medicines.forEach((m) => map.set(m.id, m));
    return map;
  }, [medicines]);

  // Filter medicine requests
  const filteredMedRequests = useMemo(() => {
    return medicineRequests.filter((r) => {
      const senior = seniorsMap.get(r.user_id);
      const med = medicinesMap.get(r.medicine_id);
      const name = senior?.full_name ?? "";
      const medName = med?.name ?? "";

      const matchSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        medName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        selectedStatusFilter === "ALL" || r.status === selectedStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [
    medicineRequests,
    searchQuery,
    selectedStatusFilter,
    seniorsMap,
    medicinesMap,
  ]);

  // Filter assistance requests
  const filteredAstRequests = useMemo(() => {
    return assistanceRequests.filter((r) => {
      const senior = seniorsMap.get(r.user_id);
      const name = senior?.full_name ?? "";

      const matchSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        selectedStatusFilter === "ALL" || r.status === selectedStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [assistanceRequests, searchQuery, selectedStatusFilter, seniorsMap]);

  const handleOpenMedReq = (req: MedicineRequest) => {
    setSelectedMedReq(req);
    setAdminNotes(req.pharmacist_notes || "");
  };

  const handleOpenAstReq = (req: AssistanceRequest) => {
    setSelectedAstReq(req);
    setAdminNotes(""); // Reset notes
  };

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold">Request Queue</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Process senior citizens applications for prescription drugs
          dispensing, medical transports, and food packages distributions.
        </p>
      </div>

      {/* Main Mode Tabs styled border-bottom */}
      <div className="flex gap-2 border-b">
        {[
          { id: "medicine", label: "Medicine Requests" },
          { id: "assistance", label: "Assistance Requests" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveTab(item.id as any);
              setSelectedStatusFilter("ALL");
              setSearchQuery("");
            }}
            className={cn(
              "flex items-center px-1 py-2 border-b-2 transition-colors -mb-px text-sm font-medium",
              activeTab === item.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Toolbar filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch mb-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={
              activeTab === "medicine"
                ? "Search by senior name, drug brand, request ID..."
                : "Search by senior name, assistance category..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-10 mb-0.5"
          />
        </div>

        {/* Filters depending on active queue */}
        <Select
          value={selectedStatusFilter}
          onValueChange={setSelectedStatusFilter}
        >
          <SelectTrigger className="w-full sm:w-[180px] h-10">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            {activeTab === "medicine" ? (
              <>
                <SelectItem value="ALL">All Requests</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="ALL">All Requests</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* --- MEDICINE REQUESTS TABLE --- */}
      {activeTab === "medicine" && (
        <div className="border bg-card rounded-t-lg overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-muted-foreground text-xs bg-muted/40 text-left">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Applicant Name
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Requested Medicine
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Quantity
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Request Date
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-right whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {filteredMedRequests.map((req) => {
                  const senior = seniorsMap.get(req.user_id);
                  const med = medicinesMap.get(req.medicine_id);
                  const badgeClass = medStatusColors[req.status];
                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {senior?.full_name ?? "Unknown Senior"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {med?.name ?? "Unknown Compound"}
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {req.quantity}{" "}
                        <span className="text-sm text-muted-foreground font-normal">
                          {med?.unit || "unit"}(s)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(req.request_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={badgeClass}>
                          {statusLabels[req.status] || req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-semibold rounded-md border"
                          onClick={() => handleOpenMedReq(req)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View Request
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filteredMedRequests.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-muted-foreground text-xs"
                    >
                      No medicine assistance applications recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ASSISTANCE REQUESTS TABLE --- */}
      {activeTab === "assistance" && (
        <div className="border bg-card rounded-t-lg overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-muted-foreground text-xs bg-muted/40 text-left">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Category
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Applicant Name
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Urgency
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Description
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Request Date
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-right whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {filteredAstRequests.map((req) => {
                  const senior = seniorsMap.get(req.user_id);
                  const badgeClass = astStatusColors[req.status];
                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 bg-muted text-xs border rounded-sm font-semibold text-foreground">
                          {req.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {senior?.full_name ?? "Unknown Senior"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {req.urgency_level === "Urgent" ? (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-sm">
                            URGENT
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Normal
                          </span>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-muted-foreground max-w-xs truncate whitespace-nowrap"
                        title={req.description}
                      >
                        {req.description}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={badgeClass}>
                          {statusLabels[req.status] || req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-semibold rounded-md border"
                          onClick={() => handleOpenAstReq(req)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View Request
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filteredAstRequests.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-muted-foreground text-xs"
                    >
                      No general assistance requests recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MEDICINE REQUEST DETAILS DIALOG --- */}
      {selectedMedReq && (
        <Dialog open onOpenChange={(open) => !open && setSelectedMedReq(null)}>
          <DialogContent className="!max-w-xl w-full p-0 rounded-sm overflow-hidden flex flex-col">
            <div className="flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
                <h2 className="font-semibold text-sm">
                  Request #{selectedMedReq.id} Details
                </h2>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
                {(() => {
                  const senior = seniorsMap.get(selectedMedReq.user_id);
                  const med = medicinesMap.get(selectedMedReq.medicine_id);
                  if (!senior || !med) return null;

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                        {/* Applicant Name */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              Applicant Name
                            </span>
                            <span className="font-medium text-foreground">
                              {senior.full_name} ({senior.age}yo)
                            </span>
                          </div>
                        </div>

                        {/* Phone Number */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Phone className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              Phone Number
                            </span>
                            <span className="font-medium text-foreground">
                              {senior.phone}
                            </span>
                          </div>
                        </div>

                        {/* Full Address */}
                        <div className="flex items-center gap-3 md:col-span-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              Full Address
                            </span>
                            <span className="font-medium text-foreground">
                              Brgy. {senior.address.barangay}, San Luis,
                              Pampanga
                            </span>
                          </div>
                        </div>

                        <div className="border-t md:col-span-2 my-1" />

                        {/* Requested Medicine */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Pill className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              Requested Medicine
                            </span>
                            <span className="font-medium text-foreground">
                              {med.name} ({med.dosage_strength})
                            </span>
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Clipboard className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              Quantity Requested
                            </span>
                            <span className="font-medium text-foreground">
                              {selectedMedReq.quantity} {med.unit}(s)
                            </span>
                          </div>
                        </div>

                        {/* Available Stock */}
                        <div className="flex items-center gap-3 md:col-span-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              Current Inventory Stock
                            </span>
                            <span className="font-medium text-foreground">
                              {med.available_quantity} {med.unit}(s) available
                            </span>
                          </div>
                        </div>

                        <div className="border-t md:col-span-2 my-1" />

                        {/* Reason */}
                        <div className="flex items-start gap-3 md:col-span-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground mt-0.5">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              Reason for Application
                            </span>
                            <p className="font-medium text-foreground">
                              {selectedMedReq.reason}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Prescription simulated file upload */}
                      <div className="border bg-muted/20 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div>
                            <h5 className="font-semibold text-sm">
                              Doctor's Medical Prescription
                            </h5>
                            <p className="text-xs text-muted-foreground">
                              prescription_scanned_copy.png
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-sm"
                          onClick={() =>
                            setLightboxImage(
                              selectedMedReq.prescription_url || "/mswd.png",
                            )
                          }
                        >
                          Inspect Attachment
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Bottom Actions */}
              <div className="px-6 py-3 border-t bg-muted/20 flex w-full shrink-0">
                {selectedMedReq.status === "PENDING" && (
                  <div className="grid grid-cols-2 w-full gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => {
                        setRejectingRequestId(selectedMedReq.id);
                        setRejectingRequestType("medicine");
                        setIsRejectConfirmOpen(true);
                        setRejectionNotes("");
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-10 text-sm"
                      onClick={() => {
                        updateMedicineRequestStatus(
                          selectedMedReq.id,
                          "APPROVED",
                          adminNotes,
                        );
                        setSelectedMedReq(null);
                      }}
                    >
                      Approve
                    </Button>
                  </div>
                )}

                {selectedMedReq.status === "APPROVED" && (
                  <div className="grid grid-cols-2 w-full gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => {
                        setRejectingRequestId(selectedMedReq.id);
                        setRejectingRequestType("medicine");
                        setIsRejectConfirmOpen(true);
                        setRejectionNotes("");
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-10 text-sm"
                      onClick={() => {
                        setCompletingRequestId(selectedMedReq.id);
                        setCompletingRequestType("medicine");
                        setIsCompleteConfirmOpen(true);
                      }}
                    >
                      Mark as Completed
                    </Button>
                  </div>
                )}

                {selectedMedReq.status === "COMPLETED" && (
                  <div className="text-sm text-muted-foreground font-medium py-1">
                    This request has been completed. No further changes allowed.
                  </div>
                )}

                {selectedMedReq.status === "REJECTED" && (
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium py-1">
                    This request has been rejected. No further changes allowed.
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* --- ASSISTANCE REQUEST DETAILS DIALOG --- */}
      {selectedAstReq && (
        <Dialog open onOpenChange={(open) => !open && setSelectedAstReq(null)}>
          <DialogContent className="!max-w-xl w-full p-0 rounded-sm overflow-hidden flex flex-col">
            <div className="flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
                <h2 className="font-semibold text-sm">
                  Welfare Service Request Details
                </h2>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
                {(() => {
                  const senior = seniorsMap.get(selectedAstReq.user_id);
                  if (!senior) return null;

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                        {/* Applicant Name */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              Applicant Name
                            </span>
                            <span className="font-medium text-foreground">
                              {senior.full_name} ({senior.age}yo)
                            </span>
                          </div>
                        </div>

                        {/* Phone Number */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Phone className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              Phone Number
                            </span>
                            <span className="font-medium text-foreground">
                              {senior.phone}
                            </span>
                          </div>
                        </div>

                        {/* Full Address */}
                        <div className="flex items-center gap-3 md:col-span-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              Full Address
                            </span>
                            <span className="font-medium text-foreground">
                              Brgy. {senior.address.barangay}, San Luis,
                              Pampanga
                            </span>
                          </div>
                        </div>

                        <div className="border-t md:col-span-2 my-1" />

                        {/* Category */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Clipboard className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              Assistance Category
                            </span>
                            <span className="font-medium text-foreground">
                              {selectedAstReq.category}
                            </span>
                          </div>
                        </div>

                        {/* Urgency */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              Urgency Status
                            </span>
                            <span className="font-medium text-foreground">
                              {selectedAstReq.urgency_level}
                            </span>
                          </div>
                        </div>

                        {/* GPS Coordinates */}
                        <div className="flex items-center gap-3 md:col-span-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Navigation className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              GPS Coordinates
                            </span>
                            <span className="font-medium text-foreground">
                              {senior.address.latitude},{" "}
                              {senior.address.longitude}
                            </span>
                          </div>
                        </div>

                        <div className="border-t md:col-span-2 my-1" />

                        {/* Description */}
                        <div className="flex items-start gap-3 md:col-span-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground mt-0.5">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">
                              Welfare Request Description
                            </span>
                            <p className="font-medium text-foreground mt-0.5">
                              {selectedAstReq.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Coordinates location mapping simulator */}
                      <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
                        <h5 className="font-semibold text-xs flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                          Dispatch Location coordinates
                        </h5>
                        <div className="text-xs text-muted-foreground">
                          GPS coordinates:{" "}
                          <span className="font-bold text-foreground">
                            {senior.address.latitude},{" "}
                            {senior.address.longitude}
                          </span>
                        </div>
                        {/* Simulated Map image box */}
                        <div className="h-20 bg-muted border rounded-sm flex items-center justify-center text-xs text-muted-foreground select-none">
                          San Luis Brgy. {senior.address.barangay} Map Preview
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Assigned to admin field */}
                {selectedAstReq.assigned_to && (
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      Assigned Dispatcher
                    </span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {selectedAstReq.assigned_to} (Municipal Field Team)
                    </p>
                  </div>
                )}

                {/* Action Notes */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground text-xs">
                    Welfare Dispatch Notes
                  </label>
                  <Textarea
                    placeholder="Enter dispatch notes, delivery logs, or action details..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    className="text-xs rounded-md"
                  />
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="px-6 py-3 border-t bg-muted/20 flex w-full shrink-0">
                {selectedAstReq.status === "PENDING" && (
                  <div className="grid grid-cols-2 w-full gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => {
                        setRejectingRequestId(selectedAstReq.id);
                        setRejectingRequestType("assistance");
                        setIsRejectConfirmOpen(true);
                        setRejectionNotes("");
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-10 text-sm"
                      onClick={() => {
                        updateAssistanceRequestStatus(
                          selectedAstReq.id,
                          "IN_PROGRESS",
                          adminNotes,
                          "AD-01",
                        );
                        setSelectedAstReq(null);
                      }}
                    >
                      Assign to Me
                    </Button>
                  </div>
                )}

                {selectedAstReq.status === "IN_PROGRESS" && (
                  <div className="grid grid-cols-2 w-full gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => {
                        setRejectingRequestId(selectedAstReq.id);
                        setRejectingRequestType("assistance");
                        setIsRejectConfirmOpen(true);
                        setRejectionNotes("");
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-10 text-sm"
                      onClick={() => {
                        setCompletingRequestId(selectedAstReq.id);
                        setCompletingRequestType("assistance");
                        setIsCompleteConfirmOpen(true);
                      }}
                    >
                      Mark as Completed
                    </Button>
                  </div>
                )}

                {selectedAstReq.status === "COMPLETED" && (
                  <div className="text-sm text-muted-foreground font-medium py-1">
                    This request has been completed. No further changes allowed.
                  </div>
                )}

                {selectedAstReq.status === "REJECTED" && (
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium py-1">
                    This request has been rejected. No further changes allowed.
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {lightboxImage && (
        <Dialog open onOpenChange={(open) => !open && setLightboxImage(null)}>
          <DialogContent
            className="max-w-xl sm:max-w-xl w-full p-2 bg-zinc-950 border-none rounded-md"
            showCloseButton={false}
            onPointerDownOutside={(e) => e.preventDefault()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImage(null);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-2 right-2 "
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="relative w-full max-h-[70vh] min-h-[300px] mt-10 overflow-hidden rounded-sm flex items-center justify-center">
              {lightboxImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lightboxImage}
                  alt="Attachment Image"
                  className="max-w-full max-h-[60vh] object-contain rounded-md"
                />
              ) : (
                <div className="text-zinc-500 text-xs">No image file found</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* --- CONFIRM REJECT MODAL --- */}
      {isRejectConfirmOpen && (
        <Dialog
          open
          onOpenChange={(open) => !open && setIsRejectConfirmOpen(false)}
        >
          <DialogContent
            className="max-w-sm gap-0 p-0 rounded-sm"
            showCloseButton={false}
            onPointerDownOutside={(e) => e.preventDefault()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <DialogHeader className="flex flex-row items-center justify-between px-6 py-3 border-b space-y-0">
              <DialogTitle className="font-semibold text-sm">
                Confirm Request Rejection
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground block font-semibold">
                  Reason for Rejection
                </label>
                <Textarea
                  required
                  placeholder="e.g. Incomplete prescription details, invalid documents, or requested dosage not matching prescription."
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-9 text-sm w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRejectConfirmOpen(false);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="h-9 text-sm w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  disabled={!rejectionNotes.trim()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      rejectingRequestType === "medicine" &&
                      rejectingRequestId
                    ) {
                      updateMedicineRequestStatus(
                        rejectingRequestId,
                        "REJECTED",
                        rejectionNotes,
                      );
                      setSelectedMedReq(null);
                    } else if (
                      rejectingRequestType === "assistance" &&
                      rejectingRequestId
                    ) {
                      updateAssistanceRequestStatus(
                        rejectingRequestId,
                        "REJECTED",
                        rejectionNotes,
                      );
                      setSelectedAstReq(null);
                    }
                    setIsRejectConfirmOpen(false);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  type="button"
                >
                  Reject Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* --- CONFIRM COMPLETE MODAL --- */}
      {isCompleteConfirmOpen && (
        <Dialog
          open
          onOpenChange={(open) => !open && setIsCompleteConfirmOpen(false)}
        >
          <DialogContent
            className="max-w-sm gap-0 p-0 rounded-sm"
            showCloseButton={false}
            onPointerDownOutside={(e) => e.preventDefault()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <DialogHeader className="flex flex-row items-center justify-between px-6 py-3 border-b space-y-0">
              <DialogTitle className="font-semibold text-sm">
                Confirm Request Completion
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to mark this request as completed? This
                will finalize the transaction and deduct items from inventory
                permanently.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-9 text-sm w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCompleteConfirmOpen(false);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="h-9 text-sm w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      completingRequestType === "medicine" &&
                      completingRequestId
                    ) {
                      updateMedicineRequestStatus(
                        completingRequestId,
                        "COMPLETED",
                        adminNotes,
                      );
                      setSelectedMedReq(null);
                    } else if (
                      completingRequestType === "assistance" &&
                      completingRequestId
                    ) {
                      updateAssistanceRequestStatus(
                        completingRequestId,
                        "COMPLETED",
                        adminNotes,
                      );
                      setSelectedAstReq(null);
                    }
                    setIsCompleteConfirmOpen(false);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  type="button"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
