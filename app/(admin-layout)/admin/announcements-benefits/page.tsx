"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Heart,
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  fetchAnnouncements,
  fetchBenefits,
  createAnnouncement,
  deleteAnnouncement,
  createBenefit,
  deleteBenefit,
} from "@/app/actions/announcements-benefits";

export default function AnnouncementsBenefitsAdminPage() {
  const [activeTab, setActiveTab] = useState<"announcements" | "benefits">("announcements");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isBenefitOpen, setIsBenefitOpen] = useState(false);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);
  const [deletingBenefitId, setDeletingBenefitId] = useState<string | null>(null);

  // Form states
  const [annForm, setAnnForm] = useState({
    titleEn: "",
    titleTl: "",
    descriptionEn: "",
    descriptionTl: "",
  });

  const [benForm, setBenForm] = useState({
    nameEn: "",
    nameTl: "",
    descriptionEn: "",
    descriptionTl: "",
    status: "active",
    detailsEn: "",
    detailsTl: "",
  });

  async function loadData() {
    setLoading(true);
    try {
      const [annList, benList] = await Promise.all([
        fetchAnnouncements(),
        fetchBenefits(),
      ]);
      setAnnouncements(annList);
      setBenefits(benList);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load announcements and benefits");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleAnnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annForm.titleEn || !annForm.descriptionEn) {
      toast.error("Please fill in the required fields");
      return;
    }

    const formData = new FormData();
    formData.append("titleEn", annForm.titleEn);
    formData.append("titleTl", annForm.titleTl);
    formData.append("descriptionEn", annForm.descriptionEn);
    formData.append("descriptionTl", annForm.descriptionTl);

    const res = await createAnnouncement(formData);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Announcement published successfully!");
      setIsAnnouncementOpen(false);
      setAnnForm({ titleEn: "", titleTl: "", descriptionEn: "", descriptionTl: "" });
      loadData();
    }
  };

  const handleBenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!benForm.nameEn || !benForm.descriptionEn) {
      toast.error("Please fill in the required fields");
      return;
    }

    const formData = new FormData();
    formData.append("nameEn", benForm.nameEn);
    formData.append("nameTl", benForm.nameTl);
    formData.append("descriptionEn", benForm.descriptionEn);
    formData.append("descriptionTl", benForm.descriptionTl);
    formData.append("status", benForm.status);
    formData.append("detailsEn", benForm.detailsEn);
    formData.append("detailsTl", benForm.detailsTl);

    const res = await createBenefit(formData);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Benefit program created successfully!");
      setIsBenefitOpen(false);
      setBenForm({
        nameEn: "",
        nameTl: "",
        descriptionEn: "",
        descriptionTl: "",
        status: "active",
        detailsEn: "",
        detailsTl: "",
      });
      loadData();
    }
  };

  const handleAnnDelete = async () => {
    if (!deletingAnnouncementId) return;
    const res = await deleteAnnouncement(deletingAnnouncementId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Announcement deleted successfully");
      setDeletingAnnouncementId(null);
      loadData();
    }
  };

  const handleBenDelete = async () => {
    if (!deletingBenefitId) return;
    const res = await deleteBenefit(deletingBenefitId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Benefit program deleted successfully");
      setDeletingBenefitId(null);
      loadData();
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Announcements & Benefits</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage public announcements and benefits programs shown to senior citizens.
          </p>
        </div>
        <div className="flex shrink-0">
          {activeTab === "announcements" ? (
            <Button
              onClick={() => setIsAnnouncementOpen(true)}
              size="sm"
              className="h-9 gap-1.5 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" /> New Announcement
            </Button>
          ) : (
            <Button
              onClick={() => setIsBenefitOpen(true)}
              size="sm"
              className="h-9 gap-1.5 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" /> New Benefit
            </Button>
          )}
        </div>
      </div>

      {/* Main Mode Tabs styled border-bottom */}
      <div className="flex gap-2 border-b">
        {[
          { id: "announcements", label: "Announcements" },
          { id: "benefits", label: "Benefits Programs" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveTab(item.id as any);
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

      {/* Tab Contents */}
      {activeTab === "announcements" && (
        <div className="space-y-4">

          {loading ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Loading announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 border bg-card rounded-lg text-muted-foreground text-sm">
              No announcements published yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="border bg-card rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                          <Bell className="h-4 w-4" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(ann.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingAnnouncementId(ann.id)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        title="Delete Announcement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground text-base">
                        {ann.title_en}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {ann.description_en}
                      </p>
                    </div>

                    {ann.title_tl && (
                      <div className="pt-2.5 border-t border-dashed space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-yellow-500" /> Tagalog Translation
                        </span>
                        <h4 className="font-medium text-foreground/80 text-sm">
                          {ann.title_tl}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {ann.description_tl}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "benefits" && (
        <div className="space-y-4">

          {loading ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Loading benefits...
            </div>
          ) : benefits.length === 0 ? (
            <div className="text-center py-12 border bg-card rounded-lg text-muted-foreground text-sm">
              No benefits programs created yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {benefits.map((ben) => (
                <div
                  key={ben.id}
                  className="border bg-card rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <Heart className="h-4 w-4" />
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            ben.status === "active"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : ben.status === "eligible"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400"
                          }`}
                        >
                          {ben.status.toUpperCase()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingBenefitId(ben.id)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        title="Delete Benefit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground text-base">
                        {ben.name_en}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {ben.description_en}
                      </p>
                      {ben.details_en && (
                        <p className="text-xs text-muted-foreground font-medium pt-1">
                          Details: {ben.details_en}
                        </p>
                      )}
                    </div>

                    {ben.name_tl && (
                      <div className="pt-2.5 border-t border-dashed space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-yellow-500" /> Tagalog Translation
                        </span>
                        <h4 className="font-medium text-foreground/80 text-sm">
                          {ben.name_tl}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {ben.description_tl}
                        </p>
                        {ben.details_tl && (
                          <p className="text-xs text-muted-foreground/80 font-medium">
                            Details: {ben.details_tl}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NEW ANNOUNCEMENT DIALOG */}
      <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
        <DialogContent className="max-w-md rounded-sm gap-0 p-0" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader className="px-6 py-3 border-b">
            <DialogTitle className="text-sm font-semibold">Publish New Announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAnnSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Title (English) *</label>
              <Input
                placeholder="e.g. Pension Release Schedule"
                value={annForm.titleEn}
                onChange={(e) => setAnnForm({ ...annForm, titleEn: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Title (Tagalog/Filipino)</label>
              <Input
                placeholder="e.g. Iskedyul ng Pension"
                value={annForm.titleTl}
                onChange={(e) => setAnnForm({ ...annForm, titleTl: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description (English) *</label>
              <Textarea
                placeholder="Write the announcements content in English..."
                value={annForm.descriptionEn}
                onChange={(e) => setAnnForm({ ...annForm, descriptionEn: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description (Tagalog/Filipino)</label>
              <Textarea
                placeholder="Isulat ang anunsyo sa Tagalog..."
                value={annForm.descriptionTl}
                onChange={(e) => setAnnForm({ ...annForm, descriptionTl: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAnnouncementOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Publish</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* NEW BENEFIT DIALOG */}
      <Dialog open={isBenefitOpen} onOpenChange={setIsBenefitOpen}>
        <DialogContent className="max-w-md rounded-sm gap-0 p-0" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader className="px-6 py-3 border-b">
            <DialogTitle className="text-sm font-semibold">Add Benefit Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBenSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Name (English) *</label>
                <Input
                  placeholder="e.g. SSS Pension"
                  value={benForm.nameEn}
                  onChange={(e) => setBenForm({ ...benForm, nameEn: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Name (Tagalog)</label>
                <Input
                  placeholder="e.g. SSS Pension"
                  value={benForm.nameTl}
                  onChange={(e) => setBenForm({ ...benForm, nameTl: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description (English) *</label>
              <Textarea
                placeholder="Short description of the benefit..."
                value={benForm.descriptionEn}
                onChange={(e) => setBenForm({ ...benForm, descriptionEn: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description (Tagalog)</label>
              <Textarea
                placeholder="Isulat ang deskripsyon sa Tagalog..."
                value={benForm.descriptionTl}
                onChange={(e) => setBenForm({ ...benForm, descriptionTl: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Default Status</label>
                <Select
                  value={benForm.status}
                  onValueChange={(val) => setBenForm({ ...benForm, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="eligible">Eligible</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Details (English)</label>
                <Input
                  placeholder="e.g. Valid until Dec 2027"
                  value={benForm.detailsEn}
                  onChange={(e) => setBenForm({ ...benForm, detailsEn: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Details (Tagalog)</label>
              <Input
                placeholder="e.g. Wasto hanggang Dis 2027"
                value={benForm.detailsTl}
                onChange={(e) => setBenForm({ ...benForm, detailsTl: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsBenefitOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE ANNOUNCEMENT */}
      {deletingAnnouncementId && (
        <Dialog open onOpenChange={(open) => !open && setDeletingAnnouncementId(null)}>
          <DialogContent className="max-w-sm gap-0 p-0 rounded-sm" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 py-3 border-b">
              <DialogTitle className="text-sm font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Delete Announcement
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to delete this announcement? This action cannot be undone and it will be removed from the client side homepage immediately.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setDeletingAnnouncementId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={handleAnnDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* CONFIRM DELETE BENEFIT */}
      {deletingBenefitId && (
        <Dialog open onOpenChange={(open) => !open && setDeletingBenefitId(null)}>
          <DialogContent className="max-w-sm gap-0 p-0 rounded-sm" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 py-3 border-b">
              <DialogTitle className="text-sm font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Delete Benefit Program
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to delete this benefit program? Senior citizens will no longer see it listed under their benefits screen.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setDeletingBenefitId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={handleBenDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
