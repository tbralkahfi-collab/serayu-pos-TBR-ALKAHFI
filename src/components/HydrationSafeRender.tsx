import React from 'react';
import { useData } from '@/contexts/DataContext';

interface HydrationSafeRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * HydrationSafeRender - Prevents UI from rendering empty state before hydration
 * 
 * Usage:
 * <HydrationSafeRender>
 *   <YourComponent />
 * </HydrationSafeRender>
 * 
 * or with custom fallback:
 * <HydrationSafeRender fallback={<LoadingSpinner />}>
 *   <YourComponent />
 * </HydrationSafeRender>
 */
export const HydrationSafeRender: React.FC<HydrationSafeRenderProps> = ({ 
  children, 
  fallback = <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
}) => {
  const { isHydrated, isLoading } = useData();

  // Show loading state during initial load or hydration
  if (!isHydrated || isLoading) {
    return <>{fallback}</>;
  }

  // Render children once hydration is complete
  return <>{children}</>;
};

export default HydrationSafeRender;
