'use client';

import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';

export function ConditionalBottomNav() {
  const pathname = usePathname();
  
  // Hide BottomNav for session and auth routes
  const isSessionRoute = pathname.startsWith('/session/');
  const isAuthRoute = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

  if (isSessionRoute || isAuthRoute) {
    return null;
  }
  
  return <BottomNav />;
}