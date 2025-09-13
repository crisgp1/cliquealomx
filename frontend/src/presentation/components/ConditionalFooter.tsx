'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // No mostrar Footer en rutas del dashboard
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }
  
  return <Footer />;
}