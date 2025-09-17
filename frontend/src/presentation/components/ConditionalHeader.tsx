'use client';

import { usePathname } from 'next/navigation';
import { DynamicHeader } from './DynamicHeader';

export function ConditionalHeader() {
  const pathname = usePathname();

  // No mostrar Header en rutas del dashboard
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  return <DynamicHeader />;
}