import React from 'react';
import { cn } from '@/lib/utils';

interface RupiahIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RupiahIcon({ className, size = 'md' }: RupiahIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold',
        sizeClasses[size],
        className
      )}
    >
      Rp
    </div>
  );
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
