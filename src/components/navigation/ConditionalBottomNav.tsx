'use client';

import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';

export function ConditionalBottomNav() {
  const pathname = usePathname();
  
  // Hide BottomNav for all session routes
  const isSessionRoute = pathname.startsWith('/session/');
  
  if (isSessionRoute) {
    return null;
  }
  
  return <BottomNav />;
}