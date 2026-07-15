"use client";

import React, { useState, useMemo } from "react";
import {
  useAdminStore,
  Medicine,
} from "@/components/admin/admin-store-provider";
import { Search, Pencil, Archive } from "lucide-react";
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
import { toast } from "sonner";

export default function MedicineInventoryPage() {
  const { medicines, addMedicine, updateMedicine, deleteMedicine } =
    useAdminStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStockStatus, setSelectedStockStatus] = useState<
    "ALL" | "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK"
  >("ALL");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [archivingMedId, setArchivingMedId] = useState<string | null>(null);

  // Form states (unified for Add/Edit)
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDosage, setFormDosage] = useState("");
  const [formUnit, setFormUnit] = useState("Tablet");
  const [formUsage, setFormUsage] = useState("");
  const [formQty, setFormQty] = useState("0");

  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.generic_name.toLowerCase().includes(searchQuery.toLowerCase());

      let matchStatus = true;
      if (selectedStockStatus === "OUT_OF_STOCK") {
        matchStatus = m.available_quantity === 0;
      } else if (selectedStockStatus === "LOW_STOCK") {
        matchStatus = m.available_quantity > 0 && m.available_quantity <= 30;
      } else if (selectedStockStatus === "IN_STOCK") {
        matchStatus = m.available_quantity > 30;
      }

      return matchSearch && matchStatus;
    });
  }, [medicines, searchQuery, selectedStockStatus]);

  const handleOpenAdd = () => {
    setFormName("");
    setFormDescription("");
    setFormDosage("");
    setFormUnit("Tablet");
    setFormUsage("");
    setFormQty("0");
    setIsAddOpen(true);
  };

  const handleOpenEdit = (med: Medicine) => {
    setEditingMed(med);
    setFormName(med.name);
    setFormDescription(med.description);
    setFormDosage(med.dosage_strength);
    setFormUnit(med.unit);
    setFormUsage(med.usage_instructions);
    setFormQty(String(med.available_quantity));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    addMedicine({
      name: formName,
      generic_name: formName,
      description: formDescription,
      dosage_strength: formDosage,
      unit: formUnit,
      usage_instructions: formUsage,
      available_quantity: Number(formQty) || 0,
      is_active: true,
    });
    toast.success("Medicine added successfully");

    setIsAddOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed || !formName.trim()) return;

    updateMedicine(editingMed.id, {
      name: formName,
      generic_name: formName,
      description: formDescription,
      dosage_strength: formDosage,
      unit: formUnit,
      usage_instructions: formUsage,
      available_quantity: Number(formQty) || 0,
      is_active: true,
    });
    toast.success("Medicine details updated");

    setEditingMed(null);
  };

  const confirmArchive = () => {
    if (!archivingMedId) return;
    deleteMedicine(archivingMedId);
    setArchivingMedId(null);
    toast.success("Medicine archived successfully");
  };

  const isFormUnchanged = editingMed
    ? formName === editingMed.name &&
      formDescription === editingMed.description &&
      formDosage === editingMed.dosage_strength &&
      formUnit === editingMed.unit &&
      formUsage === editingMed.usage_instructions &&
      formQty === String(editingMed.available_quantity)
    : true;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Medicine Inventory</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Log medical supplies, configure generic compounds, adjust stock
            levels, and dispatch low stock alert warnings.
          </p>
        </div>
        <Button
          size="sm"
          className="h-9 text-sm cursor-pointer"
          onClick={handleOpenAdd}
        >
          Add Medicine
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by brand name or generic compound..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-10 mb-0.5"
          />
        </div>
        <Select
          value={selectedStockStatus}
          onValueChange={(val) => setSelectedStockStatus(val as any)}
        >
          <SelectTrigger className="w-full sm:w-[180px] h-10">
            <SelectValue placeholder="All Stocks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Stocks</SelectItem>
            <SelectItem value="IN_STOCK">In Stock</SelectItem>
            <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
            <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <div className="border bg-card rounded-t-lg overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-muted-foreground text-xs bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Medicine Brand Name
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Strength / Dosage
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Quantity
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap text-center w-[120px]">
                  Stock Status
                </th>
                <th className="px-4 py-3 font-medium text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredMedicines.map((med) => {
                const qty = med.available_quantity;
                let statusLabel = "In Stock";
                let statusStyle =
                  "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 inline-block text-center";

                if (qty === 0) {
                  statusLabel = "Out of Stock";
                  statusStyle =
                    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 inline-block text-center";
                } else if (qty <= 30) {
                  statusLabel = "Low Stock";
                  statusStyle =
                    "text-sm px-2 py-1.5 font-semibold rounded-sm max-w-[90px] truncate lg:max-w-none lg:truncate-none bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 inline-block text-center";
                }

                return (
                  <tr
                    key={med.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {med.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {med.dosage_strength}
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {qty}{" "}
                      <span className="text-sm text-muted-foreground font-normal">
                        {med.unit}(s)
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={statusStyle}>{statusLabel}</span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          title="Modify details / adjust stock"
                          onClick={() => handleOpenEdit(med)}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs  text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          title="Archive record"
                          onClick={() => setArchivingMedId(med.id)}
                        >
                          <Archive className="h-4 w-4 mr-1" /> Archive
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMedicines.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground text-sm"
                  >
                    No medicine inventory records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CONFIRM ARCHIVE DIALOG --- */}
      {archivingMedId && (
        <Dialog open onOpenChange={(open) => !open && setArchivingMedId(null)}>
          <DialogContent className="max-w-sm gap-0 p-0 rounded-sm">
            <DialogHeader className="flex flex-row items-center justify-between px-6 py-3 border-b space-y-0">
              <DialogTitle className="font-semibold text-sm">
                Archive Medicine Record
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to archive this medicine compound? It will
                be moved to the Archive section where it can be restored or
                permanently deleted.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-9 text-sm"
                  onClick={() => setArchivingMedId(null)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-9 text-sm  text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={confirmArchive}
                  type="button"
                >
                  Archive
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* --- ADD NEW MEDICINE DIALOG --- */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => !open && setIsAddOpen(false)}
      >
        <DialogContent className="!max-w-xl w-full p-0 rounded-sm overflow-hidden flex flex-col">
          <div className="flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
              <h2 className="font-semibold text-sm">
                Register New Medicine Item
              </h2>
            </div>
            <form
              onSubmit={handleAddSubmit}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-sm"
            >
              <div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-foreground sm">
                    Brand Name
                  </label>
                  <Input
                    required
                    placeholder="e.g. Amlodipine Besilate"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="h-10 sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-foreground sm">
                    Dosage / Strength
                  </label>
                  <Input
                    placeholder="e.g. 5mg, 500mg"
                    value={formDosage}
                    onChange={(e) => setFormDosage(e.target.value)}
                    className="h-10 sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-foreground sm">
                    Unit of Measure
                  </label>
                  <Input
                    placeholder="e.g. Tablet, Inhaler, Vial"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="h-10 sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-foreground sm">
                    Initial Quantity
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    className="h-10 sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-foreground sm">
                  Compound Description
                </label>
                <Textarea
                  placeholder="Describe chemical properties, targets, or catalog notes..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-foreground sm">
                  Standard Usage Instructions
                </label>
                <Textarea
                  placeholder="e.g. Take once daily in the morning, with or without food."
                  value={formUsage}
                  onChange={(e) => setFormUsage(e.target.value)}
                  rows={2}
                  className="sm "
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10 text-sm"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 text-sm"
                  disabled={!formName.trim()}
                >
                  Save Medicine
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- EDIT MEDICINE DIALOG --- */}
      <Dialog
        open={editingMed !== null}
        onOpenChange={(open) => !open && setEditingMed(null)}
      >
        <DialogContent className="!max-w-xl w-full p-0 rounded-sm overflow-hidden flex flex-col">
          <div className="flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
              <h2 className="font-semibold text-sm">
                Edit Inventory Details: {editingMed?.name}
              </h2>
            </div>
            <form
              onSubmit={handleEditSubmit}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-sm"
            >
              <div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-foreground text-sm">
                    Brand Name
                  </label>
                  <Input
                    required
                    placeholder="e.g. Amlodipine Besilate"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="h-10 text-sm "
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-foreground text-sm">
                    Dosage / Strength
                  </label>
                  <Input
                    placeholder="e.g. 5mg, 500mg"
                    value={formDosage}
                    onChange={(e) => setFormDosage(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-foreground text-sm">
                    Unit of Measure
                  </label>
                  <Input
                    placeholder="e.g. Tablet, Inhaler, Vial"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-medium text-foreground text-sm">
                    Available Quantity
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-foreground text-sm">
                  Compound Description
                </label>
                <Textarea
                  placeholder="Describe chemical properties, targets, or catalog notes..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-foreground text-sm">
                  Standard Usage Instructions
                </label>
                <Textarea
                  placeholder="e.g. Take once daily in the morning, with or without food."
                  value={formUsage}
                  onChange={(e) => setFormUsage(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10 text-s"
                  onClick={() => setEditingMed(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 text-sm"
                  disabled={isFormUnchanged || !formName.trim()}
                >
                  Update Details
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
