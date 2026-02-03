import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Package, Truck } from 'lucide-react';

const actions = [
  {
    icon: Plus,
    label: 'Nueva Venta',
    description: 'Registrar una venta',
    path: '/cotizaciones',
    variant: 'default' as const,
  },
  {
    icon: FileText,
    label: 'Cotización',
    description: 'Crear cotización',
    path: '/cotizaciones',
    variant: 'outline' as const,
  },
  {
    icon: Package,
    label: 'Inventario',
    description: 'Ver productos',
    path: '/productos',
    variant: 'secondary' as const,
  },
  {
    icon: Truck,
    label: 'Remisión',
    description: 'Nueva guía',
    path: '/guias',
    variant: 'secondary' as const,
  },
];

export function QuickActions() {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-md">
      <h3 className="text-lg font-semibold text-foreground">Acciones Rápidas</h3>
      <p className="text-sm text-muted-foreground">Operaciones frecuentes</p>
      
      <div className="mt-6 grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link key={action.label} to={action.path}>
            <Button
              variant={action.variant}
              className="h-auto w-full flex-col gap-2 p-4 text-left"
            >
              <action.icon className="h-6 w-6" />
              <div>
                <p className="font-semibold">{action.label}</p>
                <p className="text-xs opacity-70">{action.description}</p>
              </div>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
