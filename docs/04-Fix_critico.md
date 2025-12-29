# 🚨 **FIX CRITICO: Two-pass Migration System**

## 📋 **Ticket Summary**
**ID:** `OFM-2025-12-28-001`  
**Tipo:** Hotfix Critico  
**Priorità:** P1 (Blocker)  
**Versione Target:** v2.0.3  
**Stimato:** 4-6 ore  
**Assegnato a:** @dev-team  
**Stato:** In Progress 🚧  

---

## 🎯 **Descrizione del Problema**

### **Sintomo**
La pipeline di migrazione v2.0.2 produce **14 warnings** durante l'idratazione e **0 valori vengono effettivamente iniettati** nel progetto V6.

```bash
$ npm run hydrate
✅ Estratti 7 colori, 6 spacing values
⚠️  14 @inject tags not found
⚠️  Hydrated 0 values
```

### **Root Cause**
I file nel progetto destinazione (V6) sono stati creati come **prodotti finiti** invece che come **template con tag `@inject`**. La pipeline cerca tag che non esistono, rendendo il sistema inutilizzabile.

### **Impatto**
- ❌ Blocca tutti i test di migrazione
- ❌ Impedisce l'uso in produzione
- ❌ Componenti Astro/React non ricevono i design token
- ❌ Tailwind classes (`bg-card`, `text-primary`) non funzionano

---

## 🔍 **Analisi Tecnica**

### **Architettura Attuale (ROTTA)**
```
migration-dev-V1/          # Pipeline
└── extractTokens() → hydrateTokens()
                         ↓
openfav-test/            # Destinazione V6
└── tokens.ts           ❌ Senza @inject tags
```

### **Architettura Corretta (FIXED)**
```
migration-dev-V1/
└── extractTokens() → generateTemplates() → hydrateTokens()
                                          ↓
openfav-test/
└── tokens.ts           ✅ CON @inject tags + valori reali
```

### **File Corrotti**
1. `openfav-test/src/lib/tokens.ts` - Mancano `// @inject:` comments
2. `openfav-test/src/styles/globals.css` - Mancano `/* @inject: */` comments
3. `openfav-test/tailwind.config.ts` - Non sincronizzato con i token

---

## 🛠️ **Soluzione Proposta**

### **Approccio: Two-pass Migration**
Implementare un sistema a due fasi che garantisca la corretta struttura dei file V6.

### **Fase 1: Analisi e Template Generation**
```javascript
// Nuovo modulo: TemplateGenerator
class TemplateGenerator {
  generateTokensTS(v4Tokens, v6Path) {
    // Crea tokens.ts con tutti i tag @inject
    const content = `export const tokens = {
      colors: {
        // @inject:primary
        primary: '${v4Tokens.colors.primary}',
        ...
      }
    }`;
  }
}
```

### **Fase 2: Idratazione Intelligente**
- Verifica presenza tag `@inject`
- Se mancanti, auto-repair con sistema di backup
- Inietta valori reali nei template

---

## 📁 **File da Modificare/Creare**

### **Nuovi File:**
```
src/
├── pipeline/
│   ├── template-generator.js    # 🆕 Genera template con @inject
│   ├── repair.js                # 🆕 Auto-repair per file esistenti
│   └── migration-engine.js      # 🆕 Orchestratore two-pass
```

### **File da Modificare:**
```
src/
├── cli.js                       # Aggiungi comando `migrate`
├── core/token-engine.js         # Aggiorna per two-pass
└── modules/hydrators/*.js       # Migliora error handling
```

---

## 🔧 **Implementazione Step-by-Step**

### **Step 1: TemplateGenerator (2 ore)**
- [ ] Implementa `generateTokensTS()` con tag `@inject`
- [ ] Implementa `generateGlobalsCSS()` con CSS variables
- [ ] Implementa `updateTailwindConfig()` per sync con token

### **Step 2: MigrationEngine (1 ora)**
- [ ] Crea orchestratore two-pass
- [ ] Implementa backup automatico dei file
- [ ] Aggiungi logging dettagliato

### **Step 3: CLI Update (30 min)**
- [ ] Aggiungi comando `npm run migrate`
- [ ] Mantieni backward compatibility con `hydrate`
- [ ] Migliora output utente

### **Step 4: Test & Validation (2 ore)**
- [ ] Test su `openfav-test` project
- [ ] Verifica 0 warnings
- [ ] Test componenti Astro (`bg-card`, `text-primary`)
- [ ] Test componenti React (`getColor()` helper)

---

## 🧪 **Criteri di Accettazione**

### **Funzionali:**
- [ ] `npm run migrate` completa senza errori
- [ ] **0 warnings** durante l'idratazione
- [ ] Tutti i valori estratti vengono iniettati
- [ ] File V6 contengono tag `@inject` corretti

### **Non Funzionali:**
- [ ] Backup automatico dei file modificati
- [ ] Backward compatibility con v2.0.2
- [ ] Logging chiaro dello stato della migrazione
- [ ] Error handling robusto

### **Test di Integrazione:**
- [ ] Componente `SaasHome.tsx` usa `bg-card` correttamente
- [ ] Componente `TokenTest.tsx` usa `getColor()` correttamente
- [ ] Pagina Astro index usa classi Tailwind funzionanti
- [ ] Tailwind config sincronizzata con i token

---

## ⚠️ **Rischi e Mitigazione**

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|------------|---------|-------------|
| Sovrascrittura file V6 | Medio | Alto | Backup automatico pre-modifica |
| Breaking changes | Basso | Medio | Mantieni comando `hydrate` legacy |
| Config Tailwind complessa | Alto | Alto | Modifica solo mapping colors/spacing |
| Performance degradation | Basso | Basso | Ottimizza file I/O con streaming |

---

## 📊 **Metriche di Successo**

### **Prima del Fix:**
- ❌ 14 warnings
- ❌ 0 valori idratati
- ❌ Componenti non stilizzati

### **Dopo il Fix:**
- ✅ 0 warnings
- ✅ 14+ valori idratati
- ✅ Componenti funzionanti
- ✅ Time-to-fix: < 6 ore

---

## 🔗 **Dipendenze**

- ✅ `css-extractor.js` funzionante
- ✅ Progetto V6 (`openfav-test`) accessibile
- ✅ Config Tailwind avanzata documentata
- ✅ Team disponibile per review

---

## 📝 **Note Tecniche**

### **Formato Tag @inject:**
```javascript
// TypeScript files
// @inject:primary

/* CSS files */
/* @inject:primary */
```

### **Backup Strategy:**
```javascript
// Backup naming: filename.backup-{timestamp}
tokens.ts → tokens.ts.backup-1735387200000
```

### **Error Recovery:**
```bash
# Se qualcosa va storto
$ npm run migrate --rollback
# Ripristina da backup più recente
```

---

## 🚀 **Deployment Plan**

### **Fase 1: Sviluppo Locale**
1. Clone repo migration-dev-V1
2. Implementa TemplateGenerator
3. Test su openfav-test locale

### **Fase 2: Test Integration**
1. Push su branch `fix/two-pass-migration`
2. Code review
3. Merge su `main`

### **Fase 3: Release**
1. Bump version a v2.0.3
2. Update CHANGELOG.md
3. Tag release
4. Notify stakeholders

---

## 📞 **Contatti**

- **Product Owner:** @po-openfav
- **Tech Lead:** @tech-lead  
- **QA:** @qa-team
- **Emergency Contact:** @dev-ops

---

## ✅ **Approvazioni**

- [ ] **Product:** _________________ Data: ______
- [ ] **Tech Lead:** _________________ Data: ______  
- [ ] **QA:** _________________ Data: ______

---

*Ultimo aggiornamento: 2025-12-28 10:00 CET*  
*Ticket creato da: @ai-assistant*