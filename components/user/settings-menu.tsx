"use client";

import { useState } from "react";
import {
  UserPen,
  KeyRound,
  Bell,
  Globe,
  LogOut,
  ChevronRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/LanguageContext";
import { signOut } from "@/app/actions/auth";
import {
  updateProfileLanguage,
  updateProfileNotifications,
} from "@/app/actions/profile";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface SettingsMenuProps {
  initialSmsNotifications?: boolean;
}

export function SettingsMenu({
  initialSmsNotifications = true,
}: SettingsMenuProps) {
  const { t, language, setLanguage } = useLanguage();
  const [smsNotifications, setSmsNotifications] = useState(
    initialSmsNotifications,
  );
  const [updatingNotifications, setUpdatingNotifications] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLanguageToggle = async () => {
    const nextLang = language === "en" ? "tl" : "en";
    setLanguage(nextLang);
    // Persist to DB (non-blocking / optimistic update in UI)
    await updateProfileLanguage(nextLang === "en" ? "English" : "Tagalog");
  };

  const handleNotificationsToggle = async (checked: boolean) => {
    setSmsNotifications(checked);
    setUpdatingNotifications(true);
    try {
      await updateProfileNotifications(checked);
      toast.success(
        language === "tl"
          ? "Nag-update ang notification settings"
          : "Notification settings updated",
      );
    } catch (err) {
      console.error(err);
      toast.error(
        language === "tl"
          ? "Nabigo ang pag-update ng settings"
          : "Failed to update settings",
      );
    } finally {
      setUpdatingNotifications(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error(err);
      setLoggingOut(false);
    }
  };

  const menuItems = [
    {
      icon: UserPen,
      label: t.editProfile,
      description: t.editProfileSub,
      onClick: () =>
        alert(
          language === "tl"
            ? "Tampok na Profile - I-uupdate pa lamang"
            : "Profile feature coming soon",
        ),
    },
    {
      icon: KeyRound,
      label: t.changePin,
      description: t.changePinSub,
      onClick: () =>
        alert(
          language === "tl"
            ? "Tampok na PIN - I-uupdate pa lamang"
            : "PIN feature coming soon",
        ),
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Theme toggle row */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{t.theme}</p>
            <p className="text-xs text-muted-foreground">{t.themeSub}</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <Separator />

      {/* Language Toggle Row (Interactive) */}
      <button
        type="button"
        onClick={handleLanguageToggle}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-accent active:bg-accent"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Globe className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{t.language}</p>
            <p className="text-xs text-muted-foreground">{t.languageSub}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
            {language}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>

      <Separator />

      {/* Notifications Row */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {t.notifications}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.notificationsSub}
            </p>
          </div>
        </div>
        <Switch
          checked={smsNotifications}
          onCheckedChange={handleNotificationsToggle}
          disabled={updatingNotifications}
        />
      </div>

      <Separator />

      {/* Menu items */}
      {menuItems.map((item, index) => (
        <div key={item.label}>
          <button
            type="button"
            onClick={item.onClick}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-accent active:bg-accent"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          {index < menuItems.length - 1 && <Separator />}
        </div>
      ))}

      <Separator />

      {/* Logout */}
      <button
        type="button"
        onClick={() => setShowLogoutModal(true)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-destructive/10"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
          <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
        <p className="text-base font-medium text-red-600 dark:text-red-400">
          {t.logout}
        </p>
      </button>

      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent
          className="max-w-sm rounded-sm p-0"
          showCloseButton={false}
        >
          <DialogTitle className="flex items-center justify-between px-6 py-3 border-b">
            <p className="font-semibold text-sm">
              {language === "tl"
                ? "Kumpirmahin ang Pag-logout"
                : "Confirm Logout"}
            </p>
          </DialogTitle>
          <div className="px-6 pb-4 space-y-4">
            <div>
              <p className="text-base text-muted-foreground">
                {language === "tl"
                  ? "Sigurado ka bang nais mong lumabas sa iyong account?"
                  : "Are you sure you want to log out of your account?"}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-9 text-sm"
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                type="button"
              >
                {language === "tl" ? "I-cancel" : "Cancel"}
              </Button>
              <Button
                variant="default"
                className="flex-1 h-9 text-sm relative"
                onClick={handleLogout}
                disabled={loggingOut}
                type="button"
              >
                <span className={loggingOut ? "invisible" : "visible"}>
                  {language === "tl" ? "Magpatuloy" : "Continue"}
                </span>
                {loggingOut && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="size-4 animate-spin" />
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
