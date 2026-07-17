"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import {
  useAdminStore,
  SeniorProfile,
  VerificationStatus,
} from "@/components/admin/admin-store-provider";
import {
  Search,
  Eye,
  Check,
  X,
  FileText,
  MapPin,
  AlertCircle,
  Trash2,
  AlertTriangle,
  User,
  Phone,
  Calendar,
  Smile,
  Globe,
  Navigation,
  CheckSquare,
  Square,
  Clock,
  Users,
  Heart,
  Contact,
  PhoneCall,
  VenusAndMars,
  Circle,
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
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusStyles: Record<VerificationStatus, string> = {
  APPROVED:
    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 inline-block text-center",
  PENDING_ADMIN_REVIEW:
    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 inline-block text-center",
  REJECTED:
    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 inline-block text-center",
  NEEDS_CLARIFICATION:
    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 inline-block text-center",
  NEEDS_RESUBMISSION:
    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 inline-block text-center",
};

const statusLabels: Record<VerificationStatus, string> = {
  APPROVED: "Approved",
  PENDING_ADMIN_REVIEW: "Pending Review",
  REJECTED: "Rejected",
  NEEDS_CLARIFICATION: "Needs Clarification",
  NEEDS_RESUBMISSION: "Needs Resubmission",
};

function SeniorsDirectoryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    seniors,
    verifySenior,
    rejectSenior,
    updateSeniorNotes,
    deactivateSenior,
    addToast,
    requestResubmission,
    approveResubmission,
  } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<
    VerificationStatus | "ALL"
  >("ALL");
  const [selectedSenior, setSelectedSenior] = useState<SeniorProfile | null>(
    null,
  );

  // Rejection Dialog states
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Approve confirmation states
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [approveSeniorId, setApproveSeniorId] = useState<string | null>(null);

  // Resubmission Dialog states
  const [isResubmitOpen, setIsResubmitOpen] = useState(false);
  const [resubmitFieldsChecked, setResubmitFieldsChecked] = useState<string[]>(
    [],
  );
  const [resubmitReason, setResubmitReason] = useState("");

  // Deactivation confirmation state
  const [deactivatingSeniorId, setDeactivatingSeniorId] = useState<
    string | null
  >(null);

  // Lightbox Image Dialog
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Deep-linking from dashboard
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      const match = seniors.find((s) => s.id === id);
      if (match) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedSenior(match);
        // Clean param from URL
        router.replace("/admin/seniors", { scroll: false });
      }
    }
  }, [searchParams, seniors, router]);

  const filteredSeniors = useMemo(() => {
    return seniors.filter((senior) => {
      const matchSearch =
        senior.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        senior.phone.includes(searchQuery) ||
        senior.address.barangay
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchStatus =
        selectedStatus === "ALL" ||
        senior.verification_status === selectedStatus;

      return matchSearch && matchStatus;
    });
  }, [seniors, searchQuery, selectedStatus]);

  const handleOpenDetails = (senior: SeniorProfile) => {
    setSelectedSenior(senior);
  };

  const handleApprove = (id: string) => {
    verifySenior(id);
    if (selectedSenior?.id === id) {
      setSelectedSenior((prev) =>
        prev ? { ...prev, verification_status: "APPROVED" } : null,
      );
    }
  };

  const handleOpenReject = () => {
    setRejectionReason("");
    setIsRejectOpen(true);
  };

  const handleConfirmReject = () => {
    if (!selectedSenior) return;
    const defaultReason = "Registration declined by administrator.";
    rejectSenior(selectedSenior.id, defaultReason);
    setSelectedSenior((prev) =>
      prev
        ? {
            ...prev,
            verification_status: "REJECTED",
            id_document: {
              ...prev.id_document,
              verification_status: "REJECTED",
              rejection_reason: defaultReason,
            },
          }
        : null,
    );
    setIsRejectOpen(false);
  };

  const handleConfirmDeactivate = () => {
    if (!deactivatingSeniorId) return;
    deactivateSenior(deactivatingSeniorId);
    setDeactivatingSeniorId(null);
    setSelectedSenior(null);
  };

  const handleOpenApproveConfirm = (id: string) => {
    setApproveSeniorId(id);
    setIsApproveConfirmOpen(true);
  };

  const handleConfirmApprove = () => {
    if (!approveSeniorId) return;
    handleApprove(approveSeniorId);
    setIsApproveConfirmOpen(false);
    setApproveSeniorId(null);
  };

  const handleOpenResubmitDialog = () => {
    setResubmitFieldsChecked([]);
    setResubmitReason("");
    setIsResubmitOpen(true);
  };

  const handleConfirmResubmit = () => {
    if (
      !selectedSenior ||
      resubmitFieldsChecked.length === 0 ||
      !resubmitReason.trim()
    )
      return;
    requestResubmission(
      selectedSenior.id,
      resubmitFieldsChecked,
      resubmitReason,
    );
    setSelectedSenior((prev) =>
      prev
        ? {
            ...prev,
            verification_status: "NEEDS_RESUBMISSION" as VerificationStatus,
            resubmit_fields: resubmitFieldsChecked,
          }
        : null,
    );
    setIsResubmitOpen(false);
  };

  const handleApproveResub = (id: string) => {
    approveResubmission(id);
    setSelectedSenior(null);
  };

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold">Seniors Directory</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Browse official senior citizen profiles, view geolocations, track
          upload history, and perform document verifications.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, phone, barangay..."
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
            <SelectItem value="ALL">All Records</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="PENDING_ADMIN_REVIEW">Pending Review</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="NEEDS_RESUBMISSION">
              Needs Resubmission
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Seniors Directory Table */}
      <div className="border bg-card rounded-t-lg overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-muted-foreground text-xs bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Senior Name
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Medicine Requests
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Assistance Requests
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Date Joined
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredSeniors.map((senior) => (
                <tr
                  key={senior.id}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {senior.full_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {senior.medicine_requests_count || 0} requests
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {senior.assistance_requests_count || 0} requests
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(senior.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap ">
                    <span className={statusStyles[senior.verification_status]}>
                      {statusLabels[senior.verification_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-semibold rounded-md border"
                        onClick={() => handleOpenDetails(senior)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      {senior.verification_status === "APPROVED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs  text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => setDeactivatingSeniorId(senior.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Deactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSeniors.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground text-sm"
                  >
                    No senior records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SENIOR DETAILS DIALOG (Modal layout style matching admin-pattern) --- */}
      {selectedSenior && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (
              !open &&
              !lightboxImage &&
              !isRejectOpen &&
              !isResubmitOpen &&
              !deactivatingSeniorId &&
              !isApproveConfirmOpen
            ) {
              setSelectedSenior(null);
            }
          }}
        >
          <DialogContent
            className="!max-w-2xl w-full p-0 rounded-sm overflow-hidden"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <div className="flex flex-col max-h-[90vh]">
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
                <h2 className="font-semibold text-sm">Citizen Profile</h2>
              </div>

              {/* Scrollable details view */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 text-sm">
                {/* Profile Details (Row by Row, Line by Line with Icons) */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          Full Name
                        </span>
                        <span className="font-medium text-foreground">
                          {selectedSenior.full_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          Phone Number
                        </span>
                        <span className="font-medium text-foreground">
                          {selectedSenior.phone}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          Birthdate
                        </span>
                        <span className="font-medium text-foreground">
                          {selectedSenior.birthdate || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Smile className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          Age
                        </span>
                        <span className="font-medium text-foreground">
                          {selectedSenior.age} years old
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          Language Preference
                        </span>
                        <span className="font-medium text-foreground uppercase">
                          {selectedSenior.language_preference}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <VenusAndMars className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          Sex
                        </span>
                        <span className="font-medium text-foreground">
                          {selectedSenior.sex || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Circle className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          Civil Status
                        </span>
                        <span className="font-medium text-foreground">
                          {selectedSenior.civil_status || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Contact className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          Emergency Contact Name
                        </span>
                        <span className="font-medium text-foreground">
                          {selectedSenior.emergency_contact_name || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <PhoneCall className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          Emergency Contact Number
                        </span>
                        <span className="font-medium text-foreground">
                          {selectedSenior.emergency_contact_number || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Navigation className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          GPS Coordinates
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                          {selectedSenior.address.latitude !== undefined
                            ? selectedSenior.address.latitude
                            : "N/A"}
                          ,{" "}
                          {selectedSenior.address.longitude !== undefined
                            ? selectedSenior.address.longitude
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:col-span-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          Full Address
                        </span>
                        <span className="font-medium text-foreground">
                          {selectedSenior.address.street
                            ? `${selectedSenior.address.street}, `
                            : ""}
                          Brgy. {selectedSenior.address.barangay || "N/A"}, San
                          Luis, Pampanga
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Uploaded Government ID Verification
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Front ID */}
                    <div className="border rounded-lg overflow-hidden bg-muted/10 p-4 flex flex-col justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">
                          Senior Citizen ID - Front
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded on{" "}
                          {new Date(
                            selectedSenior.id_document.upload_date ||
                              selectedSenior.created_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-sm w-full"
                        onClick={() =>
                          setLightboxImage(
                            selectedSenior.id_document.file_url || "/mswd.png",
                          )
                        }
                        disabled={!selectedSenior.id_document.file_url}
                      >
                        Inspect
                      </Button>
                    </div>

                    {/* Back ID (if exists) */}
                    {selectedSenior.id_document_back && (
                      <div className="border rounded-lg overflow-hidden bg-muted/10 p-4 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">
                            Senior Citizen ID - Back
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded on{" "}
                            {new Date(
                              selectedSenior.id_document_back.upload_date ||
                                selectedSenior.created_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-sm w-full"
                          onClick={() =>
                            setLightboxImage(
                              selectedSenior.id_document_back!.file_url ||
                                "/placeholder-id.png",
                            )
                          }
                          disabled={!selectedSenior.id_document_back.file_url}
                        >
                          Inspect
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Compare View for Resubmissions */}
                {selectedSenior.pending_resubmission && (
                  <div className="border border-orange-200 dark:border-orange-950 bg-orange-50/20 dark:bg-orange-950/10 p-4 rounded-lg space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-orange-700 dark:text-orange-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Pending
                      Resubmission Details
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      The user has resubmitted their registration details.
                      Please compare the changes below:
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2 border-r pr-2">
                        <p className="font-semibold text-muted-foreground uppercase text-[10px]">
                          Current Data
                        </p>
                        {selectedSenior.pending_resubmission.resubmitted_data
                          .full_name && (
                          <div>
                            <span className="text-muted-foreground block">
                              Full Name:
                            </span>
                            <span className="line-through">
                              {selectedSenior.full_name}
                            </span>
                          </div>
                        )}
                        {(selectedSenior.pending_resubmission.resubmitted_data
                          .street ||
                          selectedSenior.pending_resubmission.resubmitted_data
                            .barangay) && (
                          <div>
                            <span className="text-muted-foreground block">
                              Address:
                            </span>
                            <span className="line-through">
                              Brgy. {selectedSenior.address.barangay},{" "}
                              {selectedSenior.address.street}
                            </span>
                          </div>
                        )}
                        {selectedSenior.pending_resubmission.resubmitted_data
                          .id_front_url && (
                          <div>
                            <span className="text-muted-foreground block">
                              ID Document Front:
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              Current front ID on file
                            </span>
                          </div>
                        )}
                        {selectedSenior.pending_resubmission.resubmitted_data
                          .id_back_url && (
                          <div>
                            <span className="text-muted-foreground block">
                              ID Document Back:
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              Current back ID on file
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 text-emerald-700 dark:text-emerald-400">
                        <p className="font-semibold text-muted-foreground uppercase text-[10px]">
                          Resubmitted Data
                        </p>
                        {selectedSenior.pending_resubmission.resubmitted_data
                          .full_name && (
                          <div>
                            <span className="text-muted-foreground block font-semibold">
                              Full Name:
                            </span>
                            <span className="font-semibold">
                              {
                                selectedSenior.pending_resubmission
                                  .resubmitted_data.full_name
                              }
                            </span>
                          </div>
                        )}
                        {(selectedSenior.pending_resubmission.resubmitted_data
                          .street ||
                          selectedSenior.pending_resubmission.resubmitted_data
                            .barangay) && (
                          <div>
                            <span className="text-muted-foreground block font-semibold">
                              Address:
                            </span>
                            <span className="font-semibold">
                              Brgy.{" "}
                              {
                                selectedSenior.pending_resubmission
                                  .resubmitted_data.barangay
                              }
                              ,{" "}
                              {
                                selectedSenior.pending_resubmission
                                  .resubmitted_data.street
                              }
                            </span>
                          </div>
                        )}
                        {selectedSenior.pending_resubmission.resubmitted_data
                          .id_front_url && (
                          <div>
                            <span className="text-muted-foreground block font-semibold">
                              New ID Front:
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] mt-1"
                              onClick={() =>
                                setLightboxImage(
                                  selectedSenior.pending_resubmission!
                                    .resubmitted_data.id_front_url!,
                                )
                              }
                            >
                              View New ID Front Image
                            </Button>
                          </div>
                        )}
                        {selectedSenior.pending_resubmission.resubmitted_data
                          .id_back_url && (
                          <div>
                            <span className="text-muted-foreground block font-semibold">
                              New ID Back:
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] mt-1"
                              onClick={() =>
                                setLightboxImage(
                                  selectedSenior.pending_resubmission!
                                    .resubmitted_data.id_back_url!,
                                )
                              }
                            >
                              View New ID Back Image
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button
                        size="sm"
                        className="h-8 text-xs w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                        onClick={() => handleApproveResub(selectedSenior.id)}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Apply & Approve
                        Resubmitted Data
                      </Button>
                    </div>
                  </div>
                )}

                {/* Rejection Details alert banner */}
                {selectedSenior.verification_status === "REJECTED" &&
                  selectedSenior.id_document.rejection_reason && (
                    <div className="border border-red-200 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 p-3 rounded-lg flex gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-xs">
                          Rejection Details
                        </p>
                        <p className="text-xs mt-0.5 italic">
                          "{selectedSenior.id_document.rejection_reason}"
                        </p>
                      </div>
                    </div>
                  )}
              </div>

              {/* Modal footer Approve & Reject/Request Resubmission */}
              {selectedSenior.verification_status !== "APPROVED" && (
                <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-between shrink-0 gap-3 w-full">
                  <div className="flex items-center justify-between w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 text-sm"
                      onClick={handleOpenResubmitDialog}
                    >
                      Request Resubmission
                    </Button>

                    {/* Vertical Dividing Line */}
                    <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-4" />

                    <div className="grid grid-cols-2 w-full gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 text-sm  text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={handleOpenReject}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-10 text-sm"
                        onClick={() =>
                          handleOpenApproveConfirm(selectedSenior.id)
                        }
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* --- CONFIRM REJECTION INPUT MODAL --- */}
      {isRejectOpen && (
        <Dialog open onOpenChange={(open) => !open && setIsRejectOpen(false)}>
          <DialogContent
            className="max-w-sm gap-0 p-0 rounded-sm"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <div className="flex items-center justify-between px-6 py-3 border-b">
              <h2 className="font-semibold text-sm">Reject ID Registration</h2>
            </div>
            <div className="px-6 py-4 flex flex-col gap-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to reject this senior citizen's
                registration profile? This action will permanently decline their
                registration.
              </p>
              <div className="grid grid-cols-2 w-full gap-2">
                <Button
                  variant="outline"
                  className="h-9 text-sm"
                  onClick={() => setIsRejectOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="h-9 text-sm  text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={handleConfirmReject}
                >
                  Reject Account
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* --- REQUEST RESUBMISSION DIALOG --- */}
      {isResubmitOpen && (
        <Dialog open onOpenChange={(open) => !open && setIsResubmitOpen(false)}>
          <DialogContent
            className="max-w-md gap-0 p-0 rounded-sm"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <div className="flex items-center justify-between px-6 py-3 border-b">
              <h2 className="font-semibold text-sm">
                Request Registration Resubmission
              </h2>
            </div>
            <div className="p-6 flex flex-col py-4 gap-4 max-h-[80vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground">
                Select the fields that the user needs to update on their
                profile, and provide instructions.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground block">
                  Select Fields to Update
                </label>
                <div className="grid grid-cols-2 gap-2 border p-3 rounded-lg bg-muted/20">
                  {[
                    { label: "Full Name", value: "fullName" },
                    { label: "Street Address", value: "street" },
                    { label: "Barangay", value: "barangay" },
                    { label: "GPS Pin Location", value: "location" },
                    { label: "Government ID Front", value: "idFrontFile" },
                    { label: "Government ID Back", value: "idBackFile" },
                    { label: "6-Digit login PIN", value: "pin" },
                  ].map((field) => {
                    const isChecked = resubmitFieldsChecked.includes(
                      field.value,
                    );
                    return (
                      <label
                        key={field.value}
                        className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setResubmitFieldsChecked((prev) => [
                                ...prev,
                                field.value,
                              ]);
                            } else {
                              setResubmitFieldsChecked((prev) =>
                                prev.filter((v) => v !== field.value),
                              );
                            }
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                        />
                        {field.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Instructions for User
                </label>
                <Textarea
                  required
                  placeholder="e.g. Your address is not located in San Luis, Pampanga, or please upload a clearer image of your front ID."
                  value={resubmitReason}
                  onChange={(e) => setResubmitReason(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="flex gap-2 ">
                <Button
                  variant="outline"
                  className="flex-1 h-9 text-sm"
                  onClick={() => setIsResubmitOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="flex-1 h-9 text-sm"
                  onClick={handleConfirmResubmit}
                  disabled={
                    resubmitFieldsChecked.length === 0 || !resubmitReason.trim()
                  }
                >
                  Send Request
                </Button>
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
                  alt="Government ID Document"
                  className="max-w-full max-h-[60vh] object-contain rounded-md"
                />
              ) : (
                <div className="text-zinc-500 text-xs">No image file found</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* --- CONFIRM DEACTIVATE MODAL --- */}
      {deactivatingSeniorId && (
        <Dialog
          open
          onOpenChange={(open) => !open && setDeactivatingSeniorId(null)}
        >
          <DialogContent
            className="max-w-sm gap-0 p-0 rounded-sm"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <DialogHeader className="flex flex-row items-center justify-between px-6 py-3 border-b space-y-0">
              <DialogTitle className="font-semibold text-sm">
                Deactivate and Archive Profile
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to deactivate and archive this senior
                citizen's profile? This will move their record to the
                Administrative Archive.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-9 text-sm"
                  onClick={() => setDeactivatingSeniorId(null)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="h-9 text-sm  text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={handleConfirmDeactivate}
                  type="button"
                >
                  Deactivate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* --- CONFIRM APPROVE MODAL --- */}
      {isApproveConfirmOpen && (
        <Dialog
          open
          onOpenChange={(open) => !open && setIsApproveConfirmOpen(false)}
        >
          <DialogContent
            className="max-w-sm gap-0 p-0 rounded-sm"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <DialogHeader className="flex flex-row items-center justify-between px-6 py-3 border-b space-y-0">
              <DialogTitle className="font-semibold text-sm">
                Confirm Registration Approval
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4 space-y-4">
              <div className="">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Are you sure you want to approve this senior citizen's
                  registration profile? Doing so will generate their official
                  digital ID and grant them active access immediately.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-9 text-sm"
                  onClick={() => setIsApproveConfirmOpen(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="flex-1 h-9 text-sm"
                  onClick={handleConfirmApprove}
                  type="button"
                >
                  Approve Account
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function SeniorsDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-muted-foreground font-sans">
          Loading Seniors Directory...
        </div>
      }
    >
      <SeniorsDirectoryPageContent />
    </Suspense>
  );
}
