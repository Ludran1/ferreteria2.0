import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DollarSign, ShoppingCart, Package, TrendingUp } from 'lucide-react';
import { useSales } from '@/hooks/useTransactions';
import { isToday, startOfDay, subDays, isAfter } from 'date-fns';

export default function Dashboard() {
  const { sales, isLoading } = useSales();

  // Calculations
  const todaySales = (sales || []).filter(s => isToday(new Date(s.date)));
  const totalSalesToday = todaySales.reduce((acc, s) => acc + s.total, 0);
  const transactionCountToday = todaySales.length;

  const productsSoldToday = todaySales.reduce((acc, s) => 
    acc + s.items.reduce((sum, item) => sum + item.quantity, 0), 0
  );

  // Ticket average (weekly)
  const weekStart = subDays(new Date(), 7);
  const weeklySales = (sales || []).filter(s => isAfter(new Date(s.date), weekStart));
  const weeklyTotal = weeklySales.reduce((acc, s) => acc + s.total, 0);
  const averageTicket = weeklySales.length > 0 ? weeklyTotal / weeklySales.length : 0;

  // Comparison (mock for now or calculated vs yesterday)
  const yesterdayStart = subDays(startOfDay(new Date()), 1);
  const yesterdaySales = (sales || []).filter(s => {
      const d = new Date(s.date);
      return d >= yesterdayStart && d < startOfDay(new Date());
  });
  const totalSalesYesterday = yesterdaySales.reduce((acc, s) => acc + s.total, 0);
  
  // % Change calculation
  const salesChange = totalSalesYesterday > 0 
    ? ((totalSalesToday - totalSalesYesterday) / totalSalesYesterday) * 100 
    : 0;

  return (
    <MainLayout title="Dashboard" subtitle="Bienvenido a FerrePOS">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ventas del Día"
          value={`S/ ${totalSalesToday.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
          change={`${salesChange.toFixed(1)}% vs ayer`}
          changeType={salesChange >= 0 ? "positive" : "negative"}
          icon={DollarSign}
          iconColor="primary"
        />
        <StatCard
          title="Transacciones"
          value={transactionCountToday.toString()}
          change="Hoy"
          changeType="neutral"
          icon={ShoppingCart}
          iconColor="success"
        />
        <StatCard
          title="Productos Vendidos"
          value={productsSoldToday.toString()}
          change="Unidades hoy"
          changeType="neutral"
          icon={Package}
          iconColor="warning"
        />
        <StatCard
          title="Ticket Promedio"
          value={`S/ ${averageTicket.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
          change="Últimos 7 días"
          changeType="positive"
          icon={TrendingUp}
          iconColor="accent"
        />
      </div>

      {/* Main Content Grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent Sales - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentSales />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <QuickActions />
        </div>
      </div>
    </MainLayout>
  );
}
