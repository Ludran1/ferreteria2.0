import { BusinessInfo } from '@/types';

// Información del negocio - en el futuro esto puede venir de la base de datos
export const businessInfo: BusinessInfo = {
  name: 'Ferretería El Martillo',
  rfc: 'FEM123456789',
  address: 'Av. Principal 123, Col. Centro, CP 12345',
  phone: '555-123-4567',
  email: 'contacto@ferreteria.com',
};

export const printTerms = {
  quote: {
    validity: '15 días',
    paymentTerms: [
      '50% anticipo, 50% contra entrega',
      'Efectivo, tarjeta o transferencia',
    ],
    conditions: [
      'Precios sujetos a cambio sin previo aviso',
      'Productos sujetos a disponibilidad',
      'Esta cotización no es un documento fiscal',
    ],
  },
  sale: {
    warranty: 'Garantía de fábrica según el producto',
    returnPolicy: 'Cambios y devoluciones dentro de los primeros 15 días con ticket de compra',
    notes: [
      'Conserve su ticket para cualquier aclaración',
      'Gracias por su preferencia',
    ],
  },
};
