import { readFileSync, writeFileSync, existsSync } from 'fs';
import chalk from 'chalk';

/**
 * Inietta un valore in un file basandosi sul tag @inject:key
 * @param {string} filePath - Percorso del file
 * @param {string} key - Chiave del token (es: 'primary' o 'spacing-1')
 * @param {string} value - Valore da iniettare
 * @param {boolean} dryRun - Se true, NON modifica il file
 * @returns {boolean} - true se l'iniezione è riuscita, false se il tag non è stato trovato
 */
export function injectValue(filePath, key, value, dryRun = false) {
  if (!existsSync(filePath)) {
    console.warn(chalk.yellow(`⚠️  File not found: ${filePath}`));
    return false;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Regex per trovare il tag @inject e il valore nella riga successiva
    const regex = new RegExp(`(@inject:${key}.*?[\\r\\n]+\\s*)([\\w-]+\\s*:\\s*['"]?)([^;'",\\r\\n]+)(['"]?\\s*[;,]?)`, 'g');
    
    if (!content.match(regex)) {
      return false;
    }

    // Se siamo in dryRun, NON eseguiamo la sostituzione né la scrittura
    if (dryRun === true || dryRun === 'true') {
      return true; // Match trovato, operazione simulata con successo
    }

    const newContent = content.replace(regex, `$1$2${value}$4`);
    writeFileSync(filePath, newContent);
  
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Errore durante l'iniezione in ${filePath}:`), error);
    return false;
  }
}
