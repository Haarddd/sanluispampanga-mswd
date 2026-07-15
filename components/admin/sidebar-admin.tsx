"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  UsersRound,
  LogOut,
  EllipsisVertical,
  Pill,
  Inbox,
  CreditCard,
  Hexagon,
  Archive,
  MapPin,
  Megaphone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function AdminSidebar() {
  const [account, setAccount] = useState(false);
  const [adminName, setAdminName] = useState("MSWD Admin");
  const [adminEmail, setAdminEmail] = useState("smwdsanluispampanga@gmail.com");
  const [adminInitials, setAdminInitials] = useState("AD");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const [isSubdomain, setIsSubdomain] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSubdomain(window.location.hostname.startsWith("admin."));
  }, []);

  const p = (path: string) => (isSubdomain ? path : `/admin${path}`);

  const navItems = [
    {
      group: "MAIN",
      items: [
        { href: p("/dashboard"), icon: LayoutDashboard, label: "Dashboard" },
      ],
    },
    {
      group: "SERVICES MANAGEMENT",
      items: [
        { href: p("/seniors"), icon: UsersRound, label: "Citizen Directory" },
        { href: p("/tracking"), icon: MapPin, label: "Citizen Tracker" },
        { href: p("/digital-ids"), icon: CreditCard, label: "Digital IDs" },
        { href: p("/medicine"), icon: Pill, label: "Medicine Inventory" },
        { href: p("/requests"), icon: Inbox, label: "Request Queue" },
        {
          href: p("/announcements-benefits"),
          icon: Megaphone,
          label: "Announcement & Benefit",
        },
      ],
    },
    {
      group: "SYSTEM",
      items: [
        { href: p("/archive"), icon: Archive, label: "Archive" },
        { href: p("/logs"), icon: Hexagon, label: "Logs" },
      ],
    },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  useEffect(() => {
    async function getProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, email, avatar_url")
          .eq("id", user.id)
          .single();

        if (profile) {
          const firstName = profile.first_name ?? "";
          const lastName = profile.last_name ?? "";
          const fullName = [firstName, lastName].filter(Boolean).join(" ");

          setAdminEmail(profile.email ?? user.email ?? "");
          setAvatarUrl(profile.avatar_url ?? null);

          if (fullName) {
            setAdminName(fullName);
            const initials = [firstName[0], lastName[0]]
              .filter(Boolean)
              .join("")
              .toUpperCase();
            setAdminInitials(initials || "AD");
          } else {
            const emailName = (profile.email ?? user.email ?? "").split("@")[0];
            setAdminName(emailName);
            setAdminInitials(emailName.slice(0, 2).toUpperCase());
          }
        }
      }
    }

    getProfile();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node)
      ) {
        setAccount(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(isSubdomain ? "/authentication" : "/admin-authentication");
  }

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="py-3.5 px-4 border-b">
        <div className="flex items-center gap-2">
          <Image
            src="/mswd.png"
            alt="MSWD Logo"
            width={36}
            height={36}
            className="shrink-0"
          />
          <div className="leading-tight">
            <h1 className="text-base font-semibold">MSWD</h1>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground h-6.5">
              {group.group}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map(({ href, icon: Icon, label }) => {
                const active = isActive(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={label}
                      isActive={active}
                    >
                      <Link
                        href={href}
                        className={cn(
                          "flex items-center gap-3 rounded-sm transition-colors",
                          active
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Icon
                          size={18}
                          className={cn(
                            active
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        />
                        <span className="text-base">{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="relative" ref={accountMenuRef}>
          <button
            onClick={() => setAccount(!account)}
            className={`w-full rounded-lg p-1 transition-colors ${account ? "bg-accent" : "hover:bg-accent"}`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={adminName} />}
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {adminInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{adminName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {adminEmail}
                </p>
              </div>
              <EllipsisVertical
                size={16}
                className="text-muted-foreground shrink-0"
              />
            </div>
          </button>

          {account && (
            <div className="absolute bottom-full left-0 w-full z-50 bg-popover border rounded-lg shadow-lg overflow-hidden mb-2">
              <div className="p-2 border-b">
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="h-8 w-8">
                    {avatarUrl && (
                      <AvatarImage src={avatarUrl} alt={adminName} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {adminInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{adminName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {adminEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t p-1">
                <SidebarMenuItem>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAccount(false);
                      handleLogout();
                    }}
                    className="w-full justify-start gap-3 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-9"
                  >
                    <LogOut size={18} />
                    <span>Log out</span>
                  </Button>
                </SidebarMenuItem>
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
