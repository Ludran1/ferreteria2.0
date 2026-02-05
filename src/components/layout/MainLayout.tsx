import { ReactNode } from 'react';
import { Sidebar, MobileSidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn('md:ml-64 transition-all duration-300')}>
        <Header title={title} subtitle={subtitle} mobileTrigger={<MobileSidebar />} />
        <main className="p-4 md:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
