# MODULE 3: DELIVERY MANAGEMENT

## File: `components/admin-compo/delivery-admin.tsx`

```typescript
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Search,
  Image as ImageIcon,
  Camera,
  Truck,
  X,
  Users,
  Bell,
  CheckCircle2,
  PackageOpen,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { Spinner } from "../ui/spinner";
import { cn, getImageUrl } from "@/lib/utils";
import type { Order } from "@/lib/supabase/orders";
import type { CustomizeRequest } from "@/lib/supabase/customize";
import { updateOrderStatusAction } from "@/app/actions/orders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "../ui/field";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { OrderDetailsPreview } from "@/components/admin-compo/order-details-preview";
import { CustomizeDetailPreview } from "@/components/admin-compo/customize-detail-preview";

type DeliveryStatus =
  | "Preparing"
  | "Out for Delivery"
  | "Delivered"
  | "Ready for Pickup";

const allDeliveryStatuses: DeliveryStatus[] = [
  "Preparing",
  "Ready for Pickup",
  "Out for Delivery",
  "Delivered",
];

const deliveryStatusStyles: Record<string, string> = {
  Preparing:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  "Ready for Pickup":
    "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30",
  "Out for Delivery":
    "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
  Delivered:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

const customizeDeliveryStatusStyles: Record<string, string> = {
  Preparing:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  "Ready for Pickup":
    "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30",
  "Out for Delivery":
    "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
  Delivered:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="!max-w-xl w-full p-0 rounded-sm overflow-hidden shadow-lg border border-border"
        showCloseButton={false}
      >
        <div className="flex flex-col max-h-[90vh]">
          <VisuallyHidden>
            <DialogTitle>{title}</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
            <h2 className="font-semibold text-base md:text-lg text-foreground">
              {title}
            </h2>
            <Button
              variant="ghost"
              className="size-8 p-0 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
              onClick={onClose}
              type="button"
            >
              <X className="size-5 shrink-0" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <ScrollArea className="flex-1" type="always">
            <div className="px-6 py-4 text-base">{children}</div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type DeliveryAdminFormState = {
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  scheduled_date: string | null;
};

function openOrderForDelivery(
  order: Order,
  setSelectedOrder: (o: Order | null) => void,
  setFormState: (s: DeliveryAdminFormState | null) => void,
) {
  setSelectedOrder(order);
  setFormState({
    driver_id: order.driver_id ?? null,
    driver_name: order.driver_name ?? null,
    driver_phone: order.driver_phone ?? null,
    scheduled_date: order.scheduled_date ?? null,
  });
}

function openCustomizeForDelivery(
  req: CustomizeRequest,
  setSelectedCustomize: (r: CustomizeRequest | null) => void,
  setCustomizeDeliveryForm: (s: DeliveryAdminFormState | null) => void,
) {
  setSelectedCustomize(req);
  setCustomizeDeliveryForm({
    driver_id: req.driver_id ?? null,
    driver_name: req.driver_name ?? null,
    driver_phone: req.driver_phone ?? null,
    scheduled_date: req.scheduled_date ?? null,
  });
}

const ordersFetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((data) => data.orders);

export default function DeliveryAdmin({
  initialOrders,
  initialCustomizeRequests,
  initialDrivers = [],
}: {
  initialOrders: Order[];
  initialCustomizeRequests: CustomizeRequest[];
  initialDrivers?: Array<{
    id: string;
    full_name: string;
    phone: string;
    email: string;
    created_at?: string;
    initial_password?: string | null;
  }>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "orders" | "customize" | "drivers"
  >("orders");

  const { data: swrOrders, mutate: refreshOrders } = useSWR(
    "/api/admin/orders",
    ordersFetcher,
    {
      fallbackData: initialOrders,
      refreshInterval: 5000,
      revalidateOnFocus: true,
    },
  );

  const orders: Order[] = swrOrders ?? initialOrders;

  const { data: swrCustomize, mutate: refreshCustomize } = useSWR<{
    success: boolean;
    requests: CustomizeRequest[];
  }>(
    "/api/admin/customize-requests",
    (url: string) => fetch(url).then((res) => res.json()),
    {
      fallbackData: { success: true, requests: initialCustomizeRequests },
      refreshInterval: 5000,
      revalidateOnFocus: true,
    },
  );

  const { data: driversData, mutate: refreshDrivers } = useSWR<{
    drivers: Array<{
      id: string;
      full_name: string;
      phone: string;
      email: string;
      created_at?: string;
      initial_password?: string | null;
    }>;
  }>(
    "/api/admin/drivers",
    (url: string) => fetch(url).then((res) => res.json()),
    {
      fallbackData: { drivers: initialDrivers },
      revalidateOnFocus: true,
      revalidateOnMount: true,
    },
  );
  const registeredDrivers = driversData?.drivers ?? initialDrivers;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "All">(
    "All",
  );
  const [busy, setBusy] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [formState, setFormState] = useState<DeliveryAdminFormState | null>(
    null,
  );

  const rawCustomize = swrCustomize?.requests ?? initialCustomizeRequests;
  const customizeRequests = useMemo(
    () =>
      (rawCustomize ?? []).filter(
        (r) => r.status === "Completed" || r.status === "Fully Paid",
      ),
    [rawCustomize],
  );

  const [customizeSearch, setCustomizeSearch] = useState("");
  const [customizeStatusFilter, setCustomizeStatusFilter] = useState<
    DeliveryStatus | "All"
  >("All");
  const [selectedCustomize, setSelectedCustomize] =
    useState<CustomizeRequest | null>(null);
  const [customizeBusy, setCustomizeBusy] = useState(false);
  const [customizeDeliveryForm, setCustomizeDeliveryForm] =
    useState<DeliveryAdminFormState | null>(null);

  const [pickupPhoto1, setPickupPhoto1] = useState<File | null>(null);
  const [pickupPhoto2, setPickupPhoto2] = useState<File | null>(null);
  const [pickupPreview1, setPickupPreview1] = useState<string | null>(null);
  const [pickupPreview2, setPickupPreview2] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  function handlePickupFilesSelected(slot: 1 | 2, fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    if (files.length >= 2) {
      if (pickupPreview1) URL.revokeObjectURL(pickupPreview1);
      if (pickupPreview2) URL.revokeObjectURL(pickupPreview2);
      setPickupPhoto1(files[0]);
      setPickupPreview1(URL.createObjectURL(files[0]));
      setPickupPhoto2(files[1]);
      setPickupPreview2(URL.createObjectURL(files[1]));
      toast.success("2 photos attached successfully.");
      return;
    }

    const file = files[0];
    if (slot === 1) {
      if (pickupPreview1) URL.revokeObjectURL(pickupPreview1);
      setPickupPhoto1(file);
      setPickupPreview1(URL.createObjectURL(file));
    } else {
      if (pickupPreview2) URL.revokeObjectURL(pickupPreview2);
      setPickupPhoto2(file);
      setPickupPreview2(URL.createObjectURL(file));
    }
  }

  function handleSetPickupPhoto1(file: File | null) {
    if (pickupPreview1) URL.revokeObjectURL(pickupPreview1);
    setPickupPhoto1(file);
    setPickupPreview1(file ? URL.createObjectURL(file) : null);
  }

  function handleSetPickupPhoto2(file: File | null) {
    if (pickupPreview2) URL.revokeObjectURL(pickupPreview2);
    setPickupPhoto2(file);
    setPickupPreview2(file ? URL.createObjectURL(file) : null);
  }

  function resetPickupPhotos() {
    if (pickupPreview1) URL.revokeObjectURL(pickupPreview1);
    if (pickupPreview2) URL.revokeObjectURL(pickupPreview2);
    setPickupPhoto1(null);
    setPickupPhoto2(null);
    setPickupPreview1(null);
    setPickupPreview2(null);
  }

  async function uploadPickupPhoto(
    file: File,
    path: string,
  ): Promise<string | null> {
    const supabase = createClient();
    const { error } = await supabase.storage
      .from("delivery-proofs")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) return null;
    const { data } = supabase.storage
      .from("delivery-proofs")
      .getPublicUrl(path);
    return data.publicUrl;
  }

  const [driverSearch, setDriverSearch] = useState("");
  const [driverStatusFilter, setDriverStatusFilter] = useState<
    "all" | "active" | "available"
  >("all");
  const [selectedDriverForView, setSelectedDriverForView] = useState<{
    id: string;
    full_name: string;
    phone: string;
    email: string;
    created_at?: string;
    initial_password?: string | null;
    activeCount: number;
    completedCount: number;
    totalAssigned: number;
    isOnRoad: boolean;
    allDeliveries: Array<{
      id: string;
      type: "order" | "customize";
      trackingNumber: string;
      customerName: string;
      customerPhone?: string | null;
      shippingAddress: string;
      scheduledDate: string | null;
      deliveryStatus: string;
      deliveredAt?: string | null;
      itemCount: number;
      rawOrder?: Order;
      rawCustomize?: CustomizeRequest;
    }>;
  } | null>(null);

  const [notifyModalDriver, setNotifyModalDriver] = useState<{
    id: string;
    full_name: string;
    phone: string;
  } | null>(null);
  const [notifyPreset, setNotifyPreset] = useState<string>("out_for_delivery");
  const [notifyTitle, setNotifyTitle] = useState<string>("Dispatch Reminder");
  const [notifyMessage, setNotifyMessage] = useState<string>(
    "Please update delivery status to Out for Delivery and begin delivery route.",
  );
  const [notifyDeliveryRef, setNotifyDeliveryRef] = useState<string | null>(
    null,
  );
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  const [showDriverCredentials, setShowDriverCredentials] = useState(false);
  const [showPlainPassword, setShowPlainPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newDriverPasswordInput, setNewDriverPasswordInput] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleCopyText = (text: string, fieldName: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleSaveNewPassword = async () => {
    if (!selectedDriverForView) return;
    if (!newDriverPasswordInput || newDriverPasswordInput.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch("/api/admin/drivers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: selectedDriverForView.id,
          newPassword: newDriverPasswordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update password.");
        setIsUpdatingPassword(false);
        return;
      }

      toast.success(
        `Password for ${selectedDriverForView.full_name} updated successfully!`,
      );
      setSelectedDriverForView((prev) =>
        prev ? { ...prev, initial_password: newDriverPasswordInput } : null,
      );
      setIsResettingPassword(false);
      setNewDriverPasswordInput("");
      setShowPlainPassword(true);
      await refreshDrivers();
    } catch {
      toast.error("Failed to update password. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [addDriverName, setAddDriverName] = useState("");
  const [addDriverPhone, setAddDriverPhone] = useState("");
  const [addDriverEmail, setAddDriverEmail] = useState("");
  const [addDriverPassword, setAddDriverPassword] = useState("");
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addDriverBusy, setAddDriverBusy] = useState(false);
  const [addDriverError, setAddDriverError] = useState("");

  const handleOpenAddDriver = () => {
    setAddDriverName("");
    setAddDriverPhone("");
    setAddDriverEmail("");
    setAddDriverPassword("");
    setShowAddPassword(false);
    setAddDriverError("");
    setIsAddDriverOpen(true);
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = addDriverName.trim();
    const trimmedPhone = addDriverPhone.trim();
    const trimmedEmail = addDriverEmail.trim();

    if (!trimmedName || !trimmedPhone || !trimmedEmail || !addDriverPassword) {
      setAddDriverError("All fields are required.");
      return;
    }

    if (trimmedName.length < 2 || !/^[a-zA-ZñÑ\s.'-]+$/.test(trimmedName)) {
      setAddDriverError(
        "Full name must have at least 2 characters with letters only.",
      );
      return;
    }

    if (!/^09\d{9}$/.test(trimmedPhone)) {
      setAddDriverError(
        "Phone number must start with 09 and be exactly 11 digits.",
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setAddDriverError("Please enter a valid email address.");
      return;
    }

    if (addDriverPassword.length < 6) {
      setAddDriverError("Password must be at least 6 characters.");
      return;
    }

    setAddDriverBusy(true);
    setAddDriverError("");

    try {
      const res = await fetch("/api/auth/driver-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: trimmedName,
          phone: trimmedPhone,
          email: trimmedEmail,
          password: addDriverPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddDriverError(data.error || "Failed to create driver account.");
        setAddDriverBusy(false);
        return;
      }

      toast.success(`Driver account for ${trimmedName} created successfully!`);
      setIsAddDriverOpen(false);
      await refreshDrivers();
    } catch {
      setAddDriverError("An unexpected error occurred. Please try again.");
    } finally {
      setAddDriverBusy(false);
    }
  };

  // ── Compute full driver statistics and active assignments ─────────────────
  const driverStatsList = useMemo(() => {
    return registeredDrivers.map((driver) => {
      const driverOrders = orders.filter(
        (o) =>
          o.driver_id === driver.id ||
          (o.driver_name &&
            o.driver_name.toLowerCase().trim() ===
              driver.full_name.toLowerCase().trim()),
      );
      const driverCustomize = customizeRequests.filter(
        (r) =>
          r.driver_id === driver.id ||
          (r.driver_name &&
            r.driver_name.toLowerCase().trim() ===
              driver.full_name.toLowerCase().trim()),
      );

      const allDeliveries = [
        ...driverOrders.map((o) => ({
          id: o.id,
          type: "order" as const,
          trackingNumber: o.order_number,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          shippingAddress: o.shipping_address || "No address provided",
          scheduledDate: o.scheduled_date,
          deliveryStatus: o.delivery_status || "Preparing",
          deliveredAt: o.delivered_at,
          itemCount: o.order_items?.length || 1,
          rawOrder: o,
        })),
        ...driverCustomize.map((r) => ({
          id: r.id,
          type: "customize" as const,
          trackingNumber: r.request_number,
          customerName: r.customer_name,
          customerPhone: r.customer_phone,
          shippingAddress: r.shipping_address || "No address provided",
          scheduledDate: r.scheduled_date,
          deliveryStatus: r.delivery_status || "Preparing",
          deliveredAt: r.delivered_at,
          itemCount: 1,
          rawCustomize: r,
        })),
      ];

      const activeDeliveries = allDeliveries.filter(
        (d) =>
          d.deliveryStatus === "Preparing" ||
          d.deliveryStatus === "Out for Delivery",
      );
      const completedDeliveries = allDeliveries.filter(
        (d) => d.deliveryStatus === "Delivered",
      );
      const effectivePhone =
        driver.phone ||
        driverOrders.find((o) => !!o.driver_phone)?.driver_phone ||
        driverCustomize.find((r) => !!r.driver_phone)?.driver_phone ||
        "";

      return {
        ...driver,
        phone: effectivePhone,
        allDeliveries,
        activeDeliveries,
        completedDeliveries,
        activeCount: activeDeliveries.length,
        completedCount: completedDeliveries.length,
        totalAssigned: allDeliveries.length,
        isOnRoad: activeDeliveries.length > 0,
      };
    });
  }, [registeredDrivers, orders, customizeRequests]);

  // Keep selected driver synced with live data
  const selectedDriverId = selectedDriverForView?.id;
  useEffect(() => {
    if (selectedDriverId) {
      const updated = driverStatsList.find((d) => d.id === selectedDriverId);
      if (updated) {
        setSelectedDriverForView((prev) => {
          if (!prev) return updated;
          if (
            prev.initial_password !== updated.initial_password ||
            prev.activeCount !== updated.activeCount ||
            prev.completedCount !== updated.completedCount ||
            prev.allDeliveries.length !== updated.allDeliveries.length ||
            prev.full_name !== updated.full_name ||
            prev.phone !== updated.phone
          ) {
            return updated;
          }
          return prev;
        });
      }
    }
  }, [driverStatsList, selectedDriverId]);

  // Filtered drivers for the drivers tab
  const filteredDrivers = useMemo(() => {
    return driverStatsList.filter((d) => {
      const q = driverSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.full_name.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.phone?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (driverStatusFilter === "active") return d.isOnRoad;
      if (driverStatusFilter === "available") return !d.isOnRoad;
      return true;
    });
  }, [driverStatsList, driverSearch, driverStatusFilter]);

  // Overall driver statistics metrics
  const totalRegisteredDrivers = registeredDrivers.length;
  const activeDriversCount = driverStatsList.filter((d) => d.isOnRoad).length;
  const totalOngoingDeliveries = driverStatsList.reduce(
    (acc, d) => acc + d.activeCount,
    0,
  );
  const totalCompletedDeliveries = driverStatsList.reduce(
    (acc, d) => acc + d.completedCount,
    0,
  );

  const handleOpenNotifyModal = (
    driver: { id: string; full_name: string; phone: string },
    deliveryNumber?: string,
  ) => {
    setNotifyModalDriver(driver);
    setNotifyDeliveryRef(deliveryNumber || null);
    if (deliveryNumber) {
      setNotifyPreset("out_for_delivery");
      setNotifyTitle(`Delivery Update - ${deliveryNumber}`);
      setNotifyMessage(
        `Hi ${driver.full_name.split(" ")[0]}, please check delivery ${deliveryNumber} and update status to Out for Delivery once on the way.`,
      );
    } else {
      setNotifyPreset("out_for_delivery");
      setNotifyTitle("Dispatch Reminder");
      setNotifyMessage(
        `Hi ${driver.full_name.split(" ")[0]}, please prepare assigned deliveries and set status to Out for Delivery when departing.`,
      );
    }
  };

  const handleSendDriverNotification = async () => {
    if (!notifyModalDriver) return;
    if (!notifyTitle.trim() || !notifyMessage.trim()) {
      toast.error("Please provide a notification title and message.");
      return;
    }

    try {
      setIsSendingNotification(true);
      const res = await fetch("/api/admin/drivers/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: notifyModalDriver.id,
          title: notifyTitle.trim(),
          message: notifyMessage.trim(),
          link: "/driver/deliveries",
          metadata: {
            delivery_ref: notifyDeliveryRef,
            sent_by_admin: true,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to send notification");
      }

      toast.success(`Notification sent to ${notifyModalDriver.full_name}!`);
      setNotifyModalDriver(null);
      setNotifyDeliveryRef(null);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to notify driver",
      );
    } finally {
      setIsSendingNotification(false);
    }
  };

  // Realtime Subscriptions for Orders & Customize Requests
  useEffect(() => {
    const supabase = createClient();
    const uniqueId = Math.random().toString(36).slice(2, 9);

    const ordersChannel = supabase
      .channel(`admin_delivery_orders_${uniqueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          refreshOrders();
        },
      )
      .subscribe();

    const customizeChannel = supabase
      .channel(`admin_delivery_customize_${uniqueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customize_requests" },
        () => {
          refreshCustomize();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(customizeChannel);
    };
  }, [refreshOrders, refreshCustomize]);

  // Keep open modals synced with real-time updates
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find((o) => o.id === selectedOrder.id);
      if (
        updated &&
        (updated.delivery_status !== selectedOrder.delivery_status ||
          updated.order_status !== selectedOrder.order_status ||
          updated.updated_at !== selectedOrder.updated_at)
      ) {
        setSelectedOrder(updated);
      }
    }
  }, [orders, selectedOrder]);

  useEffect(() => {
    if (selectedCustomize) {
      const updated = customizeRequests.find(
        (r) => r.id === selectedCustomize.id,
      );
      if (
        updated &&
        (updated.delivery_status !== selectedCustomize.delivery_status ||
          updated.status !== selectedCustomize.status ||
          updated.updated_at !== selectedCustomize.updated_at)
      ) {
        setSelectedCustomize(updated);
      }
    }
  }, [customizeRequests, selectedCustomize]);

  // Lock state is based on the SAVED DB status
  const isDelivered = selectedOrder?.delivery_status === "Delivered";
  const isCustomizeDelivered =
    selectedCustomize?.delivery_status === "Delivered";

  const hasChanges = useMemo(() => {
    if (!selectedOrder || !formState) return false;
    return (
      (formState.driver_id ?? null) !== (selectedOrder.driver_id ?? null) ||
      (formState.driver_name ?? "") !== (selectedOrder.driver_name ?? "") ||
      (formState.driver_phone ?? "") !== (selectedOrder.driver_phone ?? "") ||
      (formState.scheduled_date ?? null) !==
        (selectedOrder.scheduled_date ?? null)
    );
  }, [selectedOrder, formState]);

  const hasCustomizeDeliveryChanges = useMemo(() => {
    if (!selectedCustomize || !customizeDeliveryForm) return false;
    return (
      (customizeDeliveryForm.driver_id ?? null) !==
        (selectedCustomize.driver_id ?? null) ||
      (customizeDeliveryForm.driver_name ?? "") !==
        (selectedCustomize.driver_name ?? "") ||
      (customizeDeliveryForm.driver_phone ?? "") !==
        (selectedCustomize.driver_phone ?? "") ||
      (customizeDeliveryForm.scheduled_date ?? null) !==
        (selectedCustomize.scheduled_date ?? null)
    );
  }, [selectedCustomize, customizeDeliveryForm]);

  const isDriverSelected = useMemo(() => {
    return !!formState?.driver_name && formState.driver_name.trim().length >= 2;
  }, [formState]);

  const isScheduledDateValid = useMemo(() => {
    return !!formState?.scheduled_date;
  }, [formState]);

  const isCustomizeDriverSelected = useMemo(() => {
    return (
      !!customizeDeliveryForm?.driver_name &&
      customizeDeliveryForm.driver_name.trim().length >= 2
    );
  }, [customizeDeliveryForm]);

  // Auto-open from query param — orders
  useEffect(() => {
    const isSubdomain = window.location.hostname.startsWith("admin.");
    const base = isSubdomain ? "" : "/admin";

    const orderNumber = searchParams.get("order");
    const orderId = searchParams.get("order_id");
    if (orderNumber || orderId) {
      const match = orders.find((o) =>
        orderNumber ? o.order_number === orderNumber : o.id === orderId,
      );
      if (match) {
        openOrderForDelivery(match, setSelectedOrder, setFormState);
        router.replace(`${base}/delivery-status`, { scroll: false });
        return;
      }
    }
    // Auto-open from query param — customize request
    const requestNumber = searchParams.get("request");
    if (requestNumber) {
      // Use live SWR data so newly-Completed requests are found immediately
      const matchCustomize = (rawCustomize ?? []).find(
        (r) => r.request_number === requestNumber,
      );
      if (matchCustomize) {
        openCustomizeForDelivery(
          matchCustomize,
          setSelectedCustomize,
          setCustomizeDeliveryForm,
        );
        setActiveTab("customize");
        router.replace(`${base}/delivery-status`, { scroll: false });
      }
    }
  }, [searchParams, orders, rawCustomize, router]);
