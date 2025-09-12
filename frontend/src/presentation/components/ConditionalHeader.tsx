'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // No mostrar Header en rutas del dashboard
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }
  
  return <Header />;
}