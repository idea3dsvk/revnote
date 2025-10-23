# Evidencia revízií náradia a spotrebičov

Webová aplikácia na správu a evidenciu elektrických revízií ručného náradia, spotrebičov a predlžovacích prívodov podľa STN 33 1630:2025.

## Funkcie

- ✅ **Správa zariadení** - pridávanie, úprava a vylúčenie zariadení z evidencie
- ✅ **História revízií** - kompletná história všetkých vykonaných revízií s meracími hodnotami
- ✅ **Automatický výpočet** - automatické určenie ďalšieho termínu revízie podľa typu a skupiny používania
- ✅ **PDF správy** - generovanie revíznych správ vo formáte PDF
- ✅ **Perzistencia dát** - automatické ukladanie dát do localStorage
- ✅ **Export/Import** - zálohovanie a obnova dát vo formáte JSON
- ✅ **AI asistent** - inteligentný asistent využívajúci Gemini AI pre analýzu dát
- ✅ **Slovenský jazyk** - kompletné rozhranie v slovenčine

## Spustenie aplikácie

### Požiadavky

- Node.js (verzia 18 alebo novšia)
- npm alebo yarn

### Inštalácia

1. Nainštalujte závislosti:

   ```bash
   npm install
   ```

2. (Voliteľné) Nastavte API kľúč pre Gemini AI:
   Vytvorte súbor `.env.local` v koreňovom priečinku projektu:

   ```
   VITE_GEMINI_API_KEY=váš_api_kľúč
   ```

3. Spustite vývojový server:

   ```bash
   npm run dev
   ```

4. Otvorte aplikáciu v prehliadači na adrese uvedenej v termináli (zvyčajne `http://localhost:5173`)

### Build pre produkciu

```bash
npm run build
```

Výstupné súbory budú v priečinku `dist/`.

## Používanie

### Pridanie zariadenia

1. Kliknite na tlačidlo **"Pridať nové náradie"**
2. Vyplňte všetky povinné údaje (názov, typ, sériové číslo, atď.)
3. Vyberte spôsob a skupinu používania
4. Potvr ďte tlačidlom **"Pridať"**

### Pridanie revízie

1. Vyberte zariadenie zo zoznamu
2. Kliknite na tlačidlo **"Nová revízia"**
3. Vyplňte výsledky revízie (meracie hodnoty, stav, poznámky)
4. Uložte revíziu

### Export/Import dát

- **Export**: Kliknite na tlačidlo "Export" v hlavičke - stiahne sa JSON súbor so všetkými dátami
- **Import**: Kliknite na "Import" a vyberte predtým exportovaný JSON súbor

### Reset dát

Ak chcete obnoviť pôvodné vzorové dáta, kliknite na ikonu obnovenia (šípky v kruhu) v ľavom paneli. Všetky uložené dáta budú vymazané.

## Technológie

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS (cez CDN)
- **Build tool**: Vite
- **PDF generovanie**: jsPDF + jsPDF-autotable
- **AI**: Google Gemini API
- **Perzistencia**: localStorage API

## Štruktúra projektu

```
├── components/          # React komponenty
│   ├── AssetList.tsx   # Zoznam zariadení
│   ├── AssetDetail.tsx # Detail zariadenia
│   ├── AddAssetModal.tsx
│   ├── AddInspectionModal.tsx
│   ├── OperatorModal.tsx
│   ├── GeminiAssistant.tsx
│   ├── ExportImport.tsx
│   └── icons/          # SVG ikony
├── services/           # Biznis logika
│   ├── persistence.ts  # localStorage API
│   ├── pdfGenerator.ts # Generovanie PDF
│   └── geminiService.ts # AI integrácia
├── types.ts            # TypeScript typy
└── App.tsx             # Hlavný komponent

```

## Licencia

Tento projekt je voľne použiteľný pre osobné aj komerčné účely.

## Podpora

Pre otázky a podporu vytvorte issue v repozitári alebo kontaktujte autora.
