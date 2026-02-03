import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Productos', path: '/productos' },
  { icon: FileText, label: 'Cotizaciones', path: '/cotizaciones' },
  { icon: History, label: 'Historial de Ventas', path: '/ventas' },
  { icon: Truck, label: 'Guías de Remisión', path: '/guias' },
  { icon: Settings, label: 'Configuración', path: '/configuracion' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300 gradient-dark',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center w-full')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-orange">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground">
              FerrePOS
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'rounded-lg p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors',
            collapsed && 'absolute -right-3 top-6 bg-sidebar-accent shadow-md'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
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

      {/* Footer */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-xl bg-sidebar-accent p-4">
            <p className="text-xs text-sidebar-foreground/60">
              © 2024 FerrePOS
            </p>
            <p className="text-xs text-sidebar-foreground/40">
              Sistema de Punto de Venta
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
