import React from 'react';
import { Home, BookOpen, BarChart2, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: Home, href: '/dashboard' },
  { name: 'Courses', icon: BookOpen, href: '/courses' },
  { name: 'Analytics', icon: BarChart2, href: '/analytics' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t-brutal border-brutal-border bg-brutal-black z-40 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] text-brutal-text-secondary hover:text-brutal-text active:bg-brutal-border/10 transition-colors"
              aria-label={`Navigate to ${item.name}`}
            >
              <Icon size={20} strokeWidth={2.5} className="mb-1 text-brutal-orange" />
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider">{item.name}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
