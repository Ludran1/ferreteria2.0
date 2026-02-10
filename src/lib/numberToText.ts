
export function numberToText(amount: number): string {
  const enteros = Math.floor(amount);
  const centimos = Math.round((amount - enteros) * 100);
  
  const centimosStr = centimos.toString().padStart(2, '0');
  const letras = convertirNumeroALetras(enteros);
  
  return `SON: ${letras} CON ${centimosStr}/100 SOLES`;
}

function convertirNumeroALetras(num: number): string {
  if (num === 0) return "CERO";
  
  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const diez_veinte = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
  const veinte_treinta = ["VEINTE", "VEINTIUNO", "VEINTIDOS", "VEINTITRES", "VEINTICUATRO", "VEINTICINCO", "VEINTISEIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"];
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  if (num < 10) return unidades[num];
  
  if (num >= 10 && num < 20) return diez_veinte[num - 10];
  if (num >= 20 && num < 30) return veinte_treinta[num - 20];
  
  if (num >= 30 && num < 100) {
    const dec = Math.floor(num / 10);
    const uni = num % 10;
    return decenas[dec] + (uni > 0 ? " Y " + unidades[uni] : "");
  }
  
  if (num === 100) return "CIEN";
  
  if (num > 100 && num < 1000) {
    const cent = Math.floor(num / 100);
    const resto = num % 100;
    return centenas[cent] + (resto > 0 ? " " + convertirNumeroALetras(resto) : "");
  }
  
  if (num >= 1000 && num < 1000000) {
    const miles = Math.floor(num / 1000);
    const resto = num % 1000;
    const milesStr = miles === 1 ? "MIL" : convertirNumeroALetras(miles) + " MIL";
    return milesStr + (resto > 0 ? " " + convertirNumeroALetras(resto) : "");
  }
  
  if (num >= 1000000) {
      // Simplified for higher numbers
      return "MILLONES..."; 
  }

  return "";
}
