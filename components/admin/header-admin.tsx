"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Bell } from "lucide-react";
import { Button } from "../ui/button";

export default function AdminHeader() {
  return (
    <div className="sticky z-50 top-0 w-full bg-background/95 backdrop-blur border-b border-border">
      <header className="flex h-15 items-center justify-between px-6">
        <div className="flex items-center">
          <SidebarTrigger />
          <div className="h-4 w-[1.5px] bg-accent mx-2 hidden sm:block" />
          <h1 className="pl-2 text-base font-medium text-muted-foreground hidden sm:block">
            Admin Panel
          </h1>
        </div>

        <div className="flex items-center">
          <ThemeToggle />

          <div className="h-5 w-[1.5px] bg-accent mx-2" />

          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Notifications"
            className="relative"
            onClick={() => alert("Notification panel coming soon")}
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-red-500" />
          </Button>
        </div>
      </header>
    </div>
  );
}
