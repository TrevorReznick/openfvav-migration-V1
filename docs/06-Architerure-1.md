# OpenFav Migration Pipeline v3.0 - Documentazione Tecnica

## 📘 Executive Summary

OpenFav Migration Pipeline v3.0 è uno strumento di automazione progettato per orchestrare la migrazione di progetti frontend da architetture legacy (V3/V4) verso sistemi moderni basati su design tokens centralizzati (V6 Core). Il focus principale è l'idratazione automatica di CSS, la gestione di design tokens e la conversione intelligente di componenti React.

**Versione:** v3.0.0 Release Candidate  
**Data:** 26 Novembre 2024  
**Status:** Strategia di Engineering

---

## 🎯 Obiettivi Strategici

### Primary Goals (v3.0.0)
- **Automatizzazione Idratazione CSS**: Generazione automatica di `tokens.css`, `globals.css` e `tailwind.config.js` senza intervento manuale
- **Mappatura Componenti**: Conversione automatica di componenti React da V4 a V6, preservando la logica business
- **Test Coverage**: Raggiungere >85% di copertura su tutti i moduli core, extractors, hydrators e CLI

### Secondary Goals (v3.1.0)
- **Component Analyzer**: Analisi AST per identificare stili non-tokenizzati
- **Auto-Fix Stili**: Suggerimenti automatici per conversione da valori hardcoded a token semantici

### Tertiary Goals (v3.2.0)
- **Multi-Framework Support**: Estensione a Astro, Vue e Svelte
- **Performance Audit**: Misurazione e ottimizzazione del bundle size post-migrazione

---

## 🛠️ Architettura del Sistema

### Moduli Core (Testati)

#### TokenEngine
**File:** `src/core/token-engine.js`  
**Coverage:** ✅ 100%  
**Funzione:** Orchestratore principale della pipeline di migrazione

#### ConfigLoader
**File:** `src/core/config-loader.js`  
**Coverage:** ✅ 100%  
**Funzione:** Validazione configurazione con Zod schema

#### Logger
**File:** `src/utils/logger.js`  
**Coverage:** ✅ 100%  
**Funzione:** Logging strutturato per debugging e auditing

### Extractors (Testati)

#### CSS Extractor
**File:** `src/modules/extractors/css-extractor.js`  
**Coverage:** ✅ 93%  
**Funzione:** Parsing PostCSS di file CSS/SCSS per estrazione token

#### PostCSS Extractor
**File:** `src/modules/extractors/postcss-extractor.mjs`  
**Coverage:** ✅ 93%  
**Funzione:** Plugin ESM per manipolazione AST PostCSS

#### Color Transformer
**File:** `src/transformers/color-transformer.js`  
**Coverage:** ⚠️ 52%  
**Funzione:** Conversione colori HEX → HSL con normalizzazione nomi

### Hydrators (Testati)

#### Token Hydrator
**File:** `src/modules/hydrators/token-hydrator.js`  
**Coverage:** ✅ 92%  
**Funzione:** Iniezione valori nei template tramite regex `@inject`

#### Injector Engine
**File:** `src/modules/hydrators/injector-engine.js`  
**Coverage:** ✅ 92%  
**Funzione:** Logica di sostituzione con supporto dry-run

---

## 🚀 CLI Commands

### Comandi Disponibili

#### `hydrate`
Esegue la pipeline completa di estrazione e idratazione

```bash
openfav-migrate hydrate --source ./astroflux-V4 --target ./openfav-test
```

#### `validate`
Verifica la struttura dei progetti e la configurazione

```bash
openfav-migrate validate --config migration.config.json
```

#### `setup`
Wizard interattivo per generare `migration.config.json`

```bash
openfav-migrate setup
```

#### `analyze` (v3.0.0)
Analizza struttura V4 e genera mapping V6

```bash
openfav-migrate analyze --source ./astroflux-V4 --output mapping.json
```

**Output atteso:**
- Componenti identificati: 45
- Token in uso: 87 (36 colori, 41 spacing, 10 typography)
- Stili arbitrari: 23 (richiedono conversione manuale)

#### `fix-styles` (v3.0.0)
Suggerisce conversioni automatiche per stili arbitrari

```bash
openfav-migrate fix-styles --component Dashboard.tsx
```

**Conversioni supportate:**
- `text-[3.6rem]` → `text-5xl` (mapping: `--text-5xl: 3.6rem`)
- `rounded-[1.2rem]` → `rounded-xl` (mapping: `--radius-xl: 1.2rem`)
- `p-[2.4rem]` → `p-6` (mapping: `--spacing-6: 2.4rem`)

#### `migrate:all` (v3.0.0)
Simula intera migrazione con dry-run

```bash
openfav-migrate migrate:all --dry-run --output report.html
```

**Report include:**
- Token coverage: 94% (3 token mancanti)
- Componenti migrabili: 42/45 (3 con dipendenze bloccanti)
- Bundle size delta: +2.3KB (token centralizzati)

---

## 📂 Mappatura Progetti

### V4 (Sorgente - Legacy)
**Path:** `./astroflux-V4/`  
**Stack:**
- React 17
- Tailwind CSS 2.x
- CSS Modules

**Token:** Mix di variabili CSS (`--color-primary`) e valori hardcoded  
**Componenti:** ~45 componenti, 23 con stili arbitrari

### V3 (Riferimento - Obsoleto)
**Path:** `./astroflux-V3/` (opzionale)  
**Stack:**
- React 16
- Sass
- BEM methodology

**Token:** Variabili SCSS (`$primary-color`)

### V6 (Destinazione - Target)
**Path:** `./openfav-test/`  
**Stack:**
- React 18
- Tailwind CSS 3.x
- TypeScript

**Token:** Centralizzati in:
- `src/lib/tokens.ts`
- `src/styles/globals.css`

**Componenti:** ~50 componenti (inclusi migrati)

---

## 🔧 Aree di Focus v3.0

### Area 1: Core Engine ✅
**Status:** 100% test coverage  
**Goal v3.0:** Aggiungere caching e incremental build

### Area 2: Extractors ✅
**Status:** 93% test coverage  
**Goal v3.0:** Supporto per `@import` e file SCSS nested

### Area 3: Hydrators ✅
**Status:** 92% test coverage  
**Goal v3.0:** Supporto per `@media` queries e varianti

### Area 4: Transformers ⚠️
**Status:** 52% coverage  
**Lacune:** Test per RGB/Hex edge cases  
**Goal v3.0:** Supporto per `oklch()`, `lab()` e gradienti

### Area 5: CLI & Commands ⚠️
**Status:** 0% coverage (entry point non testato)  
**Goal v3.0:** Test coverage >80% su tutti i comandi

### Area 6: Component Mapper ❌
**Status:** Non implementato  
**Goal v3.0:**
- AST parser per componenti React
- Mappatura import path
- Conversione stili

---

## 📅 Roadmap

### Milestone 1: Core Completo (v3.0.0)
- [x] Token extraction e hydration testata
- [x] Regex tolerant per tag `@inject`
- [ ] Template generator con tag automatici
- [ ] Component mapper con supporto AST base
- [ ] Coverage >85% su tutti i moduli core

**Timeline:** 2-3 settimane

### Milestone 2: Component Migration (v3.1.0)
- [ ] AST parser per componenti React (Babel)
- [ ] Mappatura import path (`@/` → `@/`)
- [ ] Auto-fix stili arbitrari
- [ ] Supporto componenti con dipendenze

**Timeline:** 3-4 settimane

### Milestone 3: Multi-Framework (v3.2.0)
- [ ] Supporto Astro (`.astro` → `.tsx`)
- [ ] Supporto Vue 3 (SFC)
- [ ] Plugin system per custom transformers
- [ ] Performance audit tool

**Timeline:** 4-5 settimane

---

## 🤔 Decisioni Architetturali

### 1. Breaking Changes in v3.0?

**Opzione A:** Mantenere compatibilità v2.0 (safe)  
**Opzione B:** Introduzione `migration.config.json` v3.0 con breaking changes  
**✅ Raccomandazione:** Opzione B con upgrade path documentato

```bash
npm run migrate:upgrade-v2-to-v3
```

### 2. Auto-Fix Stili Arbitrari

**Opzione A:** Suggerimento manuale (CLI warning)  
**Opzione B:** Auto-fix con mapping hardcoded (risky)  
**Opzione C:** AI-powered suggestion (troppo costoso)  
**✅ Raccomandazione:** Opzione A per v3.0, Opzione C roadmap v4.0

### 3. Supporto Gradients/Animations

**Opzione A:** Token custom (stringa opaca)  
**Opzione B:** Parser specifico per `linear-gradient()`  
**✅ Raccomandazione:** Opzione B in v3.1.0

```javascript
// src/transformers/gradient-transformer.js
```

---

## 📚 Risorse

### Tool di Sviluppo
- **AST Explorer:** https://astexplorer.net/
- **PostCSS Playground:** https://preset-env.cssdb.org/playground
- **Vitest UI:** `npm run test:ui`

### Design System References
- OpenFav Design Specs: `/docs/design-specs-v6.md`
- Token Naming Convention: `/docs/token-naming.md`
- Component Library: `/docs/component-library.md`

---

## 📊 Status Corrente

### Metriche
- **Test Coverage:** 46.11% → Target: 85%
- **Componenti Migrabili:** 42/45 (93%)
- **Token Coverage:** 94%
- **Bundle Size Delta:** +2.3KB

### Stato Moduli
| Modulo | Coverage | Status |
|--------|----------|--------|
| Core Engine | 100% | ✅ Completo |
| Extractors | 93% | ✅ Completo |
| Hydrators | 92% | ✅ Completo |
| Transformers | 52% | ⚠️ In Progress |
| CLI Commands | 0% | ❌ Da Implementare |
| Component Mapper | 0% | ❌ Da Implementare |

---

## 🎯 Prossimi Step Critici

1. **Implementare test per Component Mapper**
   - AST parser per React components
   - Test coverage target: 85%

2. **Auto-fix stili arbitrari**
   - CLI suggestions per conversioni comuni
   - Warning system per edge cases

3. **Documentare breaking changes**
   - Migration guide v2.0 → v3.0
   - Upgrade script automatizzato

4. **Incrementare test coverage**
   - Transformers: 52% → 85%
   - CLI: 0% → 80%
   - Overall: 46% → 85%

---

## 📞 Supporto

Per domande, issue o contributi:
- **Repository:** [GitHub Link]
- **Documentation:** `/docs`
- **Discord Community:** [Link]

---

**Last Updated:** 26 Novembre 2024  
**Next Review:** v3.0.0 RC Release