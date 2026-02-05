import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSales } from '@/hooks/useTransactions';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { subDays, startOfMonth, subMonths, endOfMonth, isWithinInterval, format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export function SalesChart() {
  const { sales } = useSales();
  const [range, setRange] = useState<'7days' | 'thisMonth' | 'lastMonth'>('7days');

  const chartData = useMemo(() => {
    if (!sales) return [];

    const now = new Date();
    let start: Date;
    let end: Date = now;
    let dateFormat = 'dd MMM';

    if (range === '7days') {
      start = subDays(startOfDay(now), 7);
    } else if (range === 'thisMonth') {
      start = startOfMonth(now);
    } else { // lastMonth
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
    }

    // Filter sales within range
    const filteredSales = sales.filter(s => 
      isWithinInterval(new Date(s.date), { start, end })
    );

    // Group by Date
    const groupedData = new Map<string, number>();

    // Initialize all days in range with 0 (optional but looks better)
    // For simplicity, we'll just group existing sales and sort.
    // To make it look "full", we'd loop from start to end. 
    
    // Let's just group actual data first
    filteredSales.forEach(sale => {
        const dateKey = format(new Date(sale.date), 'yyyy-MM-dd');
        const current = groupedData.get(dateKey) || 0;
        groupedData.set(dateKey, current + sale.total);
    });

    // Convert to Array and Sort
    return Array.from(groupedData.entries())
        .map(([date, total]) => ({
            dateStr: date,
            displayDate: format(new Date(date + 'T00:00:00'), dateFormat, { locale: es }),
            total: total
        }))
        .sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  }, [sales, range]);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-normal">Resumen de Ventas</CardTitle>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <Button 
                variant={range === '7days' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => setRange('7days')}
            >
                7 días
            </Button>
            <Button 
                variant={range === 'thisMonth' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => setRange('thisMonth')}
            >
                Este Mes
            </Button>
            <Button 
                variant={range === 'lastMonth' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => setRange('lastMonth')}
            >
                Mes Pasado
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/> {/* Primary Orange */}
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis 
                dataKey="displayDate" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `S/ ${value}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`S/ ${value.toFixed(2)}`, 'Ventas']}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#f97316" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
