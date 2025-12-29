# Dettagli del Progetto OpenFav Migration

## 📁 Struttura del Progetto (Percorso: `/Users/default/Sviluppo/Nodejs/projects/openfav-migration/migration-dev-V1/`)

```
.
├── 📁 src/                                     # Codice sorgente principale
│   │
│   ├── 📁 core/                               # Componenti core del sistema
│   │   ├── config-loader.js                  # Caricamento e validazione configurazione
│   │   └── token-engine.js                   # Gestione del ciclo di vita dei token
│   │
│   ├── 📁 injectors/                         # Sistema di iniezione token
│   │   └── injector-engine.js                # Motore di iniezione nei file sorgente
│   │
│   ├── 📁 modules/                           # Moduli funzionali
│   │   │
│   │   ├── 📁 extractors/                    # Estrattori di token
│   │   │   ├── css-extractor.js             # Estrazione token da file CSS/SCSS
│   │   │   ├── postcss-extractor.cjs        # Plugin PostCSS (CommonJS per compatibilità)
│   │   │   └── postcss-extractor.mjs        # Plugin PostCSS (ES Modules)
│   │   │
│   │   └── 📁 hydrators/                     # Sistema di idratazione token
│   │       └── token-hydrator.js            # Trasformazione dei token grezzi
│   │
│   ├── 📁 transformers/                      # Trasformatori di token
│   │   └── color-transformer.js             # Conversione formati colore
│   │
│   ├── 📁 utils/                             # Utility condivise
│   │   └── logger.js                        # Sistema di logging strutturato
│   │
│   └── index.js                             # Punto di ingresso principale
│
├── 📁 tests/                                 # Suite di test
│   │
│   ├── 📁 fixtures/                         # Dati di test
│   │   └── v4-extractor/                   # File CSS di esempio per i test
│   │       └── src/
│   │           └── tokens.css              # File CSS con token di esempio
│   │
│   ├── 📁 integration/                     # Test di integrazione
│   │   └── full-pipeline.test.js           # Test end-to-end del flusso completo
│   │
│   └── 📁 unit/                            # Test unitari
│       │
│       ├── 📁 core/
│       │   ├── config-loader.test.js       # Test per il caricamento configurazione
│       │   └── token-engine.test.js        # Test per il motore dei token
│       │
│       ├── 📁 extractors/
│       │   ├── css-extractor.test.js       # Test per l'estrazione CSS
│       │   └── postcss-extractor.cjs       # Mock per i test di estrazione
│       │
│       └── 📁 injectors/
│           └── injector-engine.test.js     # Test per l'iniezione token
│
├── 📄 .gitignore                            # File esclusi dal controllo versione
├── 📄 CHANGELOG.md                         # Storico delle modifiche (Keep a Changelog)
├── 📄 package.json                         # Configurazione progetto e dipendenze
├── 📄 package-lock.json                    # Blocco versioni dipendenze
└── 📄 README.md                            # Documentazione principale
```

## 🛠️ Dipendenze Principali

### Core
- **Node.js** (v14+): Ambiente di esecuzione
- **PostCSS** (^8.4.0): Elaborazione e trasformazione CSS
- **Zod** (^3.0.0): Validazione degli schemi di configurazione

### Sviluppo
- **Vitest** (^0.25.0): Framework di testing
- **ESLint** (^8.0.0): Linting del codice
- **Prettier** (^2.0.0): Formattazione del codice

### Utility
- **Chalk** (^5.0.0): Stilizzazione dell'output a terminale
- **Glob** (^8.0.0): Ricerca di file con pattern
- **fs-extra** (^10.0.0): Operazioni avanzate sul filesystem
- **path** (Node.js core): Gestione dei percorsi

### Build & Bundle
- **Vite** (^3.0.0): Bundling e sviluppo
- **@vitejs/plugin-vue** (^3.0.0): Supporto Vue.js

## 📊 Metriche del Progetto

- **Linee di codice**: ~1,500 (esclusi node_modules e test)
- **Test**: 9 test (4 suite)
- **Copertura test**: ~80% (variabile per modulo)
- **Dipendenti diretti**: 15+ pacchetti
- **Dipendenti indiretti**: 150+ pacchetti

## 🔍 Struttura Dettagliata File

### `src/core/`
- `config-loader.js`: Carica e valida la configurazione da `migration.config.js`
- `token-engine.js`: Coordina il flusso di estrazione e trasformazione token

### `src/modules/extractors/`
- `css-extractor.js`: Implementa l'estrazione token da file CSS/SCSS
- `postcss-extractor.mjs`: Plugin PostCSS per l'analisi CSS

### `tests/`
- `fixtures/`: Contiene file CSS di esempio per i test
- `integration/`: Test end-to-end del flusso completo
- `unit/`: Test unitari per singoli moduli

## 🚀 Script NPM

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "format": "prettier --write ."
  }
}
```

## 📌 Note di Sviluppo

1. **Formattazione**: Il progetto utilizza Prettier per la formattazione
2. **Linting**: ESLint è configurato con regole consigliate
3. **Testing**: I test vanno eseguiti prima di ogni commit
4. **Versioning**: Seguire il versionamento semantico (SemVer)
5. **Documentazione**: Aggiornare il CHANGELOG.md ad ogni rilascio

## Script Disponibili

- `npm test`: Esegue i test
- `npm run test:coverage`: Esegue i test con report di copertura
- `npm run test:watch`: Esegue i test in modalità watch

## Copertura dei Test

La copertura attuale dei test è la seguente:

- `src/core/config-loader.js`: 78.37%
- `src/injectors/injector-engine.js`: 81.25%
- Altre parti del codice necessitano di maggiore copertura

## Note

Il progetto è configurato per utilizzare sia moduli CommonJS (`.cjs`) che ES Modules (`.mjs`).
