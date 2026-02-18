import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, subMonths, isSameMonth, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Eye, CreditCard, Banknote, Building2, FileText, Printer, Copy, Camera, Pencil, Ban, Trash, Check, RefreshCw } from 'lucide-react';
import { consultarComprobante } from "@/lib/apiSunat";
import { anularComprobante } from '@/lib/apiSunat';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';
import { Sale, PrintableDocumentData, Quote } from '@/types';
import { usePrint } from '@/hooks/usePrint';
import { ThermalReceipt, ThermalReceiptData } from '@/components/print/ThermalReceipt';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';

// Hooks
import { useQuotes, useSales } from '@/hooks/useTransactions';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  transfer: Building2,
  yape: Banknote,
  plin: Banknote,
};

const paymentLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  yape: 'Yape',
  plin: 'Plin',
};

export default function Sales() {
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<string | null>(null);
  const [saleToPrint, setSaleToPrint] = useState<Sale | null>(null);
  const [viewSale, setViewSale] = useState<Sale | Quote | null>(null);
  
  // History States
  const [historyFilter, setHistoryFilter] = useState<'all' | 'quote' | 'sale'>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));

  const { printRef, handlePrint } = usePrint();
  const { toast } = useToast();
  const { settings } = useBusinessSettings();

  // Data Fetching
  const { quotes, isLoading: loadingQuotes } = useQuotes();
  const { sales, isLoading: loadingSales, updateSaleStatus } = useSales();

  // Void states
  const [saleToVoid, setSaleToVoid] = useState<Sale | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);

  const handleVoidSale = async () => {
    if (!saleToVoid || !saleToVoid.documentSerie || !saleToVoid.documentNumber) return;
    
    // Check 3-day window
    const daysSinceEmission = Math.floor((Date.now() - new Date(saleToVoid.date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceEmission > 3) {
      toast({
        title: 'Fuera de plazo',
        description: 'Solo se pueden anular comprobantes emitidos hace máximo 3 días. Usa una Nota de Crédito.',
        variant: 'destructive',
      });
      setSaleToVoid(null);
      return;
    }

    setIsVoiding(true);
    try {
      const result = await anularComprobante({
        documento: saleToVoid.documentType as 'boleta' | 'factura',
        serie: saleToVoid.documentSerie,
        numero: saleToVoid.documentNumber!,
      });

      // Check for success OR if already voided/processing (to sync status)
      const msg = result.message?.toLowerCase() || '';
      const isSuccess = result.success || 
        msg.includes('ya se encuentra anulado') || 
        msg.includes('previamente') ||
        msg.includes('comunicacion de baja') ||
        msg.includes('comunicado para su baja') ||
        msg.includes('ya fue comunicado');

      if (isSuccess) {
        await updateSaleStatus.mutateAsync({ saleId: saleToVoid.id, status: 'ANULADO' });
        
        if (!result.success) {
           toast({
             title: '⚠️ Sincronizado',
             description: `El documento ya figuraba como anulado en SUNAT. Se actualizó el estado local.`,
           });
        } else {
           toast({
             title: '✅ Comprobante Anulado',
             description: `${saleToVoid.documentSerie}-${saleToVoid.documentNumber} fue anulado correctamente`,
           });
        }
      } else {
        toast({
          title: 'Error al anular',
          description: result.message || 'No se pudo anular',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsVoiding(false);
      setSaleToVoid(null);
    }
  };

  const handleVerifyStatus = async (item: Sale) => {
    if (!item.documentSerie || !item.documentNumber || !item.documentType) return;
    
    try {
      toast({ title: 'Consultando SUNAT...', description: 'Verificando estado del comprobante' });
      
      const response = await consultarComprobante(
        item.documentType,
        item.documentSerie,
        item.documentNumber!
      );

      if (response.success) {
        await updateSaleStatus.mutateAsync({ 
          saleId: item.id, 
          status: response.payload?.estado || 'ACEPTADO'
        });
        toast({
          title: '✅ Estado actualizado',
          description: `Comprobante ${item.documentSerie}-${item.documentNumber}: ${response.payload?.estado || 'ACEPTADO'}`,
        });
      } else {
        toast({
          title: 'No encontrado',
          description: response.message || 'El comprobante no fue encontrado en SUNAT',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error de conexión';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const allTransactions = [
    ...(sales || []).map(s => ({ ...s, type: 'sale' as const })),
    ...(quotes || []).map(q => ({ ...q, type: 'quote' as const, paymentMethod: 'pending' as const }))
  ];

  const filteredTransactions = allTransactions
    .filter(item => isSameMonth(new Date(item.date), selectedMonth))
    .filter(item => historyFilter === 'all' || item.type === historyFilter)
    .filter((item) =>
      (item.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.id || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayedTransactions = filteredTransactions.slice(0, visibleCount);

  // Calculate Total Sales (Only 'sale' type counts towards money in)
  const totalSalesMonth = (sales || [])
    .filter(s => isSameMonth(new Date(s.date), selectedMonth))
    .reduce((sum, sale) => sum + sale.total, 0);

  /* New Print Handlers using Portal */
  const handlePrintSale = (sale: Sale) => {
    setSaleToPrint(sale);
  };

  useEffect(() => {
    if (saleToPrint) {
      // 1. Create a style element to hide everything except the portal
      const style = document.createElement('style');
      style.id = 'print-portal-style';
      style.textContent = `
        @media print {
          html, body {
            height: auto !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body > *:not(.print-portal) { display: none !important; }
          .print-portal { 
            display: block !important; 
            position: static !important; 
            width: 80mm; 
            margin: 0;
            padding: 0;
            background: white;
            overflow: visible !important;
            page-break-after: auto;
            page-break-inside: avoid;
          }
          @page { margin: 0; size: 80mm auto; }
        }
      `;
      document.head.appendChild(style);

      // 2. Wait for render (portal to be inserted)
      const printTimer = setTimeout(() => {
        window.print();
        
        // 3. Cleanup after print dialog
        // We use a small delay because window.print() is blocking in most browsers,
        // but on some, logic might resume immediately.
        // The user effectively closes the dialog to resume.
        const cleanupTimer = setTimeout(() => {
          document.getElementById('print-portal-style')?.remove();
          setSaleToPrint(null);
        }, 500);
        
        return () => clearTimeout(cleanupTimer);
      }, 100);

      return () => {
        clearTimeout(printTimer);
        document.getElementById('print-portal-style')?.remove();
      };
    }
  }, [saleToPrint]);

  const handleCopySale = (item: any) => {
    // Save to localStorage to load in Quoter/POS
    const draftData = {
      customerName: item.customerName,
      items: item.items.map((i: any) => ({
        product: i.product,
        quantity: i.quantity,
        customPrice: i.customPrice ?? i.unit_price ?? i.product.price // Handle different potential field names
      })),
      type: item.type // 'sale' or 'quote'
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
        onclone: (clonedDoc) => {
            const container = clonedDoc.getElementById('receipt-items-container');
            if (container) {
                container.style.maxHeight = 'none';
                container.style.overflow = 'visible';
            }
        } 
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

  // Helper for thermal receipt data
  const getThermalReceiptData = (sale: Sale): ThermalReceiptData => {
    const subtotal = sale.total / 1.18;
    const igv = sale.total - subtotal;
    
    return {
      title: sale.documentType === 'factura' ? 'FACTURA DE VENTA ELECTRONICA' : 'BOLETA DE VENTA ELECTRONICA',
      serie: sale.documentSerie || 'B002',
      number: (sale.documentNumber || 0).toString().padStart(6, '0'),
      customerName: sale.customerName,
      customerDocument: sale.customerDocument || '-',
      date: new Date(sale.date),
      items: sale.items.map(item => {
        const price = item.price_at_sale ?? item.customPrice ?? item.product.price;
        return {
          name: item.product.name,
          quantity: item.quantity,
          price: price,
          total: price * item.quantity
        };
      }),
      subtotal: subtotal,
      igv: igv,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      sunatHash: sale.sunatHash,
      isElectronic: true
    };
  };

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
             S/ {(totalSalesMonth / (sales?.filter(s => isSameMonth(new Date(s.date), selectedMonth)).length || 1)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
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
                  Estado
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedTransactions.map((item, index) => {
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
                          item.type === 'quote' ? "bg-blue-100 text-blue-700" 
                            : (item as Sale).documentType === 'boleta' ? "bg-orange-100 text-orange-700"
                            : (item as Sale).documentType === 'factura' ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                        )}>
                            {item.type === 'quote' ? 'COT' 
                              : (item as Sale).documentType === 'boleta' ? 'BOL'
                              : (item as Sale).documentType === 'factura' ? 'FAC'
                              : 'VTA'}
                        </span>
                        <span className="font-medium text-foreground">
                            {item.type === 'sale' 
                                ? ((item as Sale).documentSerie 
                                    ? `${(item as Sale).documentSerie}-${(item as Sale).documentNumber}`
                                    : (item.invoiceNumber || item.id.slice(0,8)))
                                : ((item as any).quoteNumber || item.id.slice(0,8))}
                        </span>
                        {item.type === 'sale' && (item as Sale).sunatEstado === 'ANULADO' && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700">ANULADO</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-foreground">{item.customerName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">
                        {format(new Date(item.date), 'dd MMM yyyy, HH:mm', { locale: es })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.type === 'sale' ? (
                            <>
                                {PaymentIcon && <PaymentIcon className="h-4 w-4 text-muted-foreground" />}
                                <span className="text-foreground capitalize">{paymentLabels[item.paymentMethod as keyof typeof paymentLabels] || item.paymentMethod}</span>
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
                    <td className="px-6 py-4 text-center">
                      {item.type === 'sale' && (item as Sale).documentSerie ? (
                        <span className={cn(
                          'text-[10px] font-bold uppercase px-2 py-1 rounded-full',
                          (item as Sale).sunatEstado === 'ACEPTADO' && 'bg-emerald-100 text-emerald-700',
                          (item as Sale).sunatEstado === 'ANULADO' && 'bg-red-100 text-red-700',
                          (item as Sale).sunatEstado === 'PENDIENTE' && 'bg-yellow-100 text-yellow-700',
                          (item as Sale).sunatEstado === 'RECHAZADO' && 'bg-red-100 text-red-700',
                          (item as Sale).sunatEstado === 'EXCEPCION' && 'bg-orange-100 text-orange-700',
                          !(item as Sale).sunatEstado && 'bg-gray-100 text-gray-500'
                        )}>
                          {(item as Sale).sunatEstado || 'SIN ESTADO'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
                          <Pencil className="h-4 w-4 text-muted-foreground" />
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
                        {item.type === 'sale' && (item as Sale).documentSerie && (item as Sale).sunatEstado !== 'ANULADO' && (() => {
                          const daysSince = Math.floor((Date.now() - new Date(item.date).getTime()) / (1000 * 60 * 60 * 24));
                          return daysSince <= 3;
                        })() && (
                          <Button
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setSaleToVoid(item as Sale)}
                            title="Anular comprobante"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Verify Button for Error/Pending/Offline items */}
                        {item.type === 'sale' && (item as Sale).documentSerie && (
                          ['ERROR', 'PENDIENTE', 'EXCEPCION'].includes((item as Sale).sunatEstado || '') || 
                          !(item as Sale).sunatEstado
                        ) && (
                          <Button
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleVerifyStatus(item as Sale)}
                            title="Verificar en SUNAT"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTransactions.length > visibleCount && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={() => setVisibleCount(prev => prev + 15)}
                className="w-full max-w-xs"
              >
                Ver más ({filteredTransactions.length - visibleCount} restantes)
              </Button>
            </div>
          )}
          {filteredTransactions.length === 0 && !loadingQuotes && !loadingSales && (
            <div className="mt-12 text-center pb-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium text-foreground">
                No se encontraron movimientos
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          )}
          {(loadingQuotes || loadingSales) && (
              <div className="p-8 text-center text-muted-foreground">Cargando historial...</div>
          )}
        </div>
      </div>

      {/* View Receipt Modal */}
      <Dialog open={!!viewSale} onOpenChange={(open) => !open && setViewSale(null)}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Detalle de {(viewSale as any)?.type === 'quote' ? 'Cotización' : 'Venta'}</DialogTitle>
            </DialogHeader>
            {viewSale && (
                <div className="space-y-4">
                    <div ref={receiptRef} className="space-y-4 p-2 bg-white rounded-lg">
                        <div className="flex justify-between border-b pb-2">
                            <div>
                                <p className="font-bold text-lg text-black">
                                    {(viewSale as any).type === 'sale' 
                                        ? ((viewSale as Sale).documentType === 'boleta' ? 'BOLETA' : (viewSale as Sale).documentType === 'factura' ? 'FACTURA' : 'VENTA') + ' ' + ((viewSale as Sale).documentSerie ? `${(viewSale as Sale).documentSerie}-${(viewSale as Sale).documentNumber}` : (viewSale as Sale).invoiceNumber || viewSale.id.slice(0,8))
                                        : ((viewSale as any).quoteNumber || viewSale.id.slice(0,8))
                                    }
                                </p>
                                <p className="text-sm text-muted-foreground">{format(new Date(viewSale.date), 'dd MMM yyyy, HH:mm', { locale: es })}</p>
                            </div>
                            <div className="text-right">
                            {(viewSale as any).type === 'quote' ? (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">Cotización</span>
                            ) : (
                                <span className={cn(
                                    "px-2 py-1 rounded text-xs font-bold uppercase",
                                    (viewSale as Sale).documentType === 'boleta' ? "bg-orange-100 text-orange-700"
                                    : (viewSale as Sale).documentType === 'factura' ? "bg-purple-100 text-purple-700"
                                    : "bg-green-100 text-green-700"
                                )}>
                                    {(viewSale as Sale).documentType === 'boleta' ? 'Boleta'
                                    : (viewSale as Sale).documentType === 'factura' ? 'Factura'
                                    : 'Venta'}
                                </span>
                            )}
                            </div>
                        </div>
                        
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                            <p className="text-base text-black">{viewSale.customerName}</p>
                        </div>

                        <div id="receipt-items-container" className="border rounded-lg p-3 bg-secondary/20 max-h-[300px] overflow-y-auto">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Productos</p>
                            <ul className="space-y-2 text-sm">
                                {viewSale.items.map((item, i) => {
                                    const unitPrice = (item as any).customPrice ?? (item as any).unit_price ?? item.product.price;
                                    return (
                                        <li key={i} className="flex justify-between text-black">
                                            <div>
                                                <span>{item.quantity}x {item.product.name}</span>
                                                <span className="text-muted-foreground ml-2">(S/ {unitPrice.toFixed(2)} c/u)</span>
                                            </div>
                                            <span className="font-medium">S/ {(item.quantity * unitPrice).toFixed(2)}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t text-black">
                            <p className="font-bold text-lg">Total</p>
                            <p className="font-bold text-xl text-primary">S/ {viewSale.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button className="w-full gap-2" onClick={() => handlePrintSale(viewSale as Sale)}>
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

      {/* Void Confirmation Dialog */}
      <Dialog open={!!saleToVoid} onOpenChange={(open) => !open && setSaleToVoid(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" /> Anular Comprobante
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas anular el comprobante{' '}
              <strong>{saleToVoid?.documentSerie}-{saleToVoid?.documentNumber}</strong>?
              Esta acción enviará una comunicación de baja a SUNAT y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSaleToVoid(null)} disabled={isVoiding}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleVoidSale} disabled={isVoiding}>
              {isVoiding ? 'Anulando...' : 'Sí, Anular'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden Print Component */}
      {/* Portal Print Component */}
      {saleToPrint && createPortal(
        <div className="print-portal">
          <ThermalReceipt data={getThermalReceiptData(saleToPrint)} />
        </div>,
        document.body
      )}
    </MainLayout>
  );
}
