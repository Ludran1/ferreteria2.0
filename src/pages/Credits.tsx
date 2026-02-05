import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useClients, useClientPayments, useClientSales } from '@/hooks/useClients';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, FileText, Plus, ArrowLeft, DollarSign } from 'lucide-react';
import { Client } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


export default function Credits() {
  const { clients, isLoading } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.documentId?.includes(searchTerm)
  );

  return (
    <MainLayout title="Créditos y Clientes" subtitle="Gestión de cuentas por cobrar">
      {selectedClient ? (
        <ClientDetail client={selectedClient} onBack={() => setSelectedClient(null)} />
      ) : (
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Add Client Button could go here */}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <Card 
                key={client.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedClient(client)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-start">
                    <span className="truncate" title={client.name}>{client.name}</span>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {client.documentId && <p>DOC: {client.documentId}</p>}
                    {client.phone && <p>Tel: {client.phone}</p>}
                    <p className="pt-2 text-foreground font-medium">Click para ver estado de cuenta</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredClients.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground">
                    No se encontraron clientes. Regístralos al momento de la venta.
                </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function ClientDetail({ client, onBack }: { client: Client, onBack: () => void }) {
    const { payments, addPayment } = useClientPayments(client.id);
    const { sales, isLoading: salesLoading } = useClientSales(client.id);
    const [paymentModalState, setPaymentModalState] = useState<{ open: boolean, saleId?: string, maxAmount?: number }>({
        open: false
    });

    // Filter only credit sales for the "Cargos" section, or show all transactions?
    // User requested "Ventas a Crédito (Cargos)".
    const creditSales = sales.filter(s => s.paymentType === 'credito');

    const handleSaleClick = (sale: any) => {
        setPaymentModalState({
            open: true,
            saleId: sale.id,
            maxAmount: sale.balance
        });
    }

    const handleGenericPayment = () => {
        setPaymentModalState({
            open: true
        });
    }

    const totalDebt = creditSales.reduce((acc, sale) => acc + (sale.balance || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">{client.name}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{client.documentType} {client.documentId}</span>
                        <span>•</span>
                        <span className="font-medium text-destructive">Deuda Total: S/ {totalDebt.toFixed(2)}</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <Button onClick={() => setShowPaymentModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Pago
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                 {/* SALES / CHARGES */}
                 <Card>
                     <CardHeader>
                         <CardTitle>Ventas a Crédito (Cargos)</CardTitle>
                     </CardHeader>
                     <CardContent>
                         <Table>
                             <TableHeader>
                                 <TableRow>
                                     <TableHead>Fecha</TableHead>
                                     <TableHead>Total</TableHead>
                                     <TableHead className="text-right">Saldo</TableHead>
                                 </TableRow>
                             </TableHeader>
                             <TableBody>
                                 {creditSales.map((sale) => (
                                     <TableRow 
                                        key={sale.id} 
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => handleSaleClick(sale)}
                                     >
                                         <TableCell>{format(new Date(sale.date), 'dd/MM/yyyy', { locale: es })}</TableCell>
                                         <TableCell>S/ {sale.total.toFixed(2)}</TableCell>
                                         <TableCell className="text-right font-bold text-destructive">
                                             S/ {(sale.balance || 0).toFixed(2)}
                                         </TableCell>
                                     </TableRow>
                                 ))}
                                 {creditSales.length === 0 && (
                                     <TableRow>
                                         <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                             No hay ventas a crédito
                                         </TableCell>
                                     </TableRow>
                                 )}
                             </TableBody>
                         </Table>
                     </CardContent>
                 </Card>

                 {/* PAYMENTS / CREDITS */}
                 <Card>
                    <CardHeader>
                        <CardTitle>Historial de Pagos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Método</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{format(new Date(payment.date), 'dd/MM/yyyy', { locale: es })}</TableCell>
                                        <TableCell>{payment.paymentMethod === 'cash' ? 'Efectivo' : payment.paymentMethod}</TableCell>
                                        <TableCell className="text-right font-medium text-success">
                                            + S/ {payment.amount.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {payments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                            No hay pagos registrados
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
            </div>

            <PaymentModal
                open={paymentModalState.open}
                onOpenChange={(open) => setPaymentModalState(prev => ({ ...prev, open }))}
                clientId={client.id}
                saleId={paymentModalState.saleId}
                maxAmount={paymentModalState.maxAmount}
                onPayment={addPayment.mutate}
            />
        </div>
    );
}

function PaymentModal({ 
    open, 
    onOpenChange, 
    clientId, 
    saleId, 
    maxAmount, 
    onPayment 
}: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void, 
    clientId: string,
    saleId?: string,
    maxAmount?: number,
    onPayment: (data: any) => void 
}) {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (open && maxAmount !== undefined) {
            setAmount(maxAmount.toFixed(2));
        } else if (open) {
            setAmount('');
        }
    }, [open, maxAmount]);

    const handleSubmit = () => {
        if (!amount || parseFloat(amount) <= 0) return;
        
        onPayment({
            clientId,
            saleId,
            amount: parseFloat(amount),
            paymentMethod: method,
            date: new Date(),
            notes
        });
        
        setAmount('');
        setNotes('');
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {saleId ? 'Abonar a Venta' : 'Registrar Pago General'}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Monto (S/)</Label>
                        <Input 
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                        />
                         {maxAmount !== undefined && (
                            <p className="text-xs text-muted-foreground">
                                Deuda pendiente: S/ {maxAmount.toFixed(2)}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label>Método de Pago</Label>
                         <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger>
                                <SelectValue />
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
                     <div className="grid gap-2">
                        <Label>Nota (Opcional)</Label>
                        <Input 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ej. Pago parcial de factura F001"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Registrar Pago</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
