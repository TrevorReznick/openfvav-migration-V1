# Piano di Miglioramento Copertura Test - Versione Corretta

## 📊 Stato Attuale della Copertura

```text
File                           | % Stmts | % Branch | % Funcs | % Lines
-------------------------------|---------|----------|---------|--------
config-loader.js              |   78.37 |    57.14 |     100 |  78.37
injector-engine.js            |   81.25 |    71.42 |     100 |  81.25
css-extractor.js              |       0 |        0 |       0 |      0
token-engine.js               |       0 |        0 |       0 |      0
token-hydrator.js             |       0 |        0 |       0 |      0
color-transformer.js          |       0 |        0 |       0 |      0
```

## 🎯 Obiettivi di Copertura

| Modulo | Copertura Attuale | Obiettivo | Priorità |
|--------|-------------------|-----------|----------|
| config-loader.js | 78.37% | 90%+ | Media |
| injector-engine.js | 81.25% | 90%+ | Media |
| css-extractor.js | 0% | 85%+ | Alta |
| token-engine.js | 0% | 90%+ | Alta |
| token-hydrator.js | 0% | 85%+ | Alta |
| color-transformer.js | 0% | 95%+ | Media |

## 🔧 Azioni Richieste

### 1. Allineamento Struttura Progetto

```bash
# 1. Spostamento file di injection
mkdir -p src/injectors
mv src/modules/injectors/inject-value.js src/injectors/injector-engine.js

# 2. Rinomina entry point
mv src/cli.js src/index.js

# 3. Crea struttura comandi
mkdir -p src/commands
# Spostare logica da cli.js a:
# - src/commands/hydrate.js
# - src/commands/validate.js
```

### 2. Test da Implementare (con Vitest)

#### token-engine.test.js (Alta Priorità)

```javascript
// tests/unit/core/token-engine.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenEngine } from '../../../src/core/token-engine.js';
import { Logger } from '../../../src/utils/logger.js';

describe('TokenEngine', () => {
  let engine;
  const mockConfig = {
    paths: { v4: './test-v4', v6: './test-v6' },
    options: { dryRun: false }
  };
  const mockLogger = new Logger();

  beforeEach(() => {
    engine = new TokenEngine(mockConfig, mockLogger);
  });

  it('should initialize with config and logger', () => {
    expect(engine.config).toEqual(mockConfig);
    expect(engine.logger).toBe(mockLogger);
  });

  it('should run full pipeline (extract → hydrate)', async () => {
    const mockTokens = { colors: { primary: '#3B82F6' } };
    
    // Mock extractTokensFromCss
    vi.spyOn(engine, 'extract').mockResolvedValue(mockTokens);
    vi.spyOn(engine, 'hydrate').mockResolvedValue({ changes: 1 });
    
    const result = await engine.run('v4', 'v6');
    
    expect(result.changes).toBe(1);
  });
});
```

#### token-hydrator.test.js (Alta Priorità)

```javascript
// tests/unit/modules/hydrators/token-hydrator.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hydrateTokens } from '../../src/modules/hydrators/token-hydrator.js';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('token-hydrator', () => {
  const TEST_DIR = './tests/fixtures/hydrator';
  
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    writeFileSync(join(TEST_DIR, 'tokens.ts'), `export const tokens = { colors: { // @inject:primary\nprimary: 'OLD' } } as const;`);
    writeFileSync(join(TEST_DIR, 'globals.css'), `:root { /* @inject:primary */\n--primary: OLD; }`);
  });
  
  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('should hydrate color tokens from extracted data', async () => {
    const tokens = { colors: { primary: '#3B82F6' }, spacing: {}, typography: {} };
    
    const result = await hydrateTokens(TEST_DIR, tokens);
    
    expect(result.changes).toBeGreaterThan(0);
    
    const updatedTokens = readFileSync(join(TEST_DIR, 'tokens.ts'), 'utf-8');
    expect(updatedTokens).toContain('primary: \'217 91% 60%\''); // Hex to HSL
  });
});
```

#### color-transformer.test.js (Media Priorità)

```javascript
// tests/unit/modules/transformers/color-transformer.test.js
import { describe, it, expect } from 'vitest';
import { toPureHsl } from '../../../src/modules/transformers/color-transformer.js';

describe('toPureHsl', () => {
  it('should return HSL as-is if already in correct format', () => {
    expect(toPureHsl('262 83% 58%')).toBe('262 83% 58%');
  });

  it('should convert HEX to HSL', () => {
    expect(toPureHsl('#3B82F6')).toBe('217 91% 60%');
    expect(toPureHsl('#0F172A')).toBe('222 47% 11%');
  });

  it('should handle shorthand HEX', () => {
    expect(toPureHsl('#FFF')).toBe('0 0% 100%');
  });

  it('should return fallback for invalid colors', () => {
    expect(toPureHsl('invalid')).toBe('0 0% 0%');
    expect(toPureHsl('')).toBe('0 0% 0%');
  });
});
```

### 3. Configurazione PostCSS (Nota Importante)

Il plugin PostCSS è già integrato in css-extractor.js per mantenere la codebase pulita. Non serve un file separato a meno che non debba essere riutilizzato in altri progetti.

### 4. Aggiornamento package.json

```json
{
  "main": "src/index.js",
  "bin": {
    "openfav-migrate": "./src/index.js"
  },
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "lint": "eslint src/**/*.js"
  }
}
```

## 📅 Piano di Esecuzione (Stimato: 2 ore)

### Fase 1: Allineamento (10 min)

- [ ] Spostare file di injection
- [ ] Rinominare entry point
- [ ] Creare struttura commands

### Fase 2: Test Implementation (60 min)

- [ ] Scrivere test token-engine (15 min)
- [ ] Scrivere test token-hydrator (15 min)
- [ ] Scrivere test logger (10 min)
- [ ] Eseguire suite completa (5 min)
- [ ] Fix eventuali fallimenti (15 min)

### Fase 3: Verifica (10 min)

- [ ] Coverage report
- [ ] Test di integrazione CLI
- [ ] Commit e tag v2.0.0

### Fase 4: Documentazione (20 min)

- [ ] Aggiornare README
- [ ] Scrivere CHANGELOG
- [ ] Tag v2.0.0

## 📝 Note Importanti

### Framework di Test

Il progetto utilizza **Vitest**, non Jest. Tutti gli esempi di test devono usare:

- `import { describe, it, expect, vi } from 'vitest'`
- `vi.fn()` per mocking (non `jest.fn()`)
- `vi.spyOn()` per spying
- Path completi con estensione `.js` (ESM)

### Struttura File

- **Entry point**: `src/index.js` (rinominato da cli.js)
- **Comandi CLI**: Spostare in `src/commands/hydrate.js` e `src/commands/validate.js`
- **Injectors**: Spostare in `src/injectors/injector-engine.js`
- Tutti i moduli usano ES Modules (`.js` con `"type": "module"`)

### Plugin PostCSS

Il plugin PostCSS è inline in `css-extractor.js` per mantenere la codebase pulita e monolitica. Se necessario in futuro, può essere estratto in un file separato.

## 🎯 Obiettivi Finali

- **Copertura test**: 85%+
- **Test passanti**: 100%
- **Codice documentato**: JSDoc su funzioni pubbliche
- **CLI funzionante**: Comandi `hydrate`, `validate`, `setup`
- **Release**: v2.0.0 pronta per produzione
