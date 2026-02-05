import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  FileText,
  History,
  Truck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wrench,
  LogOut,
  Wallet,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// IDs correspond to the valid sections in RBAC
const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { id: 'productos', icon: Package, label: 'Productos', path: '/productos' },
  { id: 'cotizaciones', icon: FileText, label: 'Cotizaciones', path: '/cotizaciones' },
  { id: 'ventas', icon: History, label: 'Historial de Ventas', path: '/ventas' },
  { id: 'creditos', icon: Wallet, label: 'Créditos y Clientes', path: '/creditos' },
  { id: 'guias', icon: Truck, label: 'Guías de Remisión', path: '/guias' },
  { id: 'configuracion', icon: Settings, label: 'Configuración', path: '/configuracion' },
];

interface SidebarContentProps {
  collapsed?: boolean;
  onItemClick?: () => void;
}

function SidebarContent({ collapsed, onItemClick }: SidebarContentProps) {
  const location = useLocation();
  const { hasPermission, signOut } = useAuth();
  const filteredItems = menuItems.filter(item => hasPermission(item.id));

  return (
    <div className="flex h-full flex-col">
       {/* Logo */}
       <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-orange">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground">
              FerrePOS
            </span>
          )}
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onItemClick}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'gradient-primary text-primary-foreground shadow-orange'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    collapsed && 'justify-center px-3'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'animate-pulse-orange')} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <button
          onClick={signOut}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200',
            collapsed && 'justify-center px-3'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-screen transition-all duration-300 gradient-dark md:flex flex-col',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'absolute -right-3 top-6 z-50 rounded-lg p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors bg-sidebar-accent shadow-md',
            !collapsed && 'hidden group-hover:block' // Show on hover or if collapsed
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
        
        <SidebarContent collapsed={collapsed} />
      </aside>
    </>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 border-r-0 w-72 gradient-dark text-sidebar-foreground">
        <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle> {/* Accessibility */}
        </SheetHeader>
        <SidebarContent onItemClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
