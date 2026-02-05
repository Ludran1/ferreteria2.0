import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { DollarSign, ShoppingCart, Package, TrendingUp, Calendar } from 'lucide-react';
import { useSales } from '@/hooks/useTransactions';
import { isToday, startOfDay, subDays, isAfter, isSameMonth, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { sales, isLoading } = useSales();
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  // Calculations
  const now = new Date();

  // 1. Current Period Sales
  const currentPeriodSales = (sales || []).filter(s => {
      const date = new Date(s.date);
      if (viewMode === 'day') return isToday(date);
      return isSameMonth(date, now);
  });

  const totalSales = currentPeriodSales.reduce((acc, s) => acc + s.total, 0);
  const transactionCount = currentPeriodSales.length;

  const productsSold = currentPeriodSales.reduce((acc, s) => 
    acc + s.items.reduce((sum, item) => sum + item.quantity, 0), 0
  );

  // 2. Ticket Average
  // For Day: Last 7 days to give a meaningful trend, or just today? usually standard is trend.
  // For Month: This Month average.
  const averageTicket = transactionCount > 0 ? totalSales / transactionCount : 0;

  // 3. Comparison Logic
  let previousPeriodSales: typeof sales = [];
  let comparisonLabel = "";

  if (viewMode === 'day') {
      const yesterdayStart = subDays(startOfDay(now), 1);
      const yesterdayEnd = startOfDay(now); // Up to start of today
      previousPeriodSales = (sales || []).filter(s => {
          const d = new Date(s.date);
          return d >= yesterdayStart && d < yesterdayEnd;
      });
      comparisonLabel = "vs ayer";
  } else {
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      previousPeriodSales = (sales || []).filter(s => {
          const d = new Date(s.date);
          return d >= lastMonthStart && d <= lastMonthEnd;
      });
      comparisonLabel = "vs mes anterior";
  }

  const totalSalesPrevious = previousPeriodSales.reduce((acc, s) => acc + s.total, 0);
  
  // % Change calculation
  const salesChange = totalSalesPrevious > 0 
    ? ((totalSales - totalSalesPrevious) / totalSalesPrevious) * 100 
    : 0;

  return (
    <MainLayout title="Dashboard" subtitle="Resumen de actividad">
      
      {/* Filter Toggle */}
      <div className="flex justify-end mb-6">
          <div className="flex p-1 bg-secondary rounded-lg">
             <Button
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('day')}
                className="text-xs"
              >
                  Diario
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className="text-xs"
              >
                  Mensual
              </Button>
          </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={viewMode === 'day' ? "Ventas del Día" : "Ventas del Mes"}
          value={`S/ ${totalSales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
          change={`${salesChange.toFixed(1)}% ${comparisonLabel}`}
          changeType={salesChange >= 0 ? "positive" : "negative"}
          icon={DollarSign}
          iconColor="primary"
        />
        <StatCard
          title="Transacciones"
          value={transactionCount.toString()}
          change={viewMode === 'day' ? "Hoy" : "Este Mes"}
          changeType="neutral"
          icon={ShoppingCart}
          iconColor="success"
        />
        <StatCard
          title="Productos Vendidos"
          value={productsSold.toString()}
          change="Unidades"
          changeType="neutral"
          icon={Package}
          iconColor="warning"
        />
        <StatCard
          title="Ticket Promedio"
          value={`S/ ${averageTicket.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
          change={viewMode === 'day' ? "Promedio hoy" : "Promedio mes"}
          changeType="neutral"
          icon={TrendingUp}
          iconColor="accent"
        />
      </div>

      {/* Main Content Grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Comparison Chart */}
        <div className="lg:col-span-2">
            <SalesChart />
        </div>
        
        {/* Right Column (Quick Actions) */}
         <div className="space-y-6">
          <QuickActions />
        </div>

        {/* Recent Sales - Takes full width below chart on desktop or 2 cols */}
        <div className="lg:col-span-3">
          <RecentSales />
        </div>
      </div>
    </MainLayout>
  );
}
