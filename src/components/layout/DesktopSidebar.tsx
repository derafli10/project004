import React from 'react';
import { Home, BookOpen, BarChart2, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: Home, href: '/dashboard' },
  { name: 'Courses', icon: BookOpen, href: '/courses' },
  { name: 'Analytics', icon: BarChart2, href: '/analytics' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export function DesktopSidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 border-r-brutal border-brutal-border bg-brutal-black z-40">
      <div className="p-6 border-b-brutal border-brutal-border">
        <h2 className="text-xl font-heading font-bold text-brutal-text tracking-tight uppercase">
          Optimizer
        </h2>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              className="flex items-center space-x-3 px-4 py-3 min-h-[44px] text-brutal-text-secondary hover:text-brutal-text hover:bg-brutal-border/10 font-bold transition-colors"
              aria-label={`Navigate to ${item.name}`}
            >
              <Icon size={20} strokeWidth={2.5} className="text-brutal-orange" />
              <span>{item.name}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
