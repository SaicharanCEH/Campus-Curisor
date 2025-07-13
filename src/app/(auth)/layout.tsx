'use client';

import React from 'react';
import DashboardHeader from '@/components/dashboard-header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
       <DashboardHeader isAuthenticated={false} onLogout={() => {}} />
       <main className="flex flex-1 flex-col items-center justify-center p-4">
         {children}
       </main>
    </div>
  );
}
