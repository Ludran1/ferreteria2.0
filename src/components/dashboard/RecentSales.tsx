import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreditCard, Banknote, Building2 } from 'lucide-react';
import { useSales } from '@/hooks/useTransactions';

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  transfer: Building2,
  yape: Banknote, // Add missing keys
  plin: Banknote,
};

const paymentLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  yape: 'Yape',
  plin: 'Plin',
};

export function RecentSales() {
  const { sales, isLoading } = useSales();

  // Sort by date descending
  const recentSales = (sales || [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="rounded-2xl bg-card p-6 shadow-md">
      <h3 className="text-lg font-semibold text-foreground">Ventas Recientes</h3>
      <p className="text-sm text-muted-foreground">Últimas transacciones del día</p>
      
      <div className="mt-6 space-y-4">
        {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : recentSales.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay ventas recientes</p>
        ) : (
            recentSales.map((sale, index) => {
            const PaymentIcon = paymentIcons[sale.paymentMethod as keyof typeof paymentIcons] || Banknote;
            return (
                <div
                key={sale.id}
                className="flex items-center justify-between rounded-xl bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
                style={{ animationDelay: `${index * 100}ms` }}
                >
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <PaymentIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                    <p className="font-medium text-foreground">{sale.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                        {format(new Date(sale.date), 'dd MMM, HH:mm', { locale: es })} • {paymentLabels[sale.paymentMethod as keyof typeof paymentLabels] || sale.paymentMethod}
                    </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-foreground">
                    S/ {sale.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">{sale.id.slice(0,8)}</p>
                </div>
                </div>
            );
            })
        )}
      </div>
    </div>
  );
}
