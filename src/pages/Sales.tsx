import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockSales } from '@/data/mockData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Download, Eye, CreditCard, Banknote, Building2, FileText, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sale, PrintableDocumentData } from '@/types';
import { usePrint } from '@/hooks/usePrint';
import { PrintableDocument } from '@/components/print/PrintableDocument';

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

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<string | null>(null);
  const [saleToPrint, setSaleToPrint] = useState<Sale | null>(null);
  const { printRef, handlePrint } = usePrint();

  const filteredSales = mockSales.filter(
    (sale) =>
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

  const handlePrintSale = (sale: Sale) => {
    setSaleToPrint(sale);
    setTimeout(() => {
      handlePrint();
      setSaleToPrint(null);
    }, 100);
  };

  const getSalePrintData = (sale: Sale): PrintableDocumentData => ({
    type: 'sale',
    documentNumber: sale.id,
    date: sale.date,
    customerName: sale.customerName,
    items: sale.items,
    subtotal: sale.total / 1.16,
    tax: sale.total - (sale.total / 1.16),
    total: sale.total,
    paymentMethod: sale.paymentMethod,
  });

  return (
    <MainLayout title="Historial de Ventas" subtitle="Consulta todas las transacciones">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-card p-5 shadow-md">
          <p className="text-sm text-muted-foreground">Total de Ventas</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            ${totalSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-md">
          <p className="text-sm text-muted-foreground">Transacciones</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{filteredSales.length}</p>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-md">
          <p className="text-sm text-muted-foreground">Ticket Promedio</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            ${(totalSales / filteredSales.length || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o número de venta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Sales Table */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-card shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  # Venta
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
              {filteredSales.map((sale, index) => {
                const PaymentIcon = paymentIcons[sale.paymentMethod];
                return (
                  <tr
                    key={sale.id}
                    className={cn(
                      'border-b border-border/50 transition-colors hover:bg-secondary/20',
                      selectedSale === sale.id && 'bg-primary/5'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{sale.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-foreground">{sale.customerName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">
                        {format(sale.date, 'dd MMM yyyy, HH:mm', { locale: es })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {paymentLabels[sale.paymentMethod]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-foreground">
                        ${sale.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSale(sale.id)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handlePrintSale(sale)}
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

      {filteredSales.length === 0 && (
        <div className="mt-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No se encontraron ventas
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Intenta ajustar los filtros de búsqueda
          </p>
        </div>
      )}

      {/* Hidden Print Component */}
      {saleToPrint && (
        <div className="fixed left-[-9999px] top-0">
          <PrintableDocument ref={printRef} data={getSalePrintData(saleToPrint)} />
        </div>
      )}
    </MainLayout>
  );
}
