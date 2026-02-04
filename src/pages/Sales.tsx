import { useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockSales, mockQuotes } from '@/data/mockData';
import { format, subMonths, isSameMonth, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Eye, CreditCard, Banknote, Building2, FileText, Printer, Copy, Camera } from 'lucide-react';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';
import { Sale, PrintableDocumentData } from '@/types';
import { usePrint } from '@/hooks/usePrint';
import { PrintableDocument } from '@/components/print/PrintableDocument';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  transfer: Building2,
};

const paymentLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

import { useNavigate } from 'react-router-dom';

// ... (existing imports)

export default function Sales() {
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<string | null>(null);
  const [saleToPrint, setSaleToPrint] = useState<Sale | null>(null);
  const [viewSale, setViewSale] = useState<Sale | null>(null); // State for modal view
  
  // History States
  const [historyFilter, setHistoryFilter] = useState<'all' | 'quote' | 'sale'>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));

  const { printRef, handlePrint } = usePrint();
  const { toast } = useToast();

  const allTransactions = [
    ...mockSales.map(s => ({ ...s, type: 'sale' as const })),
    ...mockQuotes.map(q => ({ ...q, type: 'quote' as const, paymentMethod: 'pending' as const })) // Pending payment for quotes
  ];

  const filteredTransactions = allTransactions
    .filter(item => isSameMonth(item.date, selectedMonth))
    .filter(item => historyFilter === 'all' || item.type === historyFilter)
    .filter((item) =>
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  // Calculate Total Sales (Only 'sale' type counts towards money in)
  const totalSalesMonth = mockSales
    .filter(s => isSameMonth(s.date, selectedMonth))
    .reduce((sum, sale) => sum + sale.total, 0);

  const handlePrintSale = (sale: Sale) => {
    setSaleToPrint(sale);
    setTimeout(() => {
      handlePrint();
      setSaleToPrint(null);
    }, 100);
  };

  const handleCopySale = (sale: any) => {
    // Save to localStorage to load in Quoter/POS
    const draftData = {
      customerName: sale.customerName,
      // items need to be mapped if structure matches, usually QuoteItem = { product, quantity, customPrice? }
      // Assuming sale.items structure is compatible or we map it:
      items: sale.items.map((item: any) => ({
        product: item.product,
        quantity: item.quantity,
        customPrice: item.customPrice || item.price // specific to how you store price in sale items
      })),
      type: sale.type // 'sale' or 'quote' to switch mode automatically
    };

    localStorage.setItem('posDraft', JSON.stringify(draftData));
    navigate('/cotizaciones');

    toast({
      title: "Cargando en POS",
      description: "Redirigiendo para editar...",
    });
  };

  const handleCaptureImage = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, 
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
            toast({
                title: "Error",
                description: "No se pudo generar la imagen",
                variant: "destructive"
            });
            return;
        }
        
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            toast({
                title: "Imagen copiada",
                description: "El recibo se ha copiado al portapapeles",
            });
        } catch (err) {
            console.error("Clipboard write failed:", err);
            // Fallback to download if clipboard fails
             const image = canvas.toDataURL('image/png');
             const link = document.createElement('a');
             link.href = image;
             link.download = `recibo-${viewSale?.id || 'venta'}.png`;
             link.click();
             
             toast({
                title: "Imagen descargada",
                description: "No se pudo copiar al portapapeles, se descargó la imagen.",
            });
        }
      }, 'image/png');

    } catch (error) {
      console.error("Error capturing image:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen",
        variant: "destructive"
      });
    }
  };

  const getSalePrintData = (sale: Sale): PrintableDocumentData => ({
    type: 'sale',
    documentNumber: sale.id,
    date: sale.date,
    customerName: sale.customerName,
    items: sale.items,
    subtotal: sale.total,
    tax: 0,
    total: sale.total,
    paymentMethod: sale.paymentMethod,
  });

  return (
    <MainLayout title="Historial de Ventas" subtitle="Consulta todas las transacciones">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-card p-5 shadow-md">
          <p className="text-sm text-muted-foreground">Total Ventas ({format(selectedMonth, 'MMMM', { locale: es })})</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            S/ {totalSalesMonth.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-md">
          <p className="text-sm text-muted-foreground">Movimientos Listados</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{filteredTransactions.length}</p>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-md">
          <p className="text-sm text-muted-foreground">Ticket Promedio (Ventas)</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            S/ {(totalSalesMonth / (mockSales.filter(s => isSameMonth(s.date, selectedMonth)).length || 1)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
                <Select
                  value={selectedMonth.toISOString()}
                  onValueChange={(val) => setSelectedMonth(new Date(val))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const date = startOfMonth(subMonths(new Date(), i));
                      return (
                        <SelectItem key={i} value={date.toISOString()}>
                          {format(date, 'MMMM yyyy', { locale: es })}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <div className="flex bg-secondary p-1 rounded-lg">
                    <button
                      onClick={() => setHistoryFilter('all')}
                      className={cn("px-3 py-1 rounded-md text-sm font-medium transition-all", historyFilter === 'all' ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                    >Todos</button>
                    <button
                      onClick={() => setHistoryFilter('sale')}
                      className={cn("px-3 py-1 rounded-md text-sm font-medium transition-all", historyFilter === 'sale' ? "bg-white shadow-sm text-green-600" : "text-muted-foreground hover:text-foreground")}
                    >Ventas</button>
                    <button
                      onClick={() => setHistoryFilter('quote')}
                      className={cn("px-3 py-1 rounded-md text-sm font-medium transition-all", historyFilter === 'quote' ? "bg-white shadow-sm text-blue-600" : "text-muted-foreground hover:text-foreground")}
                    >Cotizaciones</button>
                </div>
            </div>
            
            <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
            </div>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-card shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Tipo / Doc
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Fecha
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Método de Pago
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                  Total
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((item, index) => {
                // @ts-ignore - Simple check for payment method existence or default
                const PaymentIcon = item.paymentMethod && item.paymentMethod !== 'pending' ? paymentIcons[item.paymentMethod] : null;
                
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'border-b border-border/50 transition-colors hover:bg-secondary/20',
                      selectedSale === item.id && 'bg-primary/5'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                          item.type === 'quote' ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                        )}>
                            {item.type === 'quote' ? 'COT' : 'VTA'}
                        </span>
                        <span className="font-medium text-foreground">{item.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-foreground">{item.customerName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">
                        {format(item.date, 'dd MMM yyyy, HH:mm', { locale: es })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.type === 'sale' ? (
                            <>
                                {PaymentIcon && <PaymentIcon className="h-4 w-4 text-muted-foreground" />}
                                <span className="text-foreground capitalize">{paymentLabels[item.paymentMethod as keyof typeof paymentLabels]}</span>
                            </>
                        ) : (
                            <span className={cn(
                                'text-xs font-medium px-2 py-0.5 rounded-full',
                                (item as any).status === 'pending' && 'bg-warning/10 text-warning',
                                (item as any).status === 'approved' && 'bg-success/10 text-success',
                                (item as any).status === 'rejected' && 'bg-destructive/10 text-destructive'
                            )}>
                                {(item as any).status === 'pending' ? 'Pendiente' : 
                                 (item as any).status === 'approved' ? 'Aprobada' : 'Rechazada'}
                            </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-foreground">
                        S/ {item.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleCopySale(item)}
                          title="Editar en POS"
                        >
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setViewSale(item as any)}
                          title="Ver recibo"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handlePrintSale(item as any)} // Cast generic item
                          title="Imprimir"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="mt-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No se encontraron movimientos
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Intenta ajustar los filtros de búsqueda
          </p>
        </div>
      )}

      {/* View Receipt Modal */}
      <Dialog open={!!viewSale} onOpenChange={(open) => !open && setViewSale(null)}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Detalle de {viewSale?.type === 'quote' ? 'Cotización' : 'Venta'}</DialogTitle>
            </DialogHeader>
            {viewSale && (
                <div className="space-y-4">
                    <div ref={receiptRef} className="space-y-4 p-2 bg-white rounded-lg">
                        <div className="flex justify-between border-b pb-2">
                            <div>
                                <p className="font-bold text-lg">{viewSale.id}</p>
                                <p className="text-sm text-muted-foreground">{format(viewSale.date, 'dd MMM yyyy, HH:mm', { locale: es })}</p>
                            </div>
                            <div className="text-right">
                            {viewSale.type === 'quote' ? (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">Cotización</span>
                            ) : (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">Venta</span>
                            )}
                            </div>
                        </div>
                        
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                            <p className="text-base">{viewSale.customerName}</p>
                        </div>

                        <div className="border rounded-lg p-3 bg-secondary/20 max-h-[300px] overflow-y-auto">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Productos</p>
                            <ul className="space-y-2 text-sm">
                                {viewSale.items.map((item, i) => (
                                    <li key={i} className="flex justify-between">
                                        <span>{item.quantity}x {item.product.name}</span>
                                        <span className="font-medium">S/ {(item.quantity * (item.customPrice ?? item.product.price)).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                            <p className="font-bold text-lg">Total</p>
                            <p className="font-bold text-xl text-primary">S/ {viewSale.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button className="w-full gap-2" onClick={() => handlePrintSale(viewSale)}>
                            <Printer className="h-4 w-4" /> Imprimir
                        </Button>
                        <Button variant="outline" className="w-full gap-2" onClick={handleCaptureImage}>
                            <Camera className="h-4 w-4" /> Capturar
                        </Button>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>

      {/* Hidden Print Component */}
      {saleToPrint && (
        <div className="fixed left-[-9999px] top-0">
          <PrintableDocument ref={printRef} data={getSalePrintData(saleToPrint)} />
        </div>
      )}
    </MainLayout>
  );
}
