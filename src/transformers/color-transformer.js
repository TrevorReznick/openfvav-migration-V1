/**
 * Converte qualsiasi colore (Hex, RGB) in stringa "H S% L%" per V6.
 * Ottimizzato per l'iniezione in variabili CSS V6.
 */
export function toPureHsl(colorStr) {
  if (!colorStr) return '0 0% 0%';

  const s = colorStr.trim().toLowerCase();

  // 1. Già nel formato corretto "262 83% 58%"
  if (/^\d+\s+\d+%\s+\d+%/.test(s)) return s;

  // 2. Formato HEX
  if (s.startsWith('#')) {
    return hexToHsl(s);
  }

  // 3. Formato RGB(A)
  if (s.startsWith('rgb')) {
    return rgbToHsl(s);
  }

  return '0 0% 0%'; // Fallback per valori non riconosciuti
}

function hexToHsl(hex) {
  let r = 0, g = 0, b = 0;
  // Gestione shorthand #FFF
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
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

function rgbToHsl(rgbStr) {
  const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '0 0% 0%';
  
  let r = parseInt(match[1]) / 255;
  let g = parseInt(match[2]) / 255;
  let b = parseInt(match[3]) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
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
