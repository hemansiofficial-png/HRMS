'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, Settings, User, ChevronDown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserProfile() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Prevent hydration mismatch
  if (!isMounted || !session?.user) {
    return (
      <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  const handleLogout = async () => {
    await signOut({ redirect: true, redirectTo: '/auth/signin' });
  };

  const initials = session.user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-700';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700';
      case 'HR_MANAGER':
        return 'bg-blue-100 text-blue-700';
      case 'PAYROLL_ADMIN':
        return 'bg-green-100 text-green-700';
      case 'MANAGER':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all duration-200',
          'hover:bg-gray-100',
          isOpen && 'bg-gray-100'
        )}
        suppressHydrationWarning
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-keka-primary to-keka-primary-dark shadow-md">
          <span className="text-sm font-bold text-white">{initials}</span>
        </div>
        <div className="text-left hidden md:block">
          <p className="text-sm font-bold text-text-primary" suppressHydrationWarning>
            {session.user.name || 'User'}
          </p>
          <span className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-bold',
            getRoleColor(String(session.user.role).toUpperCase())
          )}>
            {String(session.user.role).replace(/_/g, ' ')}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-text-secondary transition-transform duration-200 hidden md:block',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-64 rounded-xl border border-border-light',
            'bg-white shadow-float overflow-hidden z-50'
          )}
        >
          {/* User Info Header */}
          <div className="px-4 py-3.5 bg-gradient-to-br from-keka-primary-light to-keka-primary/5 border-b border-border-light">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-keka-primary to-keka-primary-dark shadow-md">
                <span className="text-base font-bold text-white">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">
                  {session.user.name || 'User'}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
            <div className="mt-2.5">
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold',
                getRoleColor(String(session.user.role).toUpperCase())
              )}>
                <Shield className="h-3 w-3" />
                {String(session.user.role).replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm font-medium',
                'text-text-secondary hover:text-keka-primary hover:bg-keka-primary-light transition-colors'
              )}
            >
              <User className="h-4 w-4" />
              My Profile
            </Link>
            <Link
              href="/settings/subscription"
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm font-medium',
                'text-text-secondary hover:text-keka-primary hover:bg-keka-primary-light transition-colors'
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>

          {/* Logout */}
          <div className="py-2 border-t border-border-light">
            <button
              onClick={handleLogout}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium',
                'text-red-600 hover:bg-red-50 transition-colors'
              )}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
