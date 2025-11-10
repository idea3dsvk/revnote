# Evidencia revízií náradia a spotrebičov

Webová aplikácia na správu a evidenciu elektrických revízií ručného náradia, spotrebičov a predlžovacích prívodov podľa STN 33 1630:2025.

## Funkcie

- ✅ **Správa zariadení** - pridávanie, úprava a vylúčenie zariadení z evidencie
- ✅ **História revízií** - kompletná história všetkých vykonaných revízií s meracími hodnotami
- ✅ **Automatický výpočet** - automatické určenie ďalšieho termínu revízie podľa typu a skupiny používania
- ✅ **PDF správy** - generovanie revíznych správ vo formáte PDF
- ✅ **Používateľské účty** - 3-úrovňový systém oprávnení (Administrator, Revízor, Používateľ)
- ✅ **Cloud synchronizácia** - Firebase Firestore pre zdieľanie dát medzi zariadeniami
- ✅ **Bezpečnosť** - Firebase App Check s reCAPTCHA v3 ochrana
- ✅ **Perzistencia dát** - automatické ukladanie dát lokálne aj do cloudu
- ✅ **Export/Import** - zálohovanie a obnova dát vo formáte JSON
- ✅ **AI asistent** - inteligentný asistent využívajúci Gemini AI pre analýzu dát
- ✅ **Slovenský jazyk** - kompletné rozhranie v slovenčine

## Spustenie aplikácie

### Online verzia

Aplikácia je dostupná na: **https://idea3dsvk.github.io/revnote/**

### Lokálne spustenie

#### Požiadavky

- Node.js (verzia 18 alebo novšia)
- npm alebo yarn

### Inštalácia

1. Nainštalujte závislosti:

   ```bash
   npm install
   ```

2. Vytvorte súbor `.env` v koreňovom priečinku projektu a nastavte Firebase konfiguráciu:

   ```
   VITE_FIREBASE_API_KEY=váš_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=váš_projekt.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=váš_projekt_id
   VITE_FIREBASE_STORAGE_BUCKET=váš_projekt.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=váš_sender_id
   VITE_FIREBASE_APP_ID=váš_app_id
   VITE_RECAPTCHA_SITE_KEY=váš_recaptcha_site_key
   ```

3. (Voliteľné) Nastavte API kľúč pre Gemini AI:

   ```
   VITE_GEMINI_API_KEY=váš_gemini_api_kľúč
   ```

4. Spustite vývojový server:

   ```bash
   npm run dev
   ```

5. Otvorte aplikáciu v prehliadači na adrese uvedenej v termináli (zvyčajne `http://localhost:5173`)

### Build pre produkciu

```bash
npm run build
```

Výstupné súbory budú v priečinku `dist/`.

## Používanie

### Prihlásenie

Aplikácia vyžaduje prihlásenie pomocou používateľského mena a hesla. Systém podporuje tri úrovne oprávnení:

- **Administrator** - úplné oprávnenia (správa používateľov, export/import, editácia všetkých dát)
- **Revítor** - prístup k revíziám a zariadeniam (nemôže editovať prevádzkovateľa ani spravovať používateľov)
- **Používateľ** - len prezeranie evidencie a tlač PDF správ

Pri prvom spustení si vytvorte vlastný účet alebo použite predvolené testovacie účty (odporúčame zmeniť heslá po prvom prihlásení).

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

- **Export**: Kliknite na tlačidlo "Export" v hlavičke - stiahne sa JSON súbor so všetkými dátami (iba Administrator)
- **Import**: Kliknite na "Import" a vyberte predtým exportovaný JSON súbor (iba Administrator)

### Správa používateľov

Administrator môže spravovať používateľské účty cez panel "Správa používateľov" (ikona používateľa v hlavičke).

## Technológie

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS (cez CDN)
- **Build tool**: Vite
- **Backend**: Firebase Firestore (NoSQL databáza)
- **Security**: Firebase App Check + reCAPTCHA v3
- **Authentication**: Custom 3-tier authentication system
- **PDF generovanie**: jsPDF + jsPDF-autotable
- **AI**: Google Gemini API
- **Deployment**: GitHub Pages + GitHub Actions
- **Perzistencia**: localStorage + Firebase Firestore

## Štruktúra projektu

```
├── components/          # React komponenty
│   ├── AssetList.tsx   # Zoznam zariadení
│   ├── AssetDetail.tsx # Detail zariadenia
│   ├── AddAssetModal.tsx
│   ├── AddInspectionModal.tsx
│   ├── OperatorModal.tsx
│   ├── GeminiAssistant.tsx
│   ├── LoginModal.tsx  # Prihlásenie
│   ├── UserManagement.tsx # Správa používateľov
│   ├── UserPanel.tsx   # Panel používateľa
│   └── icons/          # SVG ikony
├── services/           # Biznis logika
│   ├── firebaseConfig.ts    # Firebase inicializácia
│   ├── firebaseService.ts   # Firestore operácie
│   ├── authService.ts       # Autentifikácia
│   ├── persistence.ts       # Hybridná perzistencia
│   ├── pdfGenerator.ts      # Generovanie PDF
│   └── geminiService.ts     # AI integrácia
├── types.ts            # TypeScript typy
└── App.tsx             # Hlavný komponent

```

## Licencia

Všetky práva vyhradené.

## Podpora

Pre otázky a podporu vytvorte issue v repozitári alebo kontaktujte autora.
