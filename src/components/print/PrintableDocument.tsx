import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PrintableDocumentData } from '@/types';
import { BusinessSettings } from '@/hooks/useBusinessSettings';
import { businessInfo as defaultInfo, printTerms } from '@/config/businessInfo';
import { QRCodeSVG } from 'qrcode.react';

interface PrintableDocumentProps {
  data: PrintableDocumentData;
  settings?: BusinessSettings | null;
}

const paymentMethodLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  yape: 'Yape',
  plin: 'Plin',
};

export const PrintableDocument = forwardRef<HTMLDivElement, PrintableDocumentProps>(
  ({ data, settings }, ref) => {
    const isQuote = data.type === 'quote';
    const isFactura = data.documentNumber?.startsWith('F');
    const terms = isQuote ? printTerms.quote : printTerms.sale;
    
    // Use passed settings or fallback to default
    const info = settings || defaultInfo;
    
    // Extract numbers from total to convert to words
    const totalSolesFloor = Math.floor(data.total);
    const centsStr = Math.round((data.total % 1) * 100).toString().padStart(2, '0');

    return (
      <div
        ref={ref}
        className="print-document"
        style={{ 
          width: '300px', 
          padding: '15px', 
          fontFamily: "'Courier New', Courier, monospace", 
          fontSize: '11px', 
          color: 'black', 
          background: 'white', 
          lineHeight: '1.3', 
          margin: '0 auto', 
          boxSizing: 'border-box' 
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h2 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
             {(info as any)?.name || (info as any)?.businessName || 'MI EMPRESA'}
          </h2>
          <p style={{ margin: '2px 0 0 0' }}>RUC: {(info as any)?.ruc || (info as any)?.document_number || '10000000000'}</p>
          <p style={{ margin: '2px 0 0 0' }}>{info?.address || 'Dirección'}</p>
          <p style={{ margin: '2px 0 0 0' }}>Telf: {info?.phone || '000000000'}</p>
        </div>
        
        <div style={{ textAlign: 'center', borderTop: '1px dashed black', borderBottom: '1px dashed black', padding: '6px 0', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}>
             {data.type === 'quote' ? 'COTIZACIÓN' : data.type === 'remission' ? 'GUÍA DE REMISIÓN' : isFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '2px' }}>
             {data.type === 'quote' && !data.documentNumber.includes('COT-') ? `COT-${data.documentNumber.padStart(6,'0')}` : data.documentNumber}
          </div>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <table style={{ width: '100%', fontSize: '11px', textAlign: 'left' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold', width: '65px', verticalAlign: 'top' }}>CLIENTE:</td>
                <td style={{ textTransform: 'uppercase' }}>{data.customerName || 'CLIENTE VARIOS'}</td>
              </tr>
              {data.type !== 'quote' && data.type !== 'remission' && (
              <tr>
                <td style={{ fontWeight: 'bold' }}>DOC:</td>
                <td>{data.customerPhone || '99999999'}</td> {/* Actually it should be customer document if we had it. Keeping phone for now as it was mapped this way before or maybe missing */}
              </tr>
              )}
              <tr>
                <td style={{ fontWeight: 'bold' }}>FECHA:</td>
                <td>{format(new Date(data.date), 'dd/MM/yyyy hh:mm a')}</td>
              </tr>
              {data.type === 'remission' && data.address && (
              <tr>
                <td style={{ fontWeight: 'bold', verticalAlign: 'top' }}>DESTINO:</td>
                <td style={{ textTransform: 'uppercase' }}>{data.address}</td>
              </tr>
              )}
            </tbody>
          </table>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '8px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px dashed black', paddingBottom: '3px', borderTop: '1px dashed black', paddingTop: '3px', width: '15%' }}>Cant</th>
              <th style={{ textAlign: 'left', borderBottom: '1px dashed black', paddingBottom: '3px', borderTop: '1px dashed black', paddingTop: '3px', width: '45%' }}>Desc</th>
              {data.type !== 'remission' && (
                  <>
                    <th style={{ textAlign: 'right', borderBottom: '1px dashed black', paddingBottom: '3px', borderTop: '1px dashed black', paddingTop: '3px', width: '20%' }}>P.U</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px dashed black', paddingBottom: '3px', borderTop: '1px dashed black', paddingTop: '3px', width: '20%' }}>Total</th>
                  </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => {
                const unitPrice = item.customPrice ?? item.product.price;
                const lineTotal = unitPrice * item.quantity;
                return (
                  <React.Fragment key={index}>
                      <tr>
                        <td colSpan={data.type === 'remission' ? 2 : 4} style={{ paddingTop: '4px', textTransform: 'uppercase' }}>{item.product.name}</td>
                      </tr>
                      <tr>
                        <td style={{ paddingBottom: '4px', paddingLeft: '5px' }}>{item.quantity}</td>
                        <td style={{ paddingBottom: '4px' }}></td>
                        {data.type !== 'remission' && (
                            <>
                                <td style={{ textAlign: 'right', paddingBottom: '4px' }}>{unitPrice.toFixed(2)}</td>
                                <td style={{ textAlign: 'right', paddingBottom: '4px' }}>{lineTotal.toFixed(2)}</td>
                            </>
                        )}
                      </tr>
                  </React.Fragment>
                );
            })}
          </tbody>
        </table>

        {data.type !== 'remission' && (
            <>
              <div style={{ borderTop: '1px dashed black', paddingTop: '6px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>OP. GRAVADA:</span>
                  <span>S/ {(data.total / 1.18).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>IGV (18%):</span>
                  <span>S/ {(data.total - (data.total / 1.18)).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ borderTop: '2px solid black', borderBottom: '2px solid black', padding: '6px 0', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
                <span style={{ textTransform: 'uppercase' }}>TOTAL:</span>
                <span>S/ {data.total.toFixed(2)}</span>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <p style={{ margin: '2px 0' }}>
                    <span style={{ fontWeight: 'bold' }}>SON:</span> SON {totalSolesFloor} CON {centsStr}/100 SOLES
                </p>
                <p style={{ margin: '2px 0' }}>
                    <span style={{ fontWeight: 'bold' }}>Cond. Venta:</span> {(data.paymentMethod ? paymentMethodLabels[data.paymentMethod] : 'EFECTIVO').toUpperCase()}
                </p>
              </div>

              {data.type !== 'quote' && (
              <div style={{ textAlign: 'center', margin: '15px 0', display: 'flex', justifyContent: 'center' }}>
                 <QRCodeSVG 
                    value={`${(info as any)?.ruc || '10000000000'}|${isFactura ? '01' : '03'}|${data.documentNumber.split('-')[0] || 'B002'}|${data.documentNumber.split('-')[1] || data.documentNumber}|${(data.total - (data.total / 1.18)).toFixed(2)}|${data.total.toFixed(2)}|${format(new Date(data.date), 'dd/MM/yyyy')}|1|${data.customerPhone || '00000000'}`} 
                    size={120} 
                 />
              </div>
              )}
            </>
        )}

        <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: 'bold', marginTop: data.type === 'remission' ? '20px' : '0' }}>
            <p style={{ margin: '2px 0' }}>
                {isQuote ? `Válido por ${(terms as any).validity}` : 'REPRESENTACIÓN IMPRESA DE LA'}
            </p>
            {!isQuote && (
                <p style={{ margin: '2px 0' }}>
                    {data.type === 'remission' ? 'GUÍA DE REMISIÓN' : isFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
                </p>
            )}
            {data.type !== 'quote' && (
                <>
                  <p style={{ margin: '2px 0', fontSize: '8px' }}>AUTORIZADO CON RESOLUCIÓN N°034-005-0012997/SUNAT</p>
                  <p style={{ margin: '2px 0' }}>CONSULTE EN: WWW.APISUNAT.PE</p>
                </>
            )}
            <p style={{ margin: '6px 0 0 0', fontStyle: 'italic', fontWeight: 'normal' }}>Software: FerrePOS v1.0</p>
        </div>
      </div>
    );
  }
);

PrintableDocument.displayName = 'PrintableDocument';
