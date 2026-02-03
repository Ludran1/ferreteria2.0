import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockSales } from '@/data/mockData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Search, Truck, MapPin, Package, Printer, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Mock remission guides based on sales
const mockGuides = mockSales.slice(0, 2).map((sale, index) => ({
  id: `GR-00${index + 1}`,
  saleId: sale.id,
  customerName: sale.customerName,
  address: index === 0 ? 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX' : 'Calle Reforma 567, Col. Centro, Guadalajara',
  items: sale.items,
  date: sale.date,
  status: index === 0 ? 'pending' : 'delivered' as const,
}));

export default function RemissionGuides() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewGuide, setShowNewGuide] = useState(false);
  const [newGuide, setNewGuide] = useState({
    customerName: '',
    address: '',
    saleId: '',
  });
  const { toast } = useToast();

  const filteredGuides = mockGuides.filter(
    (guide) =>
      guide.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateGuide = () => {
    if (!newGuide.customerName || !newGuide.address) {
      toast({
        title: 'Error',
        description: 'Completa todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Guía creada',
      description: `Guía de remisión para ${newGuide.customerName}`,
    });

    setShowNewGuide(false);
    setNewGuide({ customerName: '', address: '', saleId: '' });
  };

  return (
    <MainLayout title="Guías de Remisión" subtitle="Gestiona las entregas de productos">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o número de guía..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="gap-2" onClick={() => setShowNewGuide(true)}>
          <Plus className="h-4 w-4" />
          Nueva Guía
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-card p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Guías</p>
              <p className="text-xl font-bold text-foreground">{mockGuides.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <Package className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-xl font-bold text-foreground">
                {mockGuides.filter((g) => g.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entregadas</p>
              <p className="text-xl font-bold text-foreground">
                {mockGuides.filter((g) => g.status === 'delivered').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* New Guide Form */}
      {showNewGuide && (
        <div className="mt-6 animate-fade-in rounded-2xl bg-card p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-foreground">Nueva Guía de Remisión</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input
              placeholder="Nombre del cliente *"
              value={newGuide.customerName}
              onChange={(e) => setNewGuide({ ...newGuide, customerName: e.target.value })}
            />
            <Input
              placeholder="ID de Venta (opcional)"
              value={newGuide.saleId}
              onChange={(e) => setNewGuide({ ...newGuide, saleId: e.target.value })}
            />
            <div className="md:col-span-2">
              <Input
                placeholder="Dirección de entrega *"
                value={newGuide.address}
                onChange={(e) => setNewGuide({ ...newGuide, address: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={handleCreateGuide}>Crear Guía</Button>
            <Button variant="outline" onClick={() => setShowNewGuide(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Guides List */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {filteredGuides.map((guide, index) => (
          <div
            key={guide.id}
            className="overflow-hidden rounded-2xl bg-card shadow-md transition-all hover:shadow-lg animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                  <Truck className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{guide.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(guide.date, 'dd MMM yyyy', { locale: es })}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold',
                  guide.status === 'pending'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success'
                )}
              >
                {guide.status === 'pending' ? 'Pendiente' : 'Entregada'}
              </span>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium text-foreground">{guide.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm text-foreground">{guide.address}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Productos</p>
                  <p className="text-sm text-foreground">
                    {guide.items.map((item) => `${item.quantity}x ${item.product.name}`).join(', ')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-2">
                <Button variant="outline" className="flex-1 gap-2">
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
                {guide.status === 'pending' && (
                  <Button variant="success" className="flex-1 gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Marcar Entregada
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGuides.length === 0 && (
        <div className="mt-12 text-center">
          <Truck className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No hay guías de remisión
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Crea una nueva guía para comenzar
          </p>
        </div>
      )}
    </MainLayout>
  );
}
