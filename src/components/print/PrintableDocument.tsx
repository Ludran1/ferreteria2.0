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
};

export const PrintableDocument = forwardRef<HTMLDivElement, PrintableDocumentProps>(
  ({ data }, ref) => {
    const isQuote = data.type === 'quote';
    const terms = isQuote ? printTerms.quote : printTerms.sale;

    return (
      <div
        ref={ref}
        className="print-document bg-white text-black p-8 max-w-[800px] mx-auto"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{businessInfo.name}</h1>
            <p className="text-sm text-gray-600 mt-1">{businessInfo.address}</p>
            <p className="text-sm text-gray-600">Tel: {businessInfo.phone}</p>
            <p className="text-sm text-gray-600">{businessInfo.email}</p>
            <p className="text-sm text-gray-600">RFC: {businessInfo.rfc}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">
              {isQuote ? 'COTIZACIÓN' : 'NOTA DE VENTA'}
            </h2>
            <p className="text-lg font-semibold text-gray-700 mt-1">
              {data.documentNumber}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Fecha: {format(data.date, "dd 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
            <p className="text-sm text-gray-600">
              Hora: {format(data.date, 'HH:mm', { locale: es })}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">Datos del Cliente</h3>
          <p className="text-gray-700">
            <span className="font-medium">Nombre:</span> {data.customerName}
          </p>
          {data.customerPhone && (
            <p className="text-gray-700">
              <span className="font-medium">Teléfono:</span> {data.customerPhone}
            </p>
          )}
          {data.paymentMethod && (
            <p className="text-gray-700">
              <span className="font-medium">Forma de Pago:</span>{' '}
              {paymentMethodLabels[data.paymentMethod]}
            </p>
          )}
        </div>

        {/* Products Table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="py-2 text-left text-sm font-semibold text-gray-800">
                Descripción
              </th>
              <th className="py-2 text-center text-sm font-semibold text-gray-800 w-20">
                Cant.
              </th>
              <th className="py-2 text-right text-sm font-semibold text-gray-800 w-28">
                P. Unit.
              </th>
              <th className="py-2 text-right text-sm font-semibold text-gray-800 w-28">
                Importe
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => {
              const unitPrice = item.customPrice ?? item.product.price;
              const lineTotal = unitPrice * item.quantity;
              return (
                <tr key={index} className="border-b border-gray-300">
                  <td className="py-3">
                    <p className="font-medium text-gray-800">{item.product.name}</p>
                    <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                  </td>
                  <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-700">
                    ${unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right font-medium text-gray-800">
                    ${lineTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-64">
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">
                ${data.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600">IVA (16%):</span>
              <span className="font-medium">
                ${data.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-gray-800 mt-2">
              <span className="text-lg font-bold text-gray-900">TOTAL:</span>
              <span className="text-lg font-bold text-gray-900">
                ${data.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="border-t-2 border-gray-300 pt-4 mt-6">
          {isQuote ? (
            <>
              <h4 className="font-semibold text-gray-800 mb-2">
                Términos y Condiciones
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Vigencia:</strong> {(terms as typeof printTerms.quote).validity}
                </p>
                <p>
                  <strong>Condiciones de pago:</strong>
                </p>
                <ul className="list-disc list-inside ml-2">
                  {(terms as typeof printTerms.quote).paymentTerms.map((term, i) => (
                    <li key={i}>{term}</li>
                  ))}
                </ul>
                <p className="mt-2">
                  <strong>Notas:</strong>
                </p>
                <ul className="list-disc list-inside ml-2">
                  {(terms as typeof printTerms.quote).conditions.map((condition, i) => (
                    <li key={i}>{condition}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              <h4 className="font-semibold text-gray-800 mb-2">
                Información Importante
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Garantía:</strong> {(terms as typeof printTerms.sale).warranty}
                </p>
                <p>
                  <strong>Cambios y devoluciones:</strong>{' '}
                  {(terms as typeof printTerms.sale).returnPolicy}
                </p>
                <div className="mt-3 text-center italic">
                  {(terms as typeof printTerms.sale).notes.map((note, i) => (
                    <p key={i}>{note}</p>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>{businessInfo.name} • {businessInfo.phone} • {businessInfo.email}</p>
        </div>
      </div>
    );
  }
);

PrintableDocument.displayName = 'PrintableDocument';
