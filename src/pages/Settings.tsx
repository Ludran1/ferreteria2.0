import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, User, CreditCard, Bell, Shield, Database } from 'lucide-react';

const settingsSections = [
  {
    icon: Building2,
    title: 'Información del Negocio',
    description: 'Nombre, dirección y datos fiscales',
  },
  {
    icon: User,
    title: 'Usuarios',
    description: 'Gestiona empleados y permisos',
  },
  {
    icon: CreditCard,
    title: 'Métodos de Pago',
    description: 'Configura formas de pago aceptadas',
  },
  {
    icon: Bell,
    title: 'Notificaciones',
    description: 'Alertas de stock y recordatorios',
  },
  {
    icon: Shield,
    title: 'Seguridad',
    description: 'Contraseña y autenticación',
  },
  {
    icon: Database,
    title: 'Respaldos',
    description: 'Exportar e importar datos',
  },
];

export default function Settings() {
  return (
    <MainLayout title="Configuración" subtitle="Personaliza tu sistema">
      <div className="max-w-4xl">
        {/* Business Info Form */}
        <div className="rounded-2xl bg-card p-6 shadow-md">
          <h3 className="text-lg font-semibold text-foreground">
            Información del Negocio
          </h3>
          <p className="text-sm text-muted-foreground">
            Estos datos aparecerán en cotizaciones y facturas
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">
                Nombre del Negocio
              </label>
              <Input className="mt-1" defaultValue="Ferretería El Martillo" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">RFC</label>
              <Input className="mt-1" defaultValue="FEM123456789" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Dirección
              </label>
              <Input
                className="mt-1"
                defaultValue="Av. Principal 123, Col. Centro, CP 12345"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Teléfono
              </label>
              <Input className="mt-1" defaultValue="555-123-4567" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input className="mt-1" defaultValue="contacto@ferreteria.com" />
            </div>
          </div>

          <Button className="mt-6">Guardar Cambios</Button>
        </div>

        {/* Settings Grid */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {settingsSections.slice(1).map((section) => (
            <div
              key={section.title}
              className="group flex items-center gap-4 rounded-2xl bg-card p-5 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary transition-colors group-hover:bg-primary/10">
                <section.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{section.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="mt-8 rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-6">
          <h3 className="font-semibold text-destructive">Zona de Peligro</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Acciones irreversibles. Procede con precaución.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
              Eliminar todos los datos
            </Button>
            <Button variant="outline">Exportar todo</Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
