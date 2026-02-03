import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockProducts, mockQuotes } from '@/data/mockData';
import { Product, QuoteItem } from '@/types';
import { Plus, Search, Minus, Trash2, FileText, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Quotes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<QuoteItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const { toast } = useToast();

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleCreateQuote = () => {
    if (!customerName.trim()) {
      toast({
        title: 'Error',
        description: 'Ingresa el nombre del cliente',
        variant: 'destructive',
      });
      return;
    }
    if (cartItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Agrega productos a la cotización',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Cotización creada',
      description: `Cotización para ${customerName} por $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
    });

    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
  };

  return (
    <MainLayout title="Cotizaciones" subtitle="Crea y gestiona cotizaciones">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Products Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Products Grid */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="flex items-center gap-3 rounded-xl bg-card p-4 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.sku}</p>
                  <p className="font-bold text-primary">
                    ${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Recent Quotes */}
          <div className="rounded-2xl bg-card p-6 shadow-md">
            <h3 className="text-lg font-semibold text-foreground">Cotizaciones Recientes</h3>
            <div className="mt-4 space-y-3">
              {mockQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="flex items-center justify-between rounded-xl bg-secondary/30 p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{quote.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(quote.date, 'dd MMM yyyy', { locale: es })} • {quote.items.length} productos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      ${quote.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <span
                      className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                        quote.status === 'pending' && 'bg-warning/10 text-warning',
                        quote.status === 'approved' && 'bg-success/10 text-success',
                        quote.status === 'rejected' && 'bg-destructive/10 text-destructive'
                      )}
                    >
                      {quote.status === 'pending' && 'Pendiente'}
                      {quote.status === 'approved' && 'Aprobada'}
                      {quote.status === 'rejected' && 'Rechazada'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl bg-card p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Nueva Cotización</h3>
                <p className="text-sm text-muted-foreground">
                  {cartItems.length} productos
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mt-6 space-y-3">
              <Input
                placeholder="Nombre del cliente *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                placeholder="Teléfono (opcional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            {/* Cart Items */}
            <div className="mt-6 max-h-64 space-y-3 overflow-y-auto">
              {cartItems.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Agrega productos a la cotización
                </p>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${item.product.price.toLocaleString('es-MX')} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total */}
            <div className="mt-6 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">IVA (16%)</span>
                <span className="font-medium">
                  ${(total * 0.16).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">
                  ${(total * 1.16).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">
              <Button className="w-full" size="lg" onClick={handleCreateQuote}>
                Crear Cotización
              </Button>
              <Button variant="outline" className="w-full" size="lg">
                Convertir a Venta
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
