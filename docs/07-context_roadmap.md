# 🚀 OpenFav Migration Pipeline: Context & Roadmap (v3.0)

## 📌 1. Mission & Vision

L'obiettivo del progetto è la creazione di un **Toolkit di Migrazione Industriale** capace di trasformare Design System legacy (V3/V4) in un'architettura moderna (V6) basata su **Astro + React**. Il sistema non si limita a copiare file, ma effettua una **idratazione chirurgica** dei dati, mantenendo intatta la logica e le ottimizzazioni del Core di destinazione.

---

## 🛠 2. Tooling Attuale (v2.0.2 - v2.0.3)

La pipeline è costruita come un sistema modulare basato su **Node.js**:

### Moduli Principali

- **PostCSS Engine**: Scansiona i file sorgente per estrarre variabili CSS/Tailwind
- **Pure HSL Transformer**: Converte HEX/RGB in formato HSL puro (`H S% L%`) per garantire la compatibilità con le opacità di Tailwind in V6
- **Surgical Injector**: Utilizza tag semantici (`// @inject:key`) per sovrascrivere solo i dati nei template di destinazione senza distruggere il codice esistente
- **Validation Layer (Zod)**: Garantisce che la configurazione e i percorsi dei progetti siano validi prima di ogni operazione
- **Test Suite (Vitest)**: Copertura >85% sui moduli core (Engine, Extractor, Hydrator)

---

## 🗺 3. Capacità della CLI & Mappatura

La CLI è in grado di mappare relazioni complesse tra progetti:

### Funzionalità Chiave

- **Project Mapping**: Gestione di percorsi multipli (`SRC_V4` → `DEST_V6`)
- **Semantic Normalization**: Mappatura automatica di nomi variabili (es: `--color-primary-color` → `primary`)
- **Tailwind-Aware Extraction**: Capacità di riconoscere variabili standard di framework moderni (Lovable, Shadcn, v0) anche senza prefissi espliciti
- **Hybrid Support**: Generazione simultanea di helper TypeScript per React (`tokens.ts`) e variabili CSS per Astro/Tailwind (`globals.css`)

---

## 🎯 4. Obiettivi per la Versione 3.0 (Component Migration)

La versione 3.0 segnerà il passaggio dall'idratazione dei soli token alla **migrazione intelligente dei componenti**.

### A. AST-Based Component Transformation

- **Routing Logic Replacement**: Sostituzione automatica della logica di routing (es: `react-router-dom` → `Astro Link`)
- **Icon Mapping**: Riconoscimento e mappatura delle icone (es: `lucide-react` integration)
- **Token Conversion**: Conversione di classi Tailwind "hardcoded" (es: `rounded-[1.2rem]`) in token semantici (es: `rounded-radius`)

### B. Logic-Layout Splitting

- **Data Fetching Separation**: Strategia per separare il Data Fetching (da spostare nel frontmatter di Astro) dal UI Design (da mantenere come componente React idratato)
- **Component Hydration Strategy**: Gestione intelligente di componenti interattivi vs statici

### C. Auto-Seeding & Factory Reset

- **Template Initialization**: Funzione per inizializzare un progetto V6 "vergine" iniettando automaticamente tutti i tag `@inject` necessari basandosi su un'analisi della sorgente
- **Reverse Engineering**: Capacità di ricostruire la struttura ottimale partendo da codice legacy

---

## 🏗 5. Schema Tecnico di Riferimento

### Architettura V6 Target

- **Destinazione V6**: Un guscio ottimizzato che importa `tokens.css` (CSS Vars) e `tokens.ts` (JS Helpers)
- **Integrazione Tailwind**: Configurato in V6 per leggere direttamente le variabili CSS (`primary: 'hsl(var(--primary))'`)
- **Flessibilità**: Supporto totale per componenti React "idratati" dentro pagine Astro statiche

### Flusso di Migrazione

```
V4 Legacy Project
    ↓
[AST Analysis] → Identify components, styles, logic
    ↓
[Token Extraction] → Extract design tokens from CSS/Tailwind
    ↓
[Component Parsing] → Parse React components and dependencies
    ↓
[Transformation] → Convert routing, icons, arbitrary styles
    ↓
[Logic Split] → Separate data fetching from UI
    ↓
[Injection] → Hydrate V6 templates with @inject tags
    ↓
V6 Modern Project (Astro + React)
```

---

## 📋 Prompt Consigliato per Nuova Chat

```
Ciao, sto lavorando alla versione 3.0 di OpenFav Migration Pipeline. 

Ho già una CLI stabile (v2.0.2) che gestisce l'idratazione dei design token (CSS/TS) 
tramite iniezione chirurgica. 

Ora vogliamo evolvere il sistema per gestire la migrazione dei componenti React verso 
Astro, mantenendo la coerenza dei token. 

Basati sul documento allegato per analizzare come scalare la logica di estrazione e 
trasformazione dai token ai componenti TSX/Astro.
```

---

## 🎯 Roadmap di Sviluppo

### Phase 1: AST Foundation (Settimane 1-2)
- [ ] Implementare parser Babel per componenti React
- [ ] Creare sistema di riconoscimento pattern (routing, icons, styles)
- [ ] Test coverage >85% su component-mapper

### Phase 2: Transformation Engine (Settimane 3-4)
- [ ] Logic splitter per data fetching vs UI
- [ ] Converter per stili arbitrari → token semantici
- [ ] Mappatura automatica import paths

### Phase 3: Integration & Testing (Settimane 5-6)
- [ ] Auto-seeding per progetti V6 vergini
- [ ] End-to-end testing su progetti reali
- [ ] Documentation e migration guides

---

## 📊 Metriche di Successo v3.0

| Metrica | Target | Attuale |
|---------|--------|---------|
| Component Coverage | >90% | 0% |
| AST Transformation Accuracy | >95% | N/A |
| Test Coverage (Overall) | >85% | 46% |
| Migration Time (45 components) | <30 min | N/A |
| Manual Intervention Required | <5% | N/A |

---

## 🔧 Stack Tecnologico v3.0

### Core Dependencies
- **@babel/parser**: AST parsing per React/JSX
- **@babel/traverse**: Navigazione e manipolazione AST
- **jscodeshift**: Code transformation tool
- **postcss**: CSS parsing (già in uso v2.0)
- **zod**: Schema validation (già in uso v2.0)

### CLI Enhancement
- **commander**: Advanced CLI routing
- **inquirer**: Interactive prompts per configurazione
- **ora**: Progress indicators per operazioni lunghe
- **chalk**: Colorazione output CLI

---

## 💡 Design Patterns Chiave

### 1. Surgical Injection Pattern
```javascript
// Template V6 (destination)
const colors = {
  // @inject:primary
  primary: "240 5.9% 10%",
  // @inject:secondary
  secondary: "240 4.8% 95.9%"
}
```

### 2. Component Transformation Pattern
```javascript
// V4 (source)
import { Link } from 'react-router-dom';
<Link to="/about" className="rounded-[1.2rem]">About</Link>

// V6 (destination)
import { Link } from '@/components/ui/link';
<Link href="/about" className="rounded-xl">About</Link>
```

### 3. Logic Split Pattern
```javascript
// V4 (source)
export function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(setData) }, []);
  return <div>{data?.title}</div>
}

// V6 (destination - Astro)
---
const data = await fetch('/api/data').then(r => r.json());
---
<DashboardUI data={data} client:load />

// V6 (destination - React component)
export function DashboardUI({ data }) {
  return <div>{data?.title}</div>
}
```

---

## 🚨 Known Challenges & Solutions

### Challenge 1: Complex State Management
**Problem**: Componenti V4 con Redux/Context API  
**Solution**: Analisi statica per identificare state dependencies → suggerimento migrazione a Island Architecture

### Challenge 2: Dynamic Routing
**Problem**: React Router con route dinamiche  
**Solution**: Mappatura automatica a file-based routing di Astro con conversione parametri

### Challenge 3: CSS-in-JS
**Problem**: Styled-components, Emotion in V4  
**Solution**: Estrazione stili → conversione a Tailwind classes con token mapping

---

## 📚 Riferimenti Tecnici

### Internal Documentation
- `/docs/design-specs-v6.md` - Specifiche design system V6
- `/docs/token-naming.md` - Convenzioni naming per token
- `/docs/component-library.md` - Libreria componenti target
- `/docs/migration-patterns.md` - Pattern ricorrenti di migrazione

### External Resources
- [Astro Islands](https://docs.astro.build/en/concepts/islands/)
- [Babel Parser API](https://babeljs.io/docs/en/babel-parser)
- [PostCSS Plugin API](https://postcss.org/api/)
- [Tailwind CSS Variables](https://tailwindcss.com/docs/customizing-colors#using-css-variables)

---

## 🎓 Best Practices

### Per Sviluppatori
1. **Test-First**: Scrivere test prima dell'implementazione
2. **Incremental**: Implementare feature in piccoli chunks testabili
3. **Documentation**: Documentare decisioni architetturali critiche
4. **Validation**: Validare input/output con Zod schemas

### Per Utilizzatori
1. **Backup**: Sempre fare backup prima di migrazioni
2. **Dry-Run**: Usare sempre `--dry-run` per preview cambiamenti
3. **Incremental**: Migrare componente per componente, non tutto insieme
4. **Review**: Verificare manualmente componenti critici post-migrazione

---

**Version:** 3.0.0-roadmap  
**Last Updated:** 2 Gennaio 2026  
**Next Milestone:** AST Foundation Implementation