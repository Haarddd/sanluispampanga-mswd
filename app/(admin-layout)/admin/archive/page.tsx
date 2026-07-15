"use client";

import React, { useMemo, useState } from "react";
import {
  useAdminStore,
  SeniorProfile,
  Medicine,
} from "@/components/admin/admin-store-provider";
import {
  ArchiveRestore,
  Trash2,
  Search,
  UsersRound,
  Pill,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PendingAction = {
  id: string;
  type: "senior" | "medicine";
  label: "Restore" | "Delete";
  itemName: string;
};

function ConfirmModal({
  action,
  onConfirm,
  onClose,
  busy,
}: {
  action: PendingAction;
  onConfirm: () => void;
  onClose: () => void;
  busy: boolean;
}) {
  const isDelete = action.label === "Delete";

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-w-sm gap-0 p-0 rounded-sm">
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-3 border-b space-y-0">
          <DialogTitle className="font-semibold text-sm">
            {isDelete ? "Permanently Delete Record" : "Restore Record"}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {isDelete ? (
              <>
                Are you sure you want to
                <span className="font-semibold text-foreground">
                  {" "}
                  permanently delete{" "}
                </span>
                <span className="font-semibold text-foreground">
                  {action.itemName}?{" "}
                </span>
                This operation{" "}
                <span className="text-red-500 font-medium">
                  cannot be undone
                </span>
                .
              </>
            ) : (
              <>
                Restore
                <span className="font-semibold text-foreground">
                  {" "}
                  {action.itemName}{" "}
                </span>
                back to the active database list?
              </>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-9 text-sm"
              onClick={onClose}
              disabled={busy}
              type="button"
            >
              Cancel
            </Button>
            {isDelete ? (
              <Button
                variant="outline"
                className="flex-1 h-9 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={onConfirm}
                disabled={busy}
                type="button"
              >
                <span className={busy ? "invisible" : "visible"}>Delete</span>
                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="size-4 animate-spin" />
                  </div>
                )}
              </Button>
            ) : (
              <Button
                variant="default"
                className="flex-1 h-9 text-sm relative"
                onClick={onConfirm}
                disabled={busy}
                type="button"
              >
                <span className={busy ? "invisible" : "visible"}>Restore</span>
                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="size-4 animate-spin" />
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ArchivePage() {
  const {
    archivedSeniors,
    archivedMedicines,
    restoreSenior,
    deleteSeniorPermanently,
    restoreMedicine,
    deleteMedicinePermanently,
  } = useAdminStore();

  const [tab, setTab] = useState<"all" | "seniors" | "medicines">("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const filteredSeniors = useMemo(() => {
    return archivedSeniors.filter(
      (s) =>
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search) ||
        s.address.barangay.toLowerCase().includes(search.toLowerCase()),
    );
  }, [archivedSeniors, search]);

  const filteredMedicines = useMemo(() => {
    return archivedMedicines.filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.generic_name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [archivedMedicines, search]);

  function handleActionPrompt(
    id: string,
    type: "senior" | "medicine",
    label: "Restore" | "Delete",
    itemName: string,
  ) {
    setPending({ id, type, label, itemName });
  }

  async function handleConfirm() {
    if (!pending) return;
    setBusy(true);
    // Simulate loading for smoother transaction feedback
    await new Promise((resolve) => setTimeout(resolve, 600));
    try {
      if (pending.type === "senior") {
        if (pending.label === "Restore") {
          restoreSenior(pending.id);
        } else {
          deleteSeniorPermanently(pending.id);
        }
      } else {
        if (pending.label === "Restore") {
          restoreMedicine(pending.id);
        } else {
          deleteMedicinePermanently(pending.id);
        }
      }
      setPending(null);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {pending && (
        <ConfirmModal
          action={pending}
          onConfirm={handleConfirm}
          onClose={() => !busy && setPending(null)}
          busy={busy}
        />
      )}

      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold">Administrative Archive</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Restore deactivated profiles and deleted compounds, or clean up
          outdated records permanently.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: "all", label: "All Records" },
          { id: "seniors", label: "Deactivated Seniors" },
          { id: "medicines", label: "Archived Medicines" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id as any)}
            className={`flex items-center px-1 py-2 border-b-2 transition-colors -mb-px text-sm font-medium ${
              tab === item.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div>
        <div className="relative mb-2">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Search archived list..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-10 mb-0.5"
          />
        </div>

        {/* --- ARCHIVED SENIORS TABLE --- */}
        {(tab === "all" || tab === "seniors") && (
          <div className="border bg-card rounded-t-lg overflow-hidden mb-5">
            <div className="px-4 py-3 border-b bg-muted/50 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              DEACTIVATED SENIORS DIRECTORY ({filteredSeniors.length})
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs bg-muted/20 text-left">
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Full Name
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Age
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Phone Number
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Address
                    </th>
                    <th className="px-4 py-3 font-medium text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSeniors.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                        {s.full_name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {s.age}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {s.phone}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        Brgy. {s.address.barangay}, San Luis
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs"
                            onClick={() =>
                              handleActionPrompt(
                                s.id,
                                "senior",
                                "Restore",
                                s.full_name,
                              )
                            }
                          >
                            <ArchiveRestore className="mr-1 w-4 h-4" /> Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border"
                            onClick={() =>
                              handleActionPrompt(
                                s.id,
                                "senior",
                                "Delete",
                                s.full_name,
                              )
                            }
                          >
                            <Trash2 className="mr-1 w-4 h-4" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSeniors.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground text-xs"
                      >
                        No deactivated senior profiles found in archive
                        database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- ARCHIVED MEDICINES TABLE --- */}
        {(tab === "all" || tab === "medicines") && (
          <div className="border bg-card rounded-t-lg overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/50 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              ARCHIVED MEDICINE INVENTORY ({filteredMedicines.length})
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs bg-muted/20 text-left">
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Medicine Name
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Dosage / Strength
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Quantity
                    </th>
                    <th className="px-4 py-3 font-medium text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMedicines.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                        {m.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {m.dosage_strength} ({m.unit})
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap font-medium">
                        {m.available_quantity}{" "}
                        <span className="text-sm text-muted-foreground">
                          {m.unit}(s)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs"
                            onClick={() =>
                              handleActionPrompt(
                                m.id,
                                "medicine",
                                "Restore",
                                m.name,
                              )
                            }
                          >
                            <ArchiveRestore size={14} className="mr-1" />{" "}
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-xs   text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border"
                            onClick={() =>
                              handleActionPrompt(
                                m.id,
                                "medicine",
                                "Delete",
                                m.name,
                              )
                            }
                          >
                            <Trash2 size={14} className="mr-1" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredMedicines.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-muted-foreground text-xs"
                      >
                        No archived or deleted medicines found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
