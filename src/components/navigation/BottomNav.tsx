'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Calendar, Home, Dumbbell } from 'lucide-react';

const navItems = [
  {
    name: 'Workout',
    href: '/workout',
    icon: Dumbbell,
  },
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    name: 'Review',
    href: '/review',
    icon: Calendar,
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement | null>(null);

  // Measure nav height on mount and update CSS variable for precise spacing
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const setVar = () => {
      const h = el.offsetHeight;
      document.documentElement.style.setProperty('--bottom-nav-height', `${h}px`);
    };
    setVar();
    const resizeObserver = new ResizeObserver(setVar);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <nav ref={navRef} className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs mt-1 font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
