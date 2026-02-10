import { useState, useCallback, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product, QuoteItem, PrintableDocumentData } from '@/types';
import { Plus, Search, Minus, Trash2, FileText, ShoppingCart, ScanBarcode, Edit2, Printer, Receipt } from 'lucide-react';
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
import { useSales } from '@/hooks/useTransactions';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { useClients } from '@/hooks/useClients';
import { Client } from '@/types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown, UserPlus } from "lucide-react"

export default function POSVentas() {
  // Hooks Data
  const { products: availableProducts } = useProducts();
  const { createSale } = useSales();

  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<QuoteItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [lastSavedTransaction, setLastSavedTransaction] = useState<any>(null);
  
  // Document type: boleta or factura
  const [documentType, setDocumentType] = useState<'boleta' | 'factura'>('boleta');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'yape' | 'plin'>('cash');
  
  const { toast } = useToast();
  const { printRef, handlePrint } = usePrint();
  const { settings } = useBusinessSettings();
  const { clients, createClient } = useClients();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openClientCombo, setOpenClientCombo] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDoc, setNewClientDoc] = useState('');

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
      description: `${customItemName} añadido al comprobante`,
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
  }, [availableProducts, toast]);

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

  // Calculate IGV (18%)
  const subtotalSinIGV = total / 1.18;
  const igv = total - subtotalSinIGV;

  const handleEmitDocument = async () => {
    // Validation for Factura (requires RUC)
    if (documentType === 'factura') {
      if (!customerDocument || customerDocument.length !== 11) {
        toast({
          title: 'RUC Requerido',
          description: 'Para emitir una factura se requiere un RUC válido de 11 dígitos',
          variant: 'destructive',
        });
        return;
      }
      if (!customerName.trim()) {
        toast({
          title: 'Razón Social Requerida',
          description: 'Ingresa la razón social del cliente',
          variant: 'destructive',
        });
        return;
      }
    }

    if (cartItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Agrega productos al comprobante',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Integrate with API SUNAT here
    toast({
      title: 'Próximamente',
      description: `La emisión de ${documentType === 'boleta' ? 'Boleta' : 'Factura'} electrónica se integrará con API SUNAT`,
    });

    // For now, save as a regular sale with metadata
    const transactionData = {
      customerName: selectedClient ? selectedClient.name : customerName,
      customerPhone: selectedClient ? (selectedClient.phone || '') : customerPhone,
      customerEmail: selectedClient ? (selectedClient.email || '') : '',
      items: cartItems,
      date: new Date(),
      total: total,
      paymentMethod,
      paymentType: 'contado' as const,
      // Electronic document metadata
      documentType,
      customerDocument,
      customerAddress,
      subtotalSinIGV,
      igv,
    };

    try {
      const result = await createSale.mutateAsync(transactionData as any);
      setLastSavedTransaction(result);

      // Show print preview
      setShowPrintPreview(true);
      setTimeout(() => {
        handlePrint();
        setShowPrintPreview(false);
        setLastSavedTransaction(null);
        
        // Reset form
        setCartItems([]);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerDocument('');
        setCustomerAddress('');
        setSelectedClient(null);
      }, 100);

    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateClient = () => {
    createClient.mutate({
      name: newClientName,
      documentId: newClientDoc,
      phone: '',
      email: '',
      address: '',
      notes: ''
    } as any, {
      onSuccess: (newClient) => {
        setSelectedClient(newClient as Client);
        setCustomerName(newClient.name);
        setCustomerDocument(newClient.documentId || '');
        setShowNewClientModal(false);
        setNewClientName('');
        setNewClientDoc('');
      }
    });
  };

  const getPrintData = (): PrintableDocumentData => {
    const docNumber = lastSavedTransaction 
      ? lastSavedTransaction.invoice_number
      : 'PENDIENTE';

    return {
      type: 'sale',
      documentNumber: docNumber || 'PENDIENTE',
      date: new Date(),
      customerName,
      customerPhone: customerPhone || undefined,
      items: cartItems,
      subtotal: subtotalSinIGV,
      tax: igv,
      total: total,
      paymentMethod,
    };
  };

  return (
    <MainLayout title="POS Ventas" subtitle="Emisión de Boletas y Facturas Electrónicas">
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Products Panel */}
        <div className="lg:col-span-4 space-y-6">
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
                  <Label htmlFor="price">Precio Unitario (Inc. IGV)</Label>
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

          {/* New Client Modal */}
          <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Cliente</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nombre / Razón Social</Label>
                  <Input
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Nombre completo o razón social"
                  />
                </div>
                 <div className="grid gap-2">
                  <Label>RUC / DNI</Label>
                  <Input
                    value={newClientDoc}
                    onChange={(e) => setNewClientDoc(e.target.value)}
                    placeholder="Documento de identidad"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewClientModal(false)}>Cancelar</Button>
                <Button onClick={handleCreateClient} disabled={!newClientName}>Crear Cliente</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {scannerActive && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-sm text-success">
              <ScanBarcode className="h-4 w-4" />
              <span>Lector de código de barras activo - Escanea un producto</span>
            </div>
          )}

          {/* Products Grid - 4x4 compact */}
          <div className="grid grid-cols-4 gap-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="flex flex-col items-center gap-1 rounded-lg bg-card p-2 text-center shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight w-full" title={product.name}>{product.name}</p>
                <p className="text-[10px] text-muted-foreground">{product.sku}</p>
                <p className="text-xs font-bold text-primary">
                  S/ {product.price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24 rounded-2xl bg-card p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                     {/* Toggle Boleta/Factura */}
                     <div className="flex bg-secondary p-1 rounded-lg">
                        <button
                          onClick={() => setDocumentType('boleta')}
                          className={cn(
                            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                            documentType === 'boleta' 
                              ? "bg-white text-primary shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Boleta
                        </button>
                        <button
                          onClick={() => setDocumentType('factura')}
                          className={cn(
                            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                            documentType === 'factura' 
                              ? "bg-white text-primary shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Factura
                        </button>
                     </div>
                </div>

                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">
                    Nueva {documentType === 'boleta' ? 'Boleta' : 'Factura'} Electrónica
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    ({cartItems.length} productos)
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mt-6 space-y-3">
              {/* Client selector */}
              <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openClientCombo}
                    className="w-full justify-between font-normal"
                  >
                    {selectedClient ? selectedClient.name : (customerName || "Seleccionar cliente...")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2">
                          <p className="text-sm text-muted-foreground mb-2">No encontrado</p>
                          <Button size="sm" className="w-full" onClick={() => {
                            setShowNewClientModal(true);
                            setOpenClientCombo(false); 
                          }}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Nuevo Cliente
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {clients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.name}
                            onSelect={() => {
                              setSelectedClient(client);
                              setCustomerName(client.name);
                              setCustomerPhone(client.phone || '');
                              setCustomerDocument(client.documentId || '');
                              setOpenClientCombo(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <p>{client.name}</p>
                              {client.documentId && <p className="text-xs text-muted-foreground">{client.documentId}</p>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Document-specific fields */}
              {documentType === 'factura' ? (
                <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-medium text-blue-700">Datos para Factura (Obligatorios)</p>
                  <Input
                    placeholder="RUC (11 dígitos) *"
                    value={customerDocument}
                    onChange={(e) => setCustomerDocument(e.target.value)}
                    maxLength={11}
                  />
                  <Input
                    placeholder="Razón Social *"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setSelectedClient(null);
                    }}
                  />
                  <Input
                    placeholder="Dirección Fiscal"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="DNI (opcional)"
                    value={customerDocument}
                    onChange={(e) => setCustomerDocument(e.target.value)}
                    maxLength={8}
                  />
                  <Input
                    placeholder="Nombre (opcional)"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setSelectedClient(null);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="mt-6 max-h-[350px] space-y-3 overflow-y-auto pr-2">
              {cartItems.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Agrega productos al comprobante
                </p>
              ) : (
                cartItems.map((item, index) => (
                  <div
                    key={`${item.product.id}-${index}`}
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

            {/* Totals with IGV breakdown */}
            <div className="mt-4 border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal (sin IGV)</span>
                <span>S/ {subtotalSinIGV.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>IGV (18%)</span>
                <span>S/ {igv.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex gap-2">
                  <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="yape">Yape</SelectItem>
                      <SelectItem value="plin">Plin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-primary">
                    S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              className="w-full mt-4 h-12 text-lg gap-2"
              onClick={handleEmitDocument}
              disabled={cartItems.length === 0}
            >
              <Receipt className="h-5 w-5" />
              Emitir {documentType === 'boleta' ? 'Boleta' : 'Factura'}
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden Print Component */}
      {showPrintPreview && lastSavedTransaction && (
        <div className="fixed left-[-9999px] top-0">
          <PrintableDocument ref={printRef} data={getPrintData()} settings={settings} />
        </div>
      )}
    </MainLayout>
  );
}
