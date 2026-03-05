import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { InstallBanner } from '@/components/InstallBanner';

export function Layout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <Outlet />
      </main>
      <InstallBanner />
    </div>
  );
}
