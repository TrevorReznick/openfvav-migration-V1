import { readFileSync, writeFileSync, existsSync } from 'fs';
import chalk from 'chalk';

/**
 * Inietta un valore in un file basandosi sul tag @inject:key
 * Versione TOLERANT: gestisce tag con o senza trattini iniziali
 * @param {string} filePath - Percorso del file
 * @param {string} key - Chiave del token (es: 'primary')
 * @param {string} value - Valore da iniettare
 * @param {boolean} dryRun - Se true, NON modifica il file
 * @returns {boolean} - true se l'iniezione è riuscita
 */
export function injectValue(filePath, key, value, dryRun = false) {
  try {
    if (!existsSync(filePath)) {
      console.warn(chalk.yellow(`⚠️  File non trovato: ${filePath}`));
      return false;
    }

    const content = readFileSync(filePath, 'utf-8');

    // Regex TOLERANT: gestisce sia @inject:primary che @inject:--primary
    // [\\s\\S]*? cerca qualsiasi cosa (spazi, commenti) tra il tag e la variabile
    const regex = new RegExp(`(@inject:(-*)?${key}[\\s\\S]*?)([\\w-]+\\s*:\\s*['"]?)([^;'",\\r\\n]+)(['"]?\\s*[;,]?)`, 'i');

    if (!content.match(regex)) {
      return false;
    }

    if (dryRun) return true; // Simulazione

    // Sanitize the value to remove any existing quotes to prevent double quotes
    const sanitizeValue = (val) => {
      // For typography values (font families), we need special handling
      // CSS font-family values like "'Inter', system-ui, sans-serif" should become "Inter, system-ui, sans-serif"
      // Remove ALL quotes from the value since they will be added back by the template
      return val
        .trim()
        .replace(/['"]/g, '')           // Remove ALL quotes
        .replace(/\s+/g, ' ')          // Normalize whitespace
        .trim();
    };

    const cleanValue = sanitizeValue(value);
    const newContent = content.replace(regex, `$1$3${cleanValue}$5`);
    writeFileSync(filePath, newContent);
    return true;

  } catch (error) {
    console.error(chalk.red(`❌ Errore iniezione: ${error.message}`));
    return false;
  }
}
