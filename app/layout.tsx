import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { LanguageProvider } from "@/context/LanguageContext";
import { Toaster } from "@/components/ui/sonner";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MSWD San Luis, Pampanga",
  description: "Official digital services portal for the Municipal Social Welfare and Development Office of San Luis, Pampanga",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MSWD SLP",
  },
  formatDetection: { telephone: false },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
            <Toaster position="top-center" richColors />
            <PWAInstallPrompt />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
