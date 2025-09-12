import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from "next/font/google";
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ConditionalHeader } from '../presentation/components/ConditionalHeader';
import "./globals.css";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cliquealomx",
  description: "Aplicación con arquitectura DDD, Next.js, NestJS y Clerk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es" suppressHydrationWarning>
        <head>
          <ColorSchemeScript />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <MantineProvider>
            <Notifications />
            <ConditionalHeader />
            {children}
          </MantineProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
