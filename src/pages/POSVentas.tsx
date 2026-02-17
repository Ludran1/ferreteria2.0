import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product, QuoteItem, PrintableDocumentData } from '@/types';
import { Plus, Search, Minus, Trash2, FileText, ShoppingCart, ScanBarcode, Edit2, Printer, Receipt, RefreshCw } from 'lucide-react';
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
import { numberToText } from '@/lib/numberToText';

// Hooks
import { useProducts } from '@/hooks/useProducts';
import { useSales, getNextDocumentNumber } from '@/hooks/useTransactions';
import { buildDocumentRequest, emitirComprobante, consultarDni, consultarRuc, ANONYMOUS_CLIENT } from '@/lib/apiSunat';
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
  const queryClient = useQueryClient();

  const handleSync = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    ]);
    toast({
      title: 'Datos sincronizados',
      description: 'Se han actualizado productos y clientes.',
    });
  };

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
  const [isEmitting, setIsEmitting] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [sunatResult, setSunatResult] = useState<{ estado: string; serie: string; numero: number; message: string } | null>(null);
  

  
  // Document type: boleta or factura
  const [documentType, setDocumentType] = useState<'boleta' | 'factura'>('boleta');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'yape' | 'plin'>('cash');
  
  const { toast } = useToast();

  // Auto-lookup DNI/RUC
  useEffect(() => {
    const fetchClientData = async () => {
      if (documentType === 'boleta' && customerDocument.length === 8) {
        const data = await consultarDni(customerDocument);
        if (data) {
          setCustomerName(`${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`);
          setCustomerAddress('-'); 
          toast({ title: 'Cliente encontrado', description: 'Datos cargados de RENIEC' });
        }
      } else if (documentType === 'factura' && customerDocument.length === 11) {
        const data = await consultarRuc(customerDocument);
        if (data) {
          setCustomerName(data.razonSocial);
          setCustomerAddress(data.direccion || '-');
          toast({ title: 'Empresa encontrada', description: 'Datos cargados de SUNAT' });
        }
      }
    };
    
    // Debounce/Trigger when length is correct
    if (customerDocument.length === 8 || customerDocument.length === 11) {
        fetchClientData();
    }
  }, [customerDocument, documentType, toast]);
  const { printRef, handlePrint } = usePrint();
  const { settings } = useBusinessSettings();
  const { clients, createClient } = useClients();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openClientCombo, setOpenClientCombo] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDoc, setNewClientDoc] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  // Manual lookup for New Client Modal
  const handleSearchClient = async () => {
    if (!newClientDoc) return;

    if (newClientDoc.length === 8) {
      const data = await consultarDni(newClientDoc);
      if (data) {
        setNewClientName(`${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`);
        toast({ title: 'Cliente encontrado', description: 'Datos cargados de RENIEC' });
      } else {
        toast({ title: 'No encontrado', description: 'No se encontraron datos en RENIEC', variant: 'destructive' });
      }
    } else if (newClientDoc.length === 11) {
      const data = await consultarRuc(newClientDoc);
      if (data) {
        setNewClientName(data.razonSocial);
        setNewClientAddress(data.direccion || '');
        toast({ title: 'Empresa encontrada', description: 'Datos cargados de SUNAT' });
      } else {
        toast({ title: 'No encontrado', description: 'No se encontraron datos en SUNAT', variant: 'destructive' });
      }
    } else {
      toast({ 
        title: 'Documento inválido', 
        description: 'El documento debe tener 8 (DNI) o 11 (RUC) dígitos', 
        variant: 'destructive' 
      });
    }
  };

  // Custom Item State
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  const [customItemQuantity, setCustomItemQuantity] = useState('1');

  const handleAddCustomItem = (keepOpen = false) => {
    if (!customItemName || !customItemPrice) return;

    const price = parseFloat(customItemPrice);
    const quantity = parseFloat(customItemQuantity);
    
    if (isNaN(price)) return;
    if (isNaN(quantity) || quantity <= 0) return;

    const manualProduct: Product = {
      id: `manual-${Date.now()}`,
      name: customItemName,
      price: price,
      description: 'Producto agregado manualmente',
      category: 'Manual',
      sku: 'MANUAL',
    };

    addToCart(manualProduct, quantity);
    
    if (keepOpen) {
        setCustomItemName('');
        setCustomItemPrice('');
        setCustomItemQuantity('1');
        document.getElementById('manual-item-name')?.focus();
        toast({
            title: 'Item agregado',
            description: `${customItemName} añadido. Listo para el siguiente.`,
        });
    } else {
        setShowCustomItemModal(false);
        setCustomItemName('');
        setCustomItemPrice('');
        setCustomItemQuantity('1');
        toast({
            title: 'Item agregado',
            description: `${customItemName} añadido al comprobante`,
       });
    }
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

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
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

    setIsEmitting(true);

    try {
      // 1. Determine serie and get next correlativo
      const serie = documentType === 'boleta' ? 'B001' : 'F001';
      const numero = await getNextDocumentNumber(serie);

      // 2. Build SUNAT request
      const sunatRequest = buildDocumentRequest({
        documentType,
        serie,
        numero,
        customerDocType: documentType === 'factura' ? '6' : ANONYMOUS_CLIENT.tipo_de_documento,
        // Si no hay DNI, usar el generico 99999999 para boletas
        customerDocNumber: customerDocument || ANONYMOUS_CLIENT.numero_de_documento,
        customerName: selectedClient ? selectedClient.name : (customerName || ANONYMOUS_CLIENT.denominacion),
        customerAddress: customerAddress || ANONYMOUS_CLIENT.direccion,
        items: cartItems.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          priceWithIgv: item.customPrice !== undefined ? item.customPrice : item.product.price,
        })),
        total,
      });

      // 3. Call SUNAT API
      const sunatResponse = await emitirComprobante(sunatRequest);

      // 4. Process result
      if (sunatResponse.success && sunatResponse.payload) {
        const estado = sunatResponse.payload.estado;
        const finalNumero = sunatResponse.finalNumero;

        // 5. Save sale with SUNAT metadata
        const transactionData = {
          customerName: selectedClient ? selectedClient.name : customerName,
          customerPhone: selectedClient ? (selectedClient.phone || '') : customerPhone,
          customerEmail: selectedClient ? (selectedClient.email || '') : '',
          items: cartItems,
          date: new Date(),
          total: total,
          paymentMethod,
          paymentType: 'contado' as const,
          // SUNAT metadata
          documentType,
          documentSerie: serie,
          documentNumber: finalNumero,
          sunatEstado: estado,
          sunatHash: sunatResponse.payload.hash,
          sunatPdfUrl: sunatResponse.payload.pdf?.ticket || null,
          sunatXmlUrl: sunatResponse.payload.xml || null,
          customerDocument,
          customerAddress,
        };

        const result = await createSale.mutateAsync(transactionData as any);
        setLastSavedTransaction(result);
        setSunatResult({ estado, serie, numero: finalNumero, message: sunatResponse.message });
        setShowReceiptModal(true);
      } else {
        // API returned error
        toast({
          title: 'Error SUNAT',
          description: sunatResponse.message || 'Error desconocido al emitir comprobante',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error emitting document:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al emitir comprobante',
        variant: 'destructive',
      });
    } finally {
      setIsEmitting(false);
    }
  };

  const handleCreateClient = () => {
    createClient.mutate({
      name: newClientName,
      documentId: newClientDoc,
      phone: '',
      email: '',
      address: newClientAddress,
      notes: ''
    } as any, {
      onSuccess: (newClient) => {
        setSelectedClient(newClient as Client);
        setCustomerName(newClient.name);
        setCustomerDocument(newClient.documentId || '');
        setCustomerAddress(newClientAddress); // Update current sale address
        setShowNewClientModal(false);
        setNewClientName('');
        setNewClientDoc('');
        setNewClientAddress('');
      }
    });
  };

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    setSunatResult(null);
    setLastSavedTransaction(null);
    // Reset form
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerDocument('');
    setCustomerAddress('');
    setSelectedClient(null);
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
            <Button
              variant="outline"
              size="icon"
              onClick={handleSync}
              title="Sincronizar datos"
            >
              <RefreshCw className="h-4 w-4" />
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
                    id="manual-item-name"
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
                         if (e.key === 'Enter') document.getElementById('quantity')?.focus();
                      }}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={customItemQuantity}
                    onChange={(e) => setCustomItemQuantity(e.target.value)}
                    placeholder="1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCustomItem();
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCustomItemModal(false)}>Terminar</Button>
                <Button 
                    variant="default" 
                    onClick={() => handleAddCustomItem(true)}
                    title="Agregar y continuar"
                >
                    <Plus className="h-4 w-4" />
                </Button>
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
                  <div className="flex gap-2">
                    <Input
                      value={newClientDoc}
                      onChange={(e) => setNewClientDoc(e.target.value)}
                      placeholder="Documento de identidad"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchClient();
                        }
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleSearchClient();
                      }}
                      title="Buscar en RENIEC/SUNAT"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                 <div className="grid gap-2">
                  <Label>Dirección (Opcional)</Label>
                  <Input
                    value={newClientAddress}
                    onChange={(e) => setNewClientAddress(e.target.value)}
                    placeholder="Dirección fiscal"
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
                        {clients
                          .filter((client) => {
                            // En Factura, solo mostrar clientes con RUC (11 dígitos)
                            if (documentType === 'factura') {
                              return client.documentId && client.documentId.length === 11;
                            }
                            return true;
                          })
                          .map((client) => (
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

              {/* Document-specific fields logic removed per user request - rely on Client Selector */}
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
              disabled={cartItems.length === 0 || isEmitting}
            >
              {isEmitting ? (
                <span className="animate-pulse">Emitiendo...</span>
              ) : (
                <>
                  <Receipt className="h-5 w-5" />
                  Emitir {documentType === 'boleta' ? 'Boleta' : 'Factura'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Receipt Modal after SUNAT emission */}
      <Dialog open={showReceiptModal} onOpenChange={(open) => { if (!open) handleCloseReceiptModal(); }}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {sunatResult?.estado === 'ACEPTADO' && <span className="text-green-500 text-xl">✅</span>}
              {sunatResult?.estado === 'PENDIENTE' && <span className="text-yellow-500 text-xl">⏳</span>}
              {sunatResult?.estado === 'RECHAZADO' && <span className="text-red-500 text-xl">❌</span>}
              Comprobante {sunatResult?.estado}
            </DialogTitle>
          </DialogHeader>

          {sunatResult && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-medium capitalize">{documentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serie-Número:</span>
                <span className="font-medium">{sunatResult.serie}-{sunatResult.numero}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-lg">S/ {total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-1">{sunatResult.message}</p>
            </div>
          )}

          {/* Receipt Preview */}
          {lastSavedTransaction && (
            <div className="flex-1 overflow-auto border rounded-lg bg-white" id="receipt-print-area">
              <div ref={printRef} className="p-4 text-sm text-black font-mono leading-tight">
                {/* Header */}
                <div className="text-center mb-4">
                  <h2 className="font-bold text-sm uppercase">{settings?.name || 'FERRETERIA AMIGA'}</h2>
                  <p className="text-xs uppercase">{settings?.name || 'FERRETERIA AMIGA'}</p> 
                  <p className="text-xs uppercase font-bold">RUC: {settings?.ruc || '10408724771'}</p>
                  
                  <div className="mt-3 font-bold text-base uppercase">
                    {documentType === 'factura' ? 'FACTURA' : 'BOLETA'} DE VENTA
                  </div>
                  <div className="font-bold text-base uppercase">
                    {sunatResult?.serie || 'B001'} - {(sunatResult?.numero || 0).toString().padStart(6, '0')}
                  </div>
                </div>

                {/* Client Info */}
                <div className="mb-2 text-xs uppercase space-y-0.5">
                  <div className="flex"><span className="font-bold w-16 shrink-0">Cliente:</span> <span>{lastSavedTransaction?.customerName || (customerName || 'CLIENTE VARIOS')}</span></div>
                  <div className="flex"><span className="font-bold w-16 shrink-0">DNI:</span> <span>{lastSavedTransaction?.customerDocument || (customerDocument || '')}</span></div>
                  <div className="flex"><span className="font-bold w-16 shrink-0">Fecha:</span> <span>{new Date().toLocaleDateString('es-PE')} {new Date().toLocaleTimeString('es-PE', {hour: '2-digit', minute:'2-digit'})}</span></div>
                </div>
                
                <hr className="border-black border-t-2 mb-2" />

                {/* Detalle */}
                <div className="text-xs mb-2">
                  <div className="font-bold mb-1">Detalle</div>
                  <div className="border-b border-black border-dotted mb-1"></div>
                  <div className="flex font-bold text-[10px] mb-1">
                      <span className="w-8 text-center">Cant</span>
                      <span className="w-8 text-center">U.M</span>
                      <span className="w-12 text-right ml-auto">Precio</span>
                      <span className="w-12 text-right">Total</span>
                  </div>
                  <div className="border-b border-black border-dotted mb-1"></div>

                  {cartItems.map((item, i) => {
                      const price = item.customPrice ?? item.product.price;
                      const subtotal = price * item.quantity;
                      return (
                        <div key={i} className="mb-2 text-[11px]">
                          <div className="uppercase font-medium">{item.product.name}</div>
                          <div className="flex">
                            <span className="w-8 text-center">{item.quantity}</span>
                            <span className="w-8 text-center">NIU</span>
                            <span className="w-12 text-right ml-auto">{price.toFixed(2)}</span>
                            <span className="w-12 text-right">{subtotal.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                  })}
                </div>
                
                <hr className="border-black border-dotted mb-2" />

                {/* Totals */}
                <div className="text-right text-xs space-y-1 font-mono">
                  <div className="flex justify-end">
                    <span className="mr-8">Total Gravado (S/):</span>
                    <span>{subtotalSinIGV.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end">
                      <span className="mr-8">IGV 18% (S/):</span>
                      <span>{igv.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end font-bold text-sm mt-1">
                      <span className="mr-8">Total (S/):</span>
                      <span>{total.toFixed(2)}</span>
                  </div>
                </div>
                
                <hr className="border-black border-t-2 my-2" />

                {/* Amount in words */}
                <div className="text-xs mb-2 uppercase">
                  <span className="font-bold">SON: </span>
                  {numberToText(total)}
                </div>
                
                <div className="text-xs mb-4">
                  <span className="font-bold">Cond. Venta: </span> <span className="uppercase">{paymentMethod}</span>
                </div>

                {/* QR */}
                <div className="flex justify-center mb-2">
                    <div className="border border-black p-1">
                      <ScanBarcode className="w-20 h-20 text-black" />
                    </div>
                </div>
                
                <div className="text-center text-[9px] uppercase space-y-0.5">
                  <p>Hash:</p>
                  <p className="break-all font-mono text-[8px] mb-2">{sunatResult?.message || lastSavedTransaction?.sunatHash || 'PENDIENTE'}</p>
                  <p>Representación Impresa de la</p>
                  <p>{documentType === 'factura' ? 'FACTURA' : 'BOLETA'} DE VENTA ELECTRÓNICA</p>
                  <p>Puede consultar en: www.apisunat.pe</p>
                  <p>Autorizado con Resolución N°034-005-0012997/SUNAT</p>
                  
                  <p className="mt-4 italic normal-case">Generated by FerrePOS</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={handleCloseReceiptModal}>
              Cerrar
            </Button>
            <Button onClick={() => {
              if (!printRef.current) return;
              // Inject print CSS to hide everything except the receipt
              const style = document.createElement('style');
              style.id = 'receipt-print-style';
              style.textContent = `
                @media print {
                  body * { visibility: hidden !important; }
                  #receipt-print-area, #receipt-print-area * { visibility: visible !important; }
                  #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; }
                }
              `;
              document.head.appendChild(style);
              window.print();
              // Remove the style after printing
              setTimeout(() => { document.getElementById('receipt-print-style')?.remove(); }, 500);
            }} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
