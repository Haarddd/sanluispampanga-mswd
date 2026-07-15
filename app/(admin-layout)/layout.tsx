import AdminHeader from "@/components/admin/header-admin";
import AdminSidebar from "@/components/admin/sidebar-admin";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminProvider } from "@/components/admin/admin-store-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminProvider>
      <TooltipProvider>
        <SidebarProvider>
          <AdminSidebar />
          <SidebarInset className="flex flex-col h-screen overflow-hidden">
            <AdminHeader />
            <main className="flex-1 p-5 overflow-y-auto overflow-x-hidden scroll-smooth">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AdminProvider>
  );
}
