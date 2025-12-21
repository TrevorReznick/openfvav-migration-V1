/**
 * Converte qualsiasi colore (Hex, RGB) in una stringa HSL pura: "H S% L%"
 * Ottimizzato per l'iniezione in variabili CSS V6.
 */
export function toPureHsl(colorStr) {
  if (!colorStr) return '0 0% 0%';

  // Se è già un formato HSL "262 83% 58%", lo puliamo e lo restituiamo
  if (/^\d+\s+\d+%\s+\d+%/.test(colorStr)) return colorStr.trim();

  // Qui usiamo una logica semplificata (puoi integrare librerie come 'color' se necessario)
  // Per ora gestiamo il caso più comune di migrazione: HEX
  if (colorStr.startsWith('#')) {
    return hexToHsl(colorStr);
  }

  // Fallback se non riconosciuto
  return colorStr; 
}

function hexToHsl(hex) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  
  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
