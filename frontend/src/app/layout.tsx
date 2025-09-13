import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono, Readex_Pro, Roboto } from "next/font/google";
import { MantineProvider, ColorSchemeScript, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ConditionalHeader } from '../presentation/components/ConditionalHeader';
import { ConditionalFooter } from '../presentation/components/ConditionalFooter';
import "./globals.css";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/carousel/styles.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const readexPro = Readex_Pro({
  variable: "--font-readex-pro",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Cliquealomx",
  description: "Aplicación con arquitectura DDD, Next.js, NestJS y Clerk",
};

const theme = createTheme({
  primaryColor: 'cliquealow-green',
  fontFamily: 'var(--font-roboto), sans-serif',
  headings: {
    fontFamily: 'var(--font-readex-pro), sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2.5rem', fontWeight: '700' },
      h2: { fontSize: '2rem', fontWeight: '600' },
      h3: { fontSize: '1.75rem', fontWeight: '600' },
      h4: { fontSize: '1.5rem', fontWeight: '500' },
      h5: { fontSize: '1.25rem', fontWeight: '500' },
      h6: { fontSize: '1rem', fontWeight: '500' },
    },
  },
  colors: {
    'cliquealow-green': [
      '#f0fff4', // 50 - very light green
      '#c6f6d5', // 100 - light green
      '#9ae6b4', // 200 - lighter green
      '#68d391', // 300 - light-medium green
      '#48cc65', // 400 - medium green
      '#22c55e', // 500 - primary vibrant green
      '#16a34a', // 600 - darker green
      '#15803d', // 700 - dark green
      '#166534', // 800 - very dark green
      '#14532d', // 900 - darkest green
    ],
    'cliquealow-red': [
      '#fdeaea', // 50 - very light red
      '#fbd5d5', // 100 - light red
      '#f7aaaa', // 200 - lighter red
      '#f38080', // 300 - light-medium red
      '#ef5555', // 400 - medium red
      '#AD0000', // 500 - primary brand red
      '#8a0000', // 600 - darker red
      '#670000', // 700 - dark red
      '#440000', // 800 - very dark red
      '#220000', // 900 - darkest red
    ],
  },
  components: {
    Button: {
      defaultProps: {
        color: 'cliquealow-green',
      },
    },
    Badge: {
      defaultProps: {
        color: 'cliquealow-green',
      },
    },
  },
});

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
          className={`${geistSans.variable} ${geistMono.variable} ${readexPro.variable} ${roboto.variable} antialiased`}
        >
          <MantineProvider theme={theme}>
            <Notifications />
            <ConditionalHeader />
            {children}
            <ConditionalFooter />
          </MantineProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
