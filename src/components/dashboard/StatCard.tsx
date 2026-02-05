import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: 'primary' | 'success' | 'warning' | 'accent';
}

const iconColors = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  accent: 'bg-accent/10 text-accent',
};

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'primary',
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/5 transition-transform duration-300 group-hover:scale-150" />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p
              className={cn(
                'mt-1 text-xs font-medium',
                changeType === 'positive' && 'text-success',
                changeType === 'negative' && 'text-destructive',
                changeType === 'neutral' && 'text-muted-foreground'
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn('rounded-lg p-2.5', iconColors[iconColor])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
