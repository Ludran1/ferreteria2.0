
import { forwardRef } from 'react';
import { ScanBarcode } from 'lucide-react';
import { numberToText } from '@/lib/numberToText';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ThermalReceiptData {
  title: string; // "BOLETA DE VENTA" / "FACTURA DE VENTA"
  serie: string;
  number: string;
  customerName: string;
  customerDocument: string;
  date: Date;
  items: ReceiptItem[];
  subtotal: number; // Gravado
  igv: number;
  total: number;
  paymentMethod: string;
  sunatHash?: string;
  isElectronic?: boolean; // To show electronic footer
}

interface ThermalReceiptProps {
  data: ThermalReceiptData;
}

export const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(
  ({ data }, ref) => {
    return (
      <div ref={ref} className="w-[80mm] p-4 text-xs text-black bg-white" id="receipt-print-area">
        {/* Header */}
        <div className="text-center mb-4 space-y-1">
          <h2 className="font-bold text-lg uppercase">Ferretería Amiga</h2>
          <p>RUC: 20123456789</p>
          <p className="text-[10px] break-words">Av. Principal 123, Lima</p>
          <p className="text-[10px]">Telf: (01) 123-4567</p>
          
          <div className="border-t-2 border-b-2 border-black border-dashed py-1 my-2">
            <div className="font-bold text-sm uppercase">{data.title}</div>
            <div className="font-bold text-base uppercase">
              {data.serie} - {data.number}
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="mb-2 text-xs uppercase space-y-0.5">
          <div className="flex">
            <span className="font-bold w-16 shrink-0">Cliente:</span> 
            <span className="break-words flex-1 text-right">{data.customerName || 'CLIENTE VARIOS'}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-16 shrink-0">DOC:</span> 
            <span className="text-right flex-1">{data.customerDocument || '-'}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-16 shrink-0">Fecha:</span> 
            <span className="text-right flex-1">{data.date.toLocaleDateString('es-PE')} {data.date.toLocaleTimeString('es-PE', {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        </div>
        
        <hr className="border-black border-t-2 mb-2" />

        {/* Detalle */}
        <div className="text-xs mb-2">
          <div className="flex font-bold text-[10px] mb-1">
              <span className="w-8 text-center">Cant</span>
              <span className="flex-1 text-left px-1">Desc</span>
              <span className="w-12 text-right">P.U</span>
              <span className="w-12 text-right">Total</span>
          </div>
          <div className="border-b border-black border-dotted mb-1"></div>

          {data.items.map((item, i) => (
            <div key={i} className="mb-1 text-[11px]">
              <div className="uppercase font-medium mb-0.5">{item.name}</div>
              <div className="flex items-start">
                <span className="w-8 text-center">{item.quantity}</span>
                <span className="flex-1"></span>
                <span className="w-12 text-right">{item.price.toFixed(2)}</span>
                <span className="w-12 text-right">{item.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
        
        <hr className="border-black border-dotted mb-2" />

        {/* Totals */}
        <div className="text-right text-xs space-y-1 font-mono">
          <div className="flex justify-between">
            <span>OP. GRAVADA:</span>
            <span>S/ {data.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>IGV (18%):</span>
            <span>S/ {data.igv.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm mt-1 border-t border-black pt-1">
            <span>TOTAL:</span>
            <span>S/ {data.total.toFixed(2)}</span>
          </div>
        </div>
        
        <hr className="border-black border-t-2 my-2" />

        {/* Amount in words */}
        <div className="text-xs mb-2 uppercase">
          <span className="font-bold">SON: </span>
          {numberToText(data.total)}
        </div>
        
        <div className="text-xs mb-4">
          <span className="font-bold">Cond. Venta: </span> <span className="uppercase">{data.paymentMethod}</span>
        </div>

        {/* Footer Electronic */}
        {data.isElectronic && (
            <div className="flex flex-col items-center space-y-2 mt-4">
                <div className="border border-black p-1">
                  <ScanBarcode className="w-20 h-20 text-black" />
                </div>
                
                <div className="text-center text-[9px] uppercase space-y-0.5 w-full">
                  <div className="flex justify-between w-full">
                    <span>Hash:</span>
                    <span className="font-mono text-[8px] break-all">{data.sunatHash || 'PENDIENTE'}</span>
                  </div>
                  <p className="mt-2 font-bold">Representación Impresa de la</p>
                  <p className="font-bold">{data.title} ELECTRÓNICA</p>
                  <p>Autorizado con Resolución N°034-005-0012997/SUNAT</p>
                  <p>Consulte en: www.apisunat.pe</p>
                  
                  <p className="mt-4 italic normal-case text-[8px]">Software: FerrePOS v1.0</p>
                </div>
            </div>
        )}
      </div>
    );
  }
);
