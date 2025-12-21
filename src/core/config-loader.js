import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import chalk from 'chalk';

// Schema di validazione per migration.config.json
const ConfigSchema = z.object({
  version: z.string(),
  paths: z.object({
    v4: z.string().min(1),
    v6: z.string().min(1),
    v3: z.string().optional(),
  }),
  options: z.object({
    dryRun: z.boolean().default(false),
    outputFormat: z.enum(['ts', 'js', 'json']).default('ts'),
  })
});

export function loadConfig() {
  const CONFIG_PATH = join(process.cwd(), 'migration.config.json');

  if (!existsSync(CONFIG_PATH)) {
    throw new Error(`Configurazione non trovata in ${CONFIG_PATH}. Esegui 'setup' prima.`);
  }

  try {
    const rawConfig = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    const validated = ConfigSchema.parse(rawConfig);
    
    // Verifica fisica dei percorsi
    if (!existsSync(validated.paths.v4)) throw new Error(`Path V4 non trovato: ${validated.paths.v4}`);
    if (!existsSync(validated.paths.v6)) throw new Error(`Path V6 non trovato: ${validated.paths.v6}`);

    return validated;
  } catch (error) {
    console.error(chalk.red('❌ Errore nel caricamento della configurazione:'));
    if (error instanceof z.ZodError) {
      console.error(error.errors);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}
