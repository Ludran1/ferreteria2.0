import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { mockSales } from '@/data/mockData';
import { Sale } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, FileText, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CreateRemissionModalProps {
  onGuideCreated: (sale: Sale) => void;
}

export function CreateRemissionModal({ onGuideCreated }: CreateRemissionModalProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter sales from last 24 hours (Logic implementation)
  // For demo purposes, we might show all if no recent ones exist in mockData
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const recentSales = mockSales.filter(sale => {
    // Uncomment this line to enforce 24h filter strictly
    // return sale.date >= twentyFourHoursAgo; 
    return true; // Showing all for prototype visibility
  });

  const filteredSales = recentSales.filter(sale => 
    sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectSale = (sale: Sale) => {
    onGuideCreated(sale);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileText className="h-4 w-4" />
          Nueva Guía
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Venta Reciente (24h)</DialogTitle>
        </DialogHeader>
        
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar venta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[300px] mt-4 rounded-md border p-2">
          <div className="space-y-2">
            {filteredSales.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No se encontraron ventas recientes
              </p>
            ) : (
              filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => handleSelectSale(sale)}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{sale.customerName}</span>
                    <span className="text-xs text-muted-foreground">
                      {sale.id} • {format(sale.date, "d MMM, HH:mm", { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">
                      S/ {sale.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
