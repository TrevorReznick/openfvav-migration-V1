import { readFileSync, writeFileSync, existsSync } from 'fs';

export function injectValue(filePath, key, value, dryRun = false) {
  try {
    if (!existsSync(filePath)) return false;
    const content = readFileSync(filePath, 'utf-8');

    // Regex ultra-flessibile per catturare tag e variabile (supporta apici e trattini)
    const regex = new RegExp(`(@inject:[-]*${key}.*?[\\r\\n]+\\s*)(['"]?[\\w-]+['"]?\\s*:\\s*)(['"]?[^;'",\\r\\n]+['"]?)(\\s*[;,]?)`, 'i');

    if (!content.match(regex)) return false;

    // Se siamo in DRY RUN, simuliamo il successo senza scrivere
    if (dryRun === true || dryRun === 'true') return true;

    // Pulizia e quoting automatico per TS/JS
    const cleanValue = String(value).replace(/['"]/g, '').trim();
    const quote = filePath.endsWith('.css') ? '' : "'";
    const newValue = `${quote}${cleanValue}${quote}`;

    const updatedContent = content.replace(regex, `$1$2${newValue}$4`);
    
    // SCRITTURA FISICA SUL DISCO
    writeFileSync(filePath, updatedContent);
    return true;

  } catch (error) {
    console.error(`❌ Errore iniezione in ${filePath}: ${error.message}`);
    return false;
  }
}