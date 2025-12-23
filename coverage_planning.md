# Piano di Miglioramento Copertura Test

## 📊 Stato Attuale della Copertura

```
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

| Modulo                  | Copertura Attuale | Obiettivo | Priorità |
|-------------------------|------------------|-----------|-----------|
| config-loader.js       | 78.37%          | 90%+      | Media     |
| injector-engine.js     | 81.25%          | 90%+      | Media     |
| css-extractor.js       | 0%              | 85%+      | Alta      |
| token-engine.js        | 0%              | 90%+      | Alta      |
| token-hydrator.js      | 0%              | 85%+      | Alta      |
| color-transformer.js   | 0%              | 95%+      | Media     |

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

### 2. Test da Implementare

#### `token-engine.test.js` (Alta Priorità)
```javascript
import { TokenEngine } from '../core/token-engine';
import { jest } from '@jest/globals';

describe('TokenEngine', () => {
  let engine;
  const mockConfig = { /* ... */ };
  const mockLogger = { /* ... */ };

  beforeEach(() => {
    engine = new TokenEngine(mockConfig, mockLogger);
  });

  test('should initialize with config', () => {
    expect(engine.config).toEqual(mockConfig);
  });

  test('should run full pipeline', async () => {
    await engine.run();
    // Verifica chiamate a extract, transform, hydrate
  });
});
```

#### `token-hydrator.test.js` (Alta Priorità)
```javascript
import { TokenHydrator } from '../modules/hydrators/token-hydrator';

describe('TokenHydrator', () => {
  let hydrator;
  
  beforeEach(() => {
    hydrator = new TokenHydrator();
  });

  test('should hydrate color tokens', () => {
    const tokens = { colors: { primary: '#3B82F6' } };
    const result = hydrator.hydrate(tokens);
    expect(result).toHaveProperty('colors.primary');
  });
});
```

#### `color-transformer.test.js` (Media Priorità)
```javascript
import { transformColor } from '../transformers/color-transformer';

describe('ColorTransformer', () => {
  test('should transform HEX to HSL', () => {
    const hsl = transformColor('#3B82F6');
    expect(hsl).toMatch(/hsl\(\d{1,3}, \d{1,3}%, \d{1,3}%\)/);
  });
});
```

### 3. Configurazione PostCSS

Creare `/src/modules/extractors/postcss-extractor.cjs`:

```javascript
module.exports = (opts = {}) => {
  return {
    postcssPlugin: 'extract-tokens',
    Once(root, { result }) {
      // Logica di estrazione token
    }
  };
};
```

### 4. Aggiornamento package.json

```json
{
  "main": "src/index.js",
  "bin": {
    "openfav-migrate": "./src/index.js"
  },
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest"
  }
}
```

## 📅 Piano di Esecuzione

1. **Settimana 1**: Allineamento struttura e test base
   - [ ] Spostamento file di injection
   - [ ] Creazione test token-engine
   - [ ] Aggiornamento configurazione

2. **Settimana 2**: Implementazione test mancanti
   - [ ] Test token-hydrator
   - [ ] Test color-transformer
   - [ ] Test integrazione completi

3. **Settimana 3**: Verifica e rilascio
   - [ ] Verifica copertura 85%+
   - [ ] Documentazione aggiornata
   - [ ] Rilascio v2.0.0

## 📝 Note Aggiuntive

- I test di integrazione dovrebbero coprire il flusso completo
- Utilizzare mock per le dipendenze esterne
- Mantenere i test isolati e indipendenti
- Aggiungere test per casi limite ed errori
