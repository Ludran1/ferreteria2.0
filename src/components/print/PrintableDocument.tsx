import { forwardRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PrintableDocumentData } from '@/types';
import { businessInfo, printTerms } from '@/config/businessInfo';

interface PrintableDocumentProps {
  data: PrintableDocumentData;
}

const paymentMethodLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  yape: 'Yape',
  plin: 'Plin',
};

export const PrintableDocument = forwardRef<HTMLDivElement, PrintableDocumentProps>(
  ({ data }, ref) => {
    const isQuote = data.type === 'quote';
    const terms = isQuote ? printTerms.quote : printTerms.sale;

    return (
      <div
        ref={ref}
        className="print-document bg-white text-black p-2 mx-auto"
        style={{ 
          width: '80mm',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '12px',
          lineHeight: '1.2'
        }}
      >
        {/* Header */}
        <div className="text-center border-b border-black pb-2 mb-2">
          <h1 className="text-base font-bold uppercase">{businessInfo.name}</h1>
          <p className="text-[10px] mt-1">{businessInfo.address}</p>
          <p className="text-[10px]">Tel: {businessInfo.phone}</p>
          <p className="text-[10px]">RFC: {businessInfo.rfc}</p>
          
          <div className="mt-2">
            <p className="font-bold">
              {data.type === 'quote' && 'COTIZACIÓN'}
              {data.type === 'sale' && 'TICKET DE VENTA'}
              {data.type === 'remission' && 'GUÍA DE REMISIÓN'}
            </p>
            <p>#{data.documentNumber}</p>
            <p className="text-[10px]">
              {format(data.date, "dd/MM/yyyy HH:mm", { locale: es })}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="border-b border-black pb-2 mb-2 text-[10px]">
          <p><span className="font-semibold">Cliente:</span> {data.customerName}</p>
          {data.customerPhone && (
            <p><span className="font-semibold">Tel:</span> {data.customerPhone}</p>
          )}
          {data.address && (
            <p><span className="font-semibold">Dirección:</span> {data.address}</p>
          )}
        </div>

        {/* Products */}
        <div className="mb-2">
          {/* Header Row */}
          <div className="grid grid-cols-12 border-b border-dashed border-black pb-1 mb-1 font-bold text-[10px]">
            <span className="col-span-6 text-left">Desc</span>
            <span className="col-span-2 text-center">Cant</span>
            <span className="col-span-4 text-right">Total</span>
          </div>
          
          {/* Data Rows */}
          {data.items.map((item, index) => {
            const unitPrice = item.customPrice ?? item.product.price;
            const lineTotal = unitPrice * item.quantity;
            return (
              <div key={index} className="mb-1 text-[10px] border-b border-gray-100 pb-1">
                {/* Product Name on its own line for readability */}
                <div className="font-medium mb-0.5">{item.product.name}</div>
                
                {/* Quantity - Unit Price - Total */}
                <div className="grid grid-cols-12 items-end">
                   {/* Description/Spacing filler if needed, or just putting qty/price below */}
                  <div className="col-span-8 flex items-center gap-1 text-gray-600 pl-2">
                     <span>{item.quantity}</span>
                     <span className="text-[9px]">x</span>
                     <span>S/ {unitPrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="col-span-4 text-right font-medium">
                    S/ {lineTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="border-t border-black pt-2 mb-4 text-[11px]">


          <div className="flex justify-between font-bold text-sm mt-1">
            <span>TOTAL:</span>
            <span>S/ {data.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
          </div>
          {data.paymentMethod && (
             <div className="mt-1 text-center text-[10px]">
               Pago: {paymentMethodLabels[data.paymentMethod]}
             </div>
          )}
        </div>

        {/* Footer / Terms */}
        <div className="text-center text-[9px] border-t border-dashed border-black pt-2">
          {isQuote ? (
             <p>Válido por {(terms as any).validity}</p>
          ) : (
             <p>Gracias por su compra</p>
          )}
          <p className="mt-1">*** COPIA CLIENTE ***</p>
        </div>
      </div>
    );
  }
);

PrintableDocument.displayName = 'PrintableDocument';
