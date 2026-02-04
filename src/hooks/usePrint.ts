import { useCallback, useRef } from 'react';

export function usePrint() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Por favor permite ventanas emergentes para imprimir');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Documento - FerrePOS</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #000;
              background: #fff;
            }
            .print-document {
              max-width: 800px;
              margin: 0 auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 8px;
              text-align: left;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-2xl { font-size: 1.5rem; }
            .text-xl { font-size: 1.25rem; }
            .text-lg { font-size: 1.125rem; }
            .text-sm { font-size: 0.875rem; }
            .text-xs { font-size: 0.75rem; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .italic { font-style: italic; }
            .text-gray-900 { color: #111827; }
            .text-gray-800 { color: #1f2937; }
            .text-gray-700 { color: #374151; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-500 { color: #6b7280; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .border-b { border-bottom: 1px solid #d1d5db; }
            .border-b-2 { border-bottom: 2px solid; }
            .border-t { border-top: 1px solid #d1d5db; }
            .border-t-2 { border-top: 2px solid; }
            .border-gray-800 { border-color: #1f2937; }
            .border-gray-300 { border-color: #d1d5db; }
            .border-gray-200 { border-color: #e5e7eb; }
            .rounded-lg { border-radius: 0.5rem; }
            .p-4 { padding: 1rem; }
            .p-8 { padding: 2rem; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
            .pb-4 { padding-bottom: 1rem; }
            .pt-4 { padding-top: 1rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-3 { margin-top: 0.75rem; }
            .mt-6 { margin-top: 1.5rem; }
            .mt-8 { margin-top: 2rem; }
            .ml-2 { margin-left: 0.5rem; }
            .w-20 { width: 5rem; }
            .w-28 { width: 7rem; }
            .w-64 { width: 16rem; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-end { justify-content: flex-end; }
            .items-start { align-items: flex-start; }
            .list-disc { list-style-type: disc; }
            .list-inside { list-style-position: inside; }
            
            @media print {
              body { padding: 0; }
              .print-document { max-width: 100%; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }, []);

  return { printRef, handlePrint, print: handlePrint };
}
