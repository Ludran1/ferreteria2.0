import { forwardRef } from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { PrintableDocumentData } from '@/types';
import { BusinessSettings } from '@/hooks/useBusinessSettings';

interface A4DocumentProps {
  data: PrintableDocumentData;
  settings?: BusinessSettings | null;
  customerDocument?: string;
  customerAddress?: string;
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  yape: 'Yape',
  plin: 'Plin',
};

export const A4Document = forwardRef<HTMLDivElement, A4DocumentProps>(
  ({ data, settings, customerDocument, customerAddress }, ref) => {
    const isFactura = data.documentNumber?.startsWith('F');

    // Color scheme: azul oscuro para boleta, verde oscuro para factura
    const primaryColor = isFactura ? '#1a3a2e' : '#1a1a2e';
    const accentColor = isFactura ? '#2d6a4f' : '#2d3561';

    const docTitle = isFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';
    const docLabel = isFactura ? 'FACTURA' : 'BOLETA';

    const businessName = (settings as any)?.name || 'MI EMPRESA';
    const ruc = (settings as any)?.rfc || '10000000000';
    const address = settings?.address || 'Dirección';
    const phone = settings?.phone || '000000000';
    const email = settings?.email || '';

    const totalFloor = Math.floor(data.total);
    const cents = Math.round((data.total % 1) * 100).toString().padStart(2, '0');
    const subtotal = data.total / 1.18;
    const igv = data.total - subtotal;

    const qrValue = `${ruc}|${isFactura ? '01' : '03'}|${data.documentNumber.split('-')[0] || 'B001'}|${data.documentNumber.split('-')[1] || data.documentNumber}|${igv.toFixed(2)}|${data.total.toFixed(2)}|${format(new Date(data.date), 'dd/MM/yyyy')}|1|${customerDocument || data.customerPhone || '00000000'}`;

    return (
      <div
        ref={ref}
        style={{
          width: '794px',
          height: '1123px',
          backgroundColor: '#ffffff',
          fontFamily: "'Arial', sans-serif",
          fontSize: '13px',
          color: '#1a1a1a',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top color bar */}
        <div style={{ height: '8px', backgroundColor: primaryColor }} />

        <div style={{ padding: '40px 52px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
            {/* Company info */}
            <div style={{ flex: 1, paddingRight: '24px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: primaryColor, textTransform: 'uppercase', marginBottom: '8px' }}>
                {businessName}
              </div>
              <div style={{ color: '#555', fontSize: '12px', lineHeight: '1.8' }}>
                <div><strong>RUC:</strong> {ruc}</div>
                <div>{address}</div>
                <div><strong>Telf:</strong> {phone}</div>
                {email && <div><strong>Email:</strong> {email}</div>}
              </div>
            </div>

            {/* Document box */}
            <div style={{
              border: `2px solid ${primaryColor}`,
              borderRadius: '8px',
              overflow: 'hidden',
              minWidth: '210px',
              textAlign: 'center',
            }}>
              <div style={{ backgroundColor: primaryColor, color: '#ffffff', padding: '10px 20px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {docLabel}
              </div>
              <div style={{ padding: '10px 20px' }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>{docTitle}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: primaryColor, letterSpacing: '1px' }}>
                  {data.documentNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Espaciado entre header y datos de cliente */}
          <div style={{ marginBottom: '20px' }} />

          {/* Client info */}
          <div style={{
            backgroundColor: '#f8f9fb',
            borderLeft: `4px solid ${accentColor}`,
            borderRadius: '4px',
            padding: '14px 18px',
            marginBottom: '24px',
            fontSize: '13px',
          }}>
            <div style={{ fontWeight: 'bold', color: primaryColor, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              Datos del Cliente
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <span style={{ color: '#777', marginRight: '6px' }}>Cliente:</span>
                <strong style={{ textTransform: 'uppercase' }}>{data.customerName || 'CLIENTE VARIOS'}</strong>
              </div>
              <div>
                <span style={{ color: '#777', marginRight: '6px' }}>Fecha:</span>
                <strong>{format(new Date(data.date), 'dd/MM/yyyy hh:mm a')}</strong>
              </div>
              {(customerDocument || data.customerPhone) && (
                <div>
                  <span style={{ color: '#777', marginRight: '6px' }}>{isFactura ? 'RUC:' : 'DNI:'}</span>
                  <strong>{customerDocument || data.customerPhone}</strong>
                </div>
              )}
              {customerAddress && customerAddress !== '-' && (
                <div>
                  <span style={{ color: '#777', marginRight: '6px' }}>Dirección:</span>
                  <strong style={{ textTransform: 'uppercase' }}>{customerAddress}</strong>
                </div>
              )}
              <div>
                <span style={{ color: '#777', marginRight: '6px' }}>Pago:</span>
                <strong>{paymentMethodLabels[data.paymentMethod || 'cash'] || 'Efectivo'}</strong>
              </div>
            </div>
          </div>

          {/* Items table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: primaryColor, color: '#ffffff' }}>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '6%', fontWeight: '600' }}>#</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>Descripción</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '10%', fontWeight: '600' }}>Cant.</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', width: '16%', fontWeight: '600' }}>P. Unit.</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', width: '16%', fontWeight: '600' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => {
                const unitPrice = item.customPrice ?? item.product.price;
                const lineTotal = unitPrice * item.quantity;
                return (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8f9fb', borderBottom: '1px solid #eeeeee' }}>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#888' }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px', textTransform: 'uppercase' }}>{item.product.name}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>S/ {unitPrice.toFixed(2)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600' }}>S/ {lineTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Bottom section: Son + Totals + QR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', marginBottom: '28px' }}>
            {/* Left: son + QR */}
            <div style={{ flex: 1 }}>
              <div style={{ backgroundColor: '#f8f9fb', borderRadius: '6px', padding: '12px 16px', fontSize: '12px', marginBottom: '16px' }}>
                <strong>SON:</strong> {totalFloor} CON {cents}/100 SOLES
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div>
                  <QRCodeSVG value={qrValue} size={90} />
                  <div style={{ fontSize: '9px', color: '#aaa', marginTop: '4px', textAlign: 'center' }}>Verificación</div>
                </div>
                <div style={{ fontSize: '10px', color: '#888', lineHeight: '1.8' }}>
                  <div>REPRESENTACIÓN IMPRESA DE LA</div>
                  <div style={{ fontWeight: 'bold' }}>{docTitle}</div>
                  <div>AUTORIZADO CON RES. N°034-005-0012997/SUNAT</div>
                  <div>CONSULTE EN: WWW.APISUNAT.PE</div>
                </div>
              </div>
            </div>

            {/* Right: totals */}
            <div style={{ minWidth: '230px' }}>
              <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #e0e0e0', fontSize: '13px' }}>
                  <span style={{ color: '#555' }}>Op. Gravada:</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #e0e0e0', fontSize: '13px' }}>
                  <span style={{ color: '#555' }}>IGV (18%):</span>
                  <span>S/ {igv.toFixed(2)}</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', padding: '14px 16px',
                  backgroundColor: primaryColor, color: '#ffffff', fontWeight: 'bold', fontSize: '15px',
                }}>
                  <span>TOTAL:</span>
                  <span>S/ {data.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#aaa', marginTop: 'auto' }}>
            <span>{businessName} — RUC: {ruc}</span>
            <span>Software: FerrePOS v1.0</span>
          </div>
        </div>

      </div>
    );
  }
);

A4Document.displayName = 'A4Document';
