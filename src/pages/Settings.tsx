import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, User, CreditCard, Bell, Shield, Database } from 'lucide-react';
import { UserManagementModal } from '@/components/users/UserManagementModal';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

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
    action: 'users',
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
  const [showUserModal, setShowUserModal] = useState(false);
  const { settings, isLoading, updateSettings } = useBusinessSettings();
  
  // Local state for form
  const [formData, setFormData] = useState({
    name: '',
    rfc: '',
    address: '',
    phone: '',
    email: '',
  });

  // Load settings into form when fetched
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateSettings.mutate(formData);
  };

  const handleSectionClick = (action?: string) => {
    if (action === 'users') {
      setShowUserModal(true);
    }
  };

  return (
    <MainLayout title="Configuración" subtitle="Personaliza tu sistema">
      <div className="max-w-4xl">
        {/* Business Info Form */}
        <div className="rounded-2xl bg-card p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-foreground">
              Información del Negocio
            </h3>
            {isLoading && <span className="text-xs text-muted-foreground">Cargando...</span>}
          </div>
          <p className="text-sm text-muted-foreground">
            Estos datos aparecerán en cotizaciones y facturas
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">
                Nombre del Negocio
              </label>
              <Input 
                className="mt-1" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. Ferretería El Martillo"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">RUC</label>
              <Input 
                className="mt-1" 
                name="rfc"
                value={formData.rfc}
                onChange={handleChange}
                placeholder="RUC del negocio"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Dirección
              </label>
              <Input
                className="mt-1"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Dirección completa"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Teléfono
              </label>
              <Input 
                className="mt-1" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Teléfono de contacto"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input 
                className="mt-1" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Correo electrónico"
              />
            </div>
          </div>

          <Button 
            className="mt-6" 
            onClick={handleSave} 
            disabled={updateSettings.isPending || isLoading}
          >
            {updateSettings.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        {/* Settings Grid */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {settingsSections.slice(1).map((section) => (
            <div
              key={section.title}
              onClick={() => handleSectionClick(section.action)}
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

      <UserManagementModal 
        isOpen={showUserModal} 
        onClose={() => setShowUserModal(false)} 
      />
    </MainLayout>
  );
}
