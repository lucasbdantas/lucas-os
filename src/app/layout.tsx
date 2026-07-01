import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import {
  APP_THEME_COOKIE,
  parseThemeCookie,
} from "@/lib/app-settings/preferences";
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
  applicationName: "Lucas OS",
  title: "Lucas OS",
  description: "Personal operations dashboard for Lucas Batista Dantas",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lucas OS",
  },
  icons: {
    icon: "/icons/lucas-os-icon.svg",
    apple: "/icons/lucas-os-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4efe4",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = parseThemeCookie(cookieStore.get(APP_THEME_COOKIE)?.value);

  return (
    <html
      lang="pt-BR"
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
