'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, User, Plus, Sparkles, BookOpen } from 'lucide-react';

export function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
      }
    });
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="px-6 py-3.5 border-b border-[#262626] flex justify-between items-center backdrop-blur-md sticky top-0 z-50 bg-[#0c0c0c]/85">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white/95 group-hover:text-white transition-colors">
            CreatorPassport
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-md transition-colors ${pathname === '/dashboard' ? 'text-white bg-[#1a1a1a]' : 'text-gray-400 hover:text-white hover:bg-[#151515]'}`}
          >
            Dashboard
          </Link>
          <Link
            href="/onboarding"
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${pathname === '/onboarding' ? 'text-white bg-[#1a1a1a]' : 'text-gray-400 hover:text-white hover:bg-[#151515]'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Voice Profile
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/campaigns/new">
          <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white rounded-full px-4 gap-1.5 shadow-md shadow-purple-600/20">
            <Plus className="w-3.5 h-3.5" />
            New Campaign
          </Button>
        </Link>
        {userEmail && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 bg-[#161616] border border-[#2a2a2a] px-3 py-1.5 rounded-full">
            <User className="w-3.5 h-3.5 text-gray-500" />
            <span className="max-w-[140px] truncate">{userEmail}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-full p-2 h-8 w-8"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
