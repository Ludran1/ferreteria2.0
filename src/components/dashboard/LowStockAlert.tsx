import { mockProducts } from '@/data/mockData';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function LowStockAlert() {
  const lowStockProducts = mockProducts.filter((p) => p.stock < 30);

  if (lowStockProducts.length === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-warning/20 bg-warning/5 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Stock Bajo</h3>
          <p className="text-sm text-muted-foreground">
            {lowStockProducts.length} productos necesitan reabastecimiento
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {lowStockProducts.slice(0, 3).map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between rounded-lg bg-card p-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.sku}</p>
            </div>
            <span className="rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning">
              {product.stock} unidades
            </span>
          </div>
        ))}
      </div>

      <Link to="/productos" className="mt-4 block">
        <Button variant="outline" className="w-full">
          Ver todos los productos
        </Button>
      </Link>
    </div>
  );
}
