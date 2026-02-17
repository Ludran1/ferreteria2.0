/**
 * API SUNAT Service - Facturación Electrónica
 * Integración con https://docs.apisunat.pe
 */

const APISUNAT_TOKEN = import.meta.env.VITE_APISUNAT_TOKEN || '';
const APISUNAT_ENV = import.meta.env.VITE_APISUNAT_ENV || 'sandbox';

const BASE_URL = APISUNAT_ENV === 'production'
  ? 'https://app.apisunat.pe'
  : 'https://sandbox.apisunat.pe';

const ENDPOINT = `${BASE_URL}/api/v3/documents`;

export const ANONYMOUS_CLIENT = {
  // Para boletas sin cliente específico (menores a S/ 700 o configuración general)
  tipo_de_documento: '1',
  numero_de_documento: '99999999',
  denominacion: 'CLIENTE VARIOS',
  direccion: '-'
} as const;

// Types
export interface SunatItem {
  unidad_de_medida: string;
  descripcion: string;
  cantidad: string;
  valor_unitario: string; // precio sin IGV, 6 decimales recomendado
  porcentaje_igv: string;
  codigo_tipo_afectacion_igv: string;
  nombre_tributo: string;
}

export interface SunatDocumentRequest {
  documento: 'boleta' | 'factura';
  serie: string;
  numero: number;
  fecha_de_emision: string; // YYYY-MM-DD
  fecha_de_vencimiento?: string; // YYYY-MM-DD
  hora_de_emision?: string; // HH:mm:ss
  moneda: string;
  tipo_operacion: string;
  cliente_tipo_de_documento: string; // "1" = DNI, "6" = RUC
  cliente_numero_de_documento: string;
  cliente_denominacion: string;
  cliente_direccion?: string;
  items: SunatItem[];
  total: string;
}

export interface SunatResponse {
  success: boolean;
  message: string;
  payload?: {
    estado: 'ACEPTADO' | 'PENDIENTE' | 'RECHAZADO';
    hash: string;
    xml: string;
    cdr: string | null;
    pdf: {
      ticket: string;
      a4?: string;
    };
  };
}

/**
 * Builds a SUNAT item from a cart item.
 * valor_unitario must be the price WITHOUT IGV (18%).
 */
export function buildSunatItem(
  name: string,
  quantity: number,
  priceWithIgv: number
): SunatItem {
  // Price with IGV → price without IGV
  const valorUnitario = priceWithIgv / 1.18;

  return {
    unidad_de_medida: 'NIU', // Unidad (nacional)
    descripcion: name,
    cantidad: quantity.toString(),
    valor_unitario: valorUnitario.toFixed(6),
    porcentaje_igv: '18',
    codigo_tipo_afectacion_igv: '10', // Gravado - Operación Onerosa
    nombre_tributo: 'IGV',
  };
}

/**
 * Builds the full document request body.
 */
export function buildDocumentRequest(params: {
  documentType: 'boleta' | 'factura';
  serie: string;
  numero: number;
  customerDocType: '1' | '6'; // 1=DNI, 6=RUC
  customerDocNumber: string;
  customerName: string;
  customerAddress?: string;
  items: { name: string; quantity: number; priceWithIgv: number }[];
  total: number;
}): SunatDocumentRequest {
  const now = new Date();
  const fecha = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const hora = now.toTimeString().split(' ')[0]; // HH:mm:ss

  return {
    documento: params.documentType,
    serie: params.serie,
    numero: params.numero,
    fecha_de_emision: fecha,
    hora_de_emision: hora,
    fecha_de_vencimiento: fecha, // Para venta al contado, misma fecha
    moneda: 'PEN',
    tipo_operacion: '0101', // Venta interna
    cliente_tipo_de_documento: params.customerDocType,
    cliente_numero_de_documento: params.customerDocNumber,
    cliente_denominacion: params.customerName,
    cliente_direccion: params.customerAddress || '-',
    items: params.items.map((item) =>
      buildSunatItem(item.name, item.quantity, item.priceWithIgv)
    ),
    total: params.total.toFixed(2),
  };
}

/**
 * Emit a document (boleta or factura) via the API SUNAT.
 * Auto-retries with incremented numero if the number was already used.
 * Returns the response AND the final numero used.
 */
export async function emitirComprobante(
  body: SunatDocumentRequest
): Promise<SunatResponse & { finalNumero: number }> {
  if (!APISUNAT_TOKEN) {
    throw new Error('VITE_APISUNAT_TOKEN no está configurado en el archivo .env');
  }

  let currentNumero = body.numero;
  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const requestBody = { ...body, numero: currentNumero };

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APISUNAT_TOKEN}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data: SunatResponse = await response.json();

    // If the number was already used, increment and retry
    if (!data.success && data.message?.includes('fue emitido anteriormente')) {
      console.warn(`Numero ${currentNumero} already used, trying ${currentNumero + 1}...`);
      currentNumero++;
      continue;
    }

    return { ...data, finalNumero: currentNumero };
  }

  throw new Error(`No se pudo emitir después de ${MAX_RETRIES} intentos. Último numero: ${currentNumero}`);
}

// --- Consultas DNI / RUC ---

export interface DniResponse {
  numero: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
}

export interface RucResponse {
  numero: string;
  razonSocial: string;
  estado: string;
  condicion: string;
  direccion: string;
  ubigeo: string;
  distrito: string;
  provincia: string;
  departamento: string;
}

export async function consultarDni(dni: string): Promise<DniResponse | null> {
  if (dni.length !== 8) return null;
  const token = import.meta.env.VITE_APISUNAT_TOKEN || ''; 

  try {
    // 1. Try APISUNAT official endpoint (User provided)
    // Endpoint: /api/v1/person/dni/{dni}
    const response = await fetch(`${BASE_URL}/api/v1/person/dni/${dni}`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
        const data = await response.json();
        if (data.success && data.payload) {
             const p = data.payload;
             return {
                 numero: p.dni,
                 nombres: p.nombres,
                 apellidoPaterno: p.apellido_paterno,
                 apellidoMaterno: p.apellido_materno,
                 nombre: `${p.nombres} ${p.apellido_paterno} ${p.apellido_materno}`.trim()
             };
        }
    }
    throw new Error('APISUNAT DNI lookup failed');
  } catch (error) {
    console.warn('Error al consultar DNI (APISUNAT), intentando fallback:', error);
    try {
      // 2. Fallback: Proxy
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const targetUrl = `https://api.apis.net.pe/v1/dni?numero=${dni}`;
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      if (response.ok) return await response.json();
    } catch (proxyError) {
      console.error('Proxy failed:', proxyError);
    }
    return null;
  }
}

export async function consultarRuc(ruc: string): Promise<RucResponse | null> {
  if (ruc.length !== 11) return null;
  const token = import.meta.env.VITE_APISUNAT_TOKEN || '';

  try {
    // 1. Try APISUNAT endpoint (User provided)
    // Snippet: GET https://dev.apisunat.pe/api/v1/business/ruc/{RUC}
    // Using BASE_URL which is likely sandbox/app
    const response = await fetch(`${BASE_URL}/api/v1/business/ruc/${ruc}`, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
        const data = await response.json();
        if (data.success && data.payload) {
             return {
                 numero: data.payload.ruc,
                 razonSocial: data.payload.razon_social,
                 estado: data.payload.estado,
                 condicion: data.payload.condicion,
                 direccion: data.payload.direccion_fiscal,
                 ubigeo: '',
                 distrito: '',
                 provincia: '',
                 departamento: ''
             };
        }
    }
    
    throw new Error('APISUNAT lookup failed, trying fallback');
  } catch (error) {
    console.warn('Error al consultar RUC (APISUNAT), intentando fallback:', error);
    
    // 2. Fallback: Old method (apis.net.pe V1 with Proxy)
    try {
       // Direct V1 first
       const v1Url = `https://api.apis.net.pe/v1/ruc?numero=${ruc}`;
       let res = await fetch(v1Url);
       if (res.ok) return await res.json();
       
       // Proxy if CORS blocked
       const proxyUrl = 'https://api.allorigins.win/raw?url=';
       res = await fetch(proxyUrl + encodeURIComponent(v1Url));
       if (res.ok) return await res.json();
    } catch (fallbackError) {
       console.error('Fallback RUC lookup failed:', fallbackError);
    }
    return null;
  }
}
