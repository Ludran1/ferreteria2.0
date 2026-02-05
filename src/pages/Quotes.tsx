import { useState, useCallback, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product, QuoteItem, PrintableDocumentData } from '@/types';
import { Plus, Search, Minus, Trash2, FileText, ShoppingCart, ScanBarcode, Edit2, Printer, History, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { usePrint } from '@/hooks/usePrint';
import { PrintableDocument } from '@/components/print/PrintableDocument';

// Hooks
import { useProducts } from '@/hooks/useProducts';
import { useQuotes, useSales } from '@/hooks/useTransactions';

export default function Quotes() {
  // Hooks Data
  const { products: availableProducts } = useProducts();
  const { createQuote } = useQuotes();
  const { createSale } = useSales();

  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<QuoteItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  // New States for "Sale vs Quote" and History
  const [transactionType, setTransactionType] = useState<'quote' | 'sale'>('quote');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'yape' | 'plin'>('cash');
  
  const { toast } = useToast();
  const { printRef, handlePrint } = usePrint();

  // Check for POS Draft on Mount
  useEffect(() => {
    const draft = localStorage.getItem('posDraft');
    if (draft) {
      try {
        const data = JSON.parse(draft);
        setCustomerName(data.customerName || '');
        setCartItems(data.items || []);
        if (data.type) setTransactionType(data.type);
        
        toast({
            title: "Datos Cargados",
            description: "Se han cargado los datos del historial para editar.",
        });
        
        localStorage.removeItem('posDraft');
      } catch (e) {
        console.error("Error loading draft", e);
      }
    }
  }, []);

  // Custom Item State
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  const handleAddCustomItem = () => {
    if (!customItemName || !customItemPrice) return;

    const price = parseFloat(customItemPrice);
    if (isNaN(price)) return;

    const manualProduct: Product = {
      id: `manual-${Date.now()}`,
      name: customItemName,
      price: price,
      description: 'Producto agregado manualmente',
      category: 'Manual',
      sku: 'MANUAL',
    };

    addToCart(manualProduct);
    setShowCustomItemModal(false);
    setCustomItemName('');
    setCustomItemPrice('');
    
    toast({
      title: 'Item agregado',
      description: `${customItemName} añadido a la cotización`,
    });
  };

  const handleBarcodeScan = useCallback((barcode: string) => {
    const product = availableProducts.find(
      (p) => p.barcode === barcode || 
             p.sku.toLowerCase() === barcode.toLowerCase() ||
             p.additionalBarcodes?.includes(barcode)
    );
    
    if (product) {
      addToCart(product);
      toast({
        title: 'Producto agregado',
        description: `${product.name} añadido al carrito`,
      });
    } else {
      toast({
        title: 'Producto no encontrado',
        description: `No se encontró producto con código: ${barcode}`,
        variant: 'destructive',
      });
    }
  }, [availableProducts, toast]); // Dependency avail products

  useBarcodeScanner({
    onScan: handleBarcodeScan,
    minLength: 4,
  });

  const filteredProducts = availableProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm) ||
      product.additionalBarcodes?.some(code => code.includes(searchTerm))
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

  const setItemQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const updateCustomPrice = (productId: string, newPrice: string) => {
    const priceValue = parseFloat(newPrice);
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, customPrice: isNaN(priceValue) ? undefined : priceValue }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const getItemPrice = (item: QuoteItem) => {
    return item.customPrice !== undefined ? item.customPrice : item.product.price;
  };

  const total = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0
  );

  const handleSaveAndPrint = async () => {
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

    const transactionData = {
        customerName,
        customerPhone,
        customerEmail: '',
        items: cartItems,
        date: new Date(),
        total: total,
    };

    try {
        if (transactionType === 'sale') {
           await createSale.mutateAsync({
               ...transactionData,
               paymentMethod,
               invoiceNumber: `FAC-${Date.now()}`,
           });
        } else {
           await createQuote.mutateAsync({
               ...transactionData,
               status: 'pending',
           });
        }

        // Show print preview
        setShowPrintPreview(true);
        setTimeout(() => {
            handlePrint();
            setShowPrintPreview(false);
            
            setCartItems([]);
            setCustomerName('');
            setCustomerPhone('');
        }, 100);

    } catch (error) {
        console.error(error);
        // Toast handled in mutation
    }
  };


  const getPrintData = (): PrintableDocumentData => ({
    type: transactionType,
    documentNumber: `DOC-${Date.now().toString().slice(-6)}`,
    date: new Date(),
    customerName,
    customerPhone: customerPhone || undefined,
    items: cartItems,
    subtotal: total,
    tax: 0,
    total: total,
    paymentMethod: transactionType === 'sale' ? paymentMethod : undefined,
  });

  return (
    <MainLayout title="Ventas y Cotizaciones" subtitle="Gestiona ventas, cotizaciones e historial">
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Products Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search with Barcode indicator */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar productos o escanear código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowCustomItemModal(true)}
              title="Agregar item manual"
            >
              <Plus className="h-4 w-4 mr-2" />
              Manual
            </Button>
            <Button
              variant={scannerActive ? 'default' : 'secondary'}
              size="icon"
              onClick={() => setScannerActive(!scannerActive)}
              title={scannerActive ? 'Escáner activo' : 'Escáner inactivo'}
            >
              <ScanBarcode className="h-5 w-5" />
            </Button>
          </div>

          <Dialog open={showCustomItemModal} onOpenChange={setShowCustomItemModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Item Manual</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Descripción / Producto</Label>
                  <Input
                    id="name"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="Ej. Servicio de Flete"
                    autoFocus
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Precio Unitario</Label>
                  <div className="relative">
                     <span className="absolute left-3 top-2.5 text-muted-foreground">S/</span>
                     <Input
                      id="price"
                      type="number"
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      className="pl-8"
                      placeholder="0.00"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCustomItem();
                      }}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCustomItemModal(false)}>Cancelar</Button>
                <Button onClick={handleAddCustomItem}>Agregar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {scannerActive && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-sm text-success">
              <ScanBarcode className="h-4 w-4" />
              <span>Lector de código de barras activo - Escanea un producto</span>
            </div>
          )}

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
                    S/ {product.price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl bg-card p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                     {/* Toggle Mode */}
                     <div className="flex bg-secondary p-1 rounded-lg">
                        <button
                          onClick={() => setTransactionType('sale')}
                          className={cn(
                            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                            transactionType === 'sale' 
                              ? "bg-white text-primary shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Venta
                        </button>
                        <button
                          onClick={() => setTransactionType('quote')}
                          className={cn(
                            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                            transactionType === 'quote' 
                              ? "bg-white text-primary shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Cotización
                        </button>
                     </div>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    {transactionType === 'sale' ? 'Nueva Venta' : 'Nueva Cotización'}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    ({cartItems.length} productos)
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mt-6 grid grid-cols-2 gap-3">
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
            <div className="mt-6 max-h-[500px] space-y-3 overflow-y-auto pr-2">
              {cartItems.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Agrega productos a la cotización
                </p>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="rounded-lg bg-secondary/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.product.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Price editing */}
                        <div className="flex items-center gap-2">
                          {editingPriceId === item.product.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">S/</span>
                              <Input
                                type="number"
                                step="0.01"
                                className="h-6 w-20 text-xs px-1"
                                defaultValue={getItemPrice(item)}
                                onBlur={(e) => {
                                  updateCustomPrice(item.product.id, e.target.value);
                                  setEditingPriceId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateCustomPrice(item.product.id, (e.target as HTMLInputElement).value);
                                    setEditingPriceId(null);
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingPriceId(null);
                                  }
                                }}
                                autoFocus
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingPriceId(item.product.id)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <span className={cn(
                                item.customPrice !== undefined && item.customPrice !== item.product.price
                                  ? 'text-primary font-medium'
                                  : ''
                              )}>
                                S/ {getItemPrice(item).toLocaleString('es-PE')} c/u
                              </span>
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}
                          {item.customPrice !== undefined && item.customPrice !== item.product.price && (
                            <span className="text-xs text-muted-foreground line-through">
                              S/ {item.product.price.toLocaleString('es-PE')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => updateQuantity(item.product.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            className="h-7 w-12 px-1 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) setItemQuantity(item.product.id, val);
                            }}
                            onBlur={(e) => {
                               if (!e.target.value || parseInt(e.target.value) === 0) setItemQuantity(item.product.id, 1);
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => updateQuantity(item.product.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <span className="text-sm font-bold text-foreground">
                        S/ {(getItemPrice(item) * item.quantity).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total */}

            <div className="mt-3 border-t border-border pt-2">
              <div className="flex items-center justify-between gap-4">
                  {transactionType === 'sale' && (
                     <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                        <SelectTrigger className="w-[140px] h-8">
                            <SelectValue placeholder="Método de Pago" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cash">Efectivo</SelectItem>
                            <SelectItem value="card">Tarjeta</SelectItem>
                            <SelectItem value="transfer">Transferencia</SelectItem>
                            <SelectItem value="yape">Yape</SelectItem>
                            <SelectItem value="plin">Plin</SelectItem>
                        </SelectContent>
                     </Select>
                  )}
                 <div className="flex items-center gap-4 ml-auto">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary">
                    S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                 </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">
              <Button className="w-full gap-2" size="lg" onClick={handleSaveAndPrint}>
                <Printer className="h-4 w-4" />
                {transactionType === 'sale' ? 'Finalizar Venta' : 'Guardar Cotización'}
              </Button>

            </div>
          </div>
        </div>
      </div>

      {/* Hidden Print Component */}
      {showPrintPreview && (
        <div className="fixed left-[-9999px] top-0">
          <PrintableDocument ref={printRef} data={getPrintData()} />
        </div>
      )}
    </MainLayout>
  );
}
