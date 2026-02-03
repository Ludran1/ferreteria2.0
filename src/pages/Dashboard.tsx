import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { DollarSign, ShoppingCart, Package, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  return (
    <MainLayout title="Dashboard" subtitle="Bienvenido a FerrePOS">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ventas del Día"
          value="$10,060.00"
          change="+12.5% vs ayer"
          changeType="positive"
          icon={DollarSign}
          iconColor="primary"
        />
        <StatCard
          title="Transacciones"
          value="24"
          change="+3 vs ayer"
          changeType="positive"
          icon={ShoppingCart}
          iconColor="success"
        />
        <StatCard
          title="Productos Vendidos"
          value="156"
          change="Unidades totales"
          changeType="neutral"
          icon={Package}
          iconColor="warning"
        />
        <StatCard
          title="Ticket Promedio"
          value="$419.17"
          change="+5.2% vs semana"
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
          <LowStockAlert />
        </div>
      </div>
    </MainLayout>
  );
}
