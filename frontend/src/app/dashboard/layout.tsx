import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Cliquéalo.mx",
  description: "Gestiona tus anuncios de autos usados",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}