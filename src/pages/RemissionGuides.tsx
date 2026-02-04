import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockSales } from '@/data/mockData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Search, Truck, MapPin, Package, Printer, CheckCircle2, Copy, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { usePrint } from '@/hooks/usePrint';
import { CreateRemissionModal } from '@/components/remission/CreateRemissionModal';
import { Sale } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Mock remission guides based on sales
const initialMockGuides = mockSales.slice(0, 2).map((sale, index) => ({
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
  const [guides, setGuides] = useState(initialMockGuides);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [viewGuide, setViewGuide] = useState<any | null>(null); // State for modal view
  
  const { toast } = useToast();
  const { print } = usePrint();

  const filteredGuides = guides.filter(
    (guide) =>
      guide.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaleSelected = (sale: Sale) => {
    setSelectedSale(sale);
    setShowAddressModal(true);
  };

  const confirmCreateGuide = () => {
    if (!newAddress || !selectedSale) {
      toast({
         title: 'Error',
         description: 'Ingresa la dirección de entrega',
         variant: 'destructive'
      });
      return;
    }

    const newGuide = {
      id: `GR-${Date.now().toString().slice(-6)}`,
      saleId: selectedSale.id,
      customerName: selectedSale.customerName,
      address: newAddress,
      items: selectedSale.items,
      date: new Date(),
      status: 'pending' as const,
    };

    setGuides([newGuide, ...guides]);
    
    toast({
      title: 'Guía creada',
      description: `Guía para ${selectedSale.customerName} generada exitosamente`,
    });

    setShowAddressModal(false);
    setNewAddress('');
    setSelectedSale(null);
  };

  const activePrint = (guide: any) => {
     print({
        type: 'remission',
        documentNumber: guide.id,
        date: guide.date,
        customerName: guide.customerName,
        address: guide.address,
        items: guide.items,
        subtotal: 0,
        tax: 0,
        total: 0,
    });
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
        <CreateRemissionModal onGuideCreated={handleSaleSelected} />
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
              <p className="text-xl font-bold text-foreground">{guides.length}</p>
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
                {guides.filter((g) => g.status === 'pending').length}
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
                {guides.filter((g) => g.status === 'delivered').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Address Confirmation Modal (Simple inline for now) */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Confirmar Entrega</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Para venta: {selectedSale?.id} - {selectedSale?.customerName}
            </p>
            
            <div className="mt-4 space-y-4">
              <Input
                placeholder="Dirección de entrega *"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowAddressModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={confirmCreateGuide}>
                  Generar Guía
                </Button>
              </div>
            </div>
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
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => setViewGuide(guide)}
                >
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

      {/* View Receipt Modal */}
       <Dialog open={!!viewGuide} onOpenChange={(open) => !open && setViewGuide(null)}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Detalle de Guía de Remisión</DialogTitle>
            </DialogHeader>
            {viewGuide && (
                <div className="space-y-4">
                    <div className="flex justify-between border-b pb-2">
                        <div>
                            <p className="font-bold text-lg">{viewGuide.id}</p>
                            <p className="text-sm text-muted-foreground">{format(viewGuide.date, 'dd MMM yyyy, HH:mm', { locale: es })}</p>
                        </div>
                        <div className="text-right">
                            <span className={cn(
                                'rounded-full px-3 py-1 text-xs font-semibold',
                                viewGuide.status === 'pending'
                                    ? 'bg-warning/10 text-warning'
                                    : 'bg-success/10 text-success'
                            )}>
                                {viewGuide.status === 'pending' ? 'Pendiente' : 'Entregada'}
                            </span>
                        </div>
                    </div>
                    
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                        <p className="text-base">{viewGuide.customerName}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Dirección de Entrega</p>
                        <p className="text-base flex items-start gap-1">
                             <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                             {viewGuide.address}
                        </p>
                    </div>

                    <div className="border rounded-lg p-3 bg-secondary/20 max-h-[300px] overflow-y-auto">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Productos a Entregar</p>
                        <ul className="space-y-2 text-sm">
                            {viewGuide.items.map((item: any, i: number) => (
                                <li key={i} className="flex justify-between">
                                    <span>{item.quantity}x {item.product.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button className="w-full gap-2" onClick={() => activePrint(viewGuide)}>
                            <Printer className="h-4 w-4" /> Imprimir Guía
                        </Button>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
}
