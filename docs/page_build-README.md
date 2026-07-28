markdown# Build Page System - Documentazione Tecnica

## Panoramica

Il sistema di Build Page è un framework per la creazione dinamica di pagine web nell'applicazione. Permette di definire pagine tramite configurazione anziché codice hardcoded, garantendo consistenza, manutenibilità e scalabilità.

## Architettura

### Componenti Principali
```
src/
├── config/discovery/page-registry/  # Registrazione pagine
├── scripts/helpers/page.ts          # Helper per creazione pagine
├── components/templates/             # Templates di pagina
└── pages/discovery/                  # Sistema di routing dinamico
```

## Metodi di Creazione Pagine

### 1. `page()` - Pagina Generica
Metodo base per creare pagine personalizzate.
```typescript
'path/to/page': page(
  'Titolo', 
  'Sottotitolo', 
  'Icona', 
  {
    template: 'TemplateName',
    description: 'Descrizione pagina',
    order: number,
    features: Array,
    sections: Array,
    cta: [label, url, icon],
    footer: [text, link],
    props: object
  }
)
```

### 2. `docs()` - Documentazione

Shortcut per pagine di documentazione tecnica.
```typescript
'path/docs': docs('Titolo', 'Sottotitolo', {
  description: 'Descrizione',
  features: [...],
  sections: [...]
})
// Template: DocumentationTemplate
// Icona: BookOpen (automatica)
```

### 3. `virtual()` - Pagina Virtuale

Shortcut per landing pages e presentazioni.
```typescript
'path/virtual': virtual('Titolo', 'Sottotitolo', 'Icona', {
  description: 'Descrizione',
  features: [...],
  sections: [...],
  cta: [...],
  footer: [...]
})
// Template: VirtualPageTemplate
```

### 4. `test()` - Testing

Shortcut per pagine di test con debug attivo.
```typescript
'path/test': test('Titolo', 'Sottotitolo', {
  template: 'TemplateName',
  features: [...]
})
// Debug: true (automatico)
// Icona: FlaskConical (automatica)
```

## Templates Disponibili

### DocumentationTemplate

- **Uso**: Documentazione tecnica
- **Features**: Sidebar navigation, technical details, props display
- **Layout**: Sidebar + Main content

### VirtualPageTemplate

- **Uso**: Landing pages, presentazioni
- **Features**: Grid responsive, CTA, footer personalizzabile
- **Layout**: Full width con sezioni dinamiche

### HelloApiTemplate

- **Uso**: Pagine API
- **Features**: Policy badges, debug console, layout V2
- **Layout**: Header + Main content enterprise

### HomeTestTemplate

- **Uso**: Homepage e pagine principali
- **Features**: AppProviders V3, Navbar integrata, Theme toggle
- **Layout**: Completo con navigazione

## Configurazione Dettagliata

### Parametri Comuni

| Parametro | Tipo | Obbligatorio | Descrizione |
|-----------|------|--------------|-------------|
| description | string | No | Descrizione breve della pagina |
| order | number | No | Ordinamento nelle liste |
| features | array | No | Elenco features con icona |
| sections | array | No | Sezioni di contenuto |
| cta | array | No | Call to action button |
| footer | array | No | Informazioni footer |
| props | object | No | Props passate al componente |

### Formato Arrays

#### Features
```typescript
[
  ['Nome Feature', 'Descrizione', 'NomeIcona']
]
```

#### Sections
```typescript
[
  ['Titolo', 'Contenuto', 'Sottotitolo?', 'align?'] // align: left|center|right
]
```

#### CTA
```typescript
['Label Button', '/url/destinazione', 'NomeIcona']
```

#### Footer
```typescript
['Testo footer', 'https://link-opzionale']
```

## Best Practices

### 1. Scelta del Template

- **Documentazione**: Usa `docs()`
- **Landing/Presentazione**: Usa `virtual()`
- **Testing**: Usa `test()`
- **Custom**: Usa `page()` con template specifico

### 2. Organizzazione Path
```
categoria/nome-pagina          # Standard
docs/guida-rapida             # Documentazione
examples/template-test        # Esempi
admin/dashboard               # Aree riservate
```

### 3. Consistenza Visiva

- Mantieni coerenza nelle icone
- Usa nomi descrittivi per features
- Ordina le pagine logicamente con `order`

### 4. Performance

- Evita props troppo pesanti
- Usa lazy loading per contenuti esterni
- Ottimizza le immagini nelle sections

## Debug e Sviluppo

### Modalità Debug

Le pagine create con `test()` hanno debug automatico abilitato:

- Visualizzazione dati grezzi
- Logging console
- Informazioni tecniche visibili

### Testing Rapido
```typescript
'test/quick': test('Quick Test', 'Test veloce', {
  features: [['Test', 'Feature di test', 'Bug']]
})
```

## Integrazione con Routing

Il sistema legge automaticamente il registry per:

- Generare menu di navigazione
- Costruire breadcrumb
- Gestire permessi (se implementati)
- Caricare dinamicamente i componenti

## Esempio Completo
```typescript
'myapp/product-overview': virtual(
  'Product Overview', 
  'Panoramica del Prodotto', 
  'Package',
  {
    description: 'Scopri tutte le caratteristiche del nostro prodotto',
    order: 50,
    
    features: [
      ['Facile da Usare', 'Interfaccia intuitiva', 'Smile'],
      ['Potente', 'Funzionalità avanzate', 'Zap'],
      ['Sicuro', 'Protezione dei dati', 'Shield']
    ],
    
    sections: [
      ['Il Nostro Prodotto', 'Descrizione dettagliata...', 'center'],
      ['Benefici', 'Lista dei vantaggi...', 'left']
    ],
    
    cta: ['Inizia Ora', '/signup', 'ArrowRight'],
    footer: ['© 2024 Company', 'https://company.com'],
    
    props: {
      highlight: true,
      version: '1.0'
    }
  }
)
```

## Manutenzione

### Aggiunta Nuova Pagina

1. Scegli il metodo appropriato (page, docs, virtual, test)
2. Definisci path univoco
3. Compila i parametri necessari
4. Verifica anteprima nel sistema di discovery

### Modifica Pagina Esistente

1. Trova la definizione nel registry
2. Modifica i parametri desiderati
3. Controlla la coerenza con altre pagine
4. Testa le modifiche

## Troubleshooting

### Pagina Non Visibile

- Verifica path univoco
- Controlla sintassi del registry
- Assicurati che non sia filtrata da policy

### Template Errato

- Verifica template specificato
- Controlla compatibilità props
- Verifica helper utilizzato

### Performance Lenta

- Riduci dimensione props
- Ottimizza contenuti delle sections
- Verifica caricamento condizionale