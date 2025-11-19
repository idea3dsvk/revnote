# Oprava Synchronizácie Dát - 19.11.2025

## Problém
Aplikácia bežiaca na https://idea3dsvk.github.io/revnote/ mala nefunkčnú synchronizáciu dát medzi rôznymi počítačmi.

## Príčina
1. **Real-time listeners boli vypnuté** - V `App.tsx` bola zakázaná real-time synchronizácia s komentárom o race conditions
2. **Dáta sa načítali iba raz** - Pri spustení aplikácie sa dáta načítali z Firebase, ale potom už aplikácia nepočúvala zmeny
3. **Nekonzistentné loadovanie** - `persistence.ts` vrátil localStorage dáta namiesto Firebase dát, ak Firebase vrátilo prázdne pole
4. **Nesprávny názov kolekcie** - Kolekcia pre operator bola definovaná ako `'operator'` ale v Firestore pravidlách bola `'operators'`

## Riešenie

### 1. Aktivácia Real-time Listeners (`App.tsx`)
Pridaný `useEffect` hook, ktorý:
- Počúva real-time zmeny z Firebase pre assets a operator
- Automaticky aktualizuje lokálny stav pri zmene dát v Firebase
- Aktualizuje localStorage cache pri každej zmene
- Resetuje výber zariadenia, ak bolo vymazané na inom zariadení
- Automaticky sa odhlási pri zmene používateľa alebo unmount komponenty

```typescript
useEffect(() => {
  if (!currentUser) return;

  const { default: firebaseService } = require('./services/firebaseService');
  
  const unsubscribeAssets = firebaseService.subscribeToAssets((firebaseAssets: Asset[]) => {
    if (firebaseAssets.length > 0) {
      setAssets(firebaseAssets);
      // Update selection if needed
      // Update localStorage cache
    }
  });

  const unsubscribeOperator = firebaseService.subscribeToOperator((firebaseOperator: Operator | null) => {
    if (firebaseOperator) {
      setOperator(firebaseOperator);
      // Update localStorage cache
    }
  });

  return () => {
    unsubscribeAssets();
    unsubscribeOperator();
  };
}, [currentUser]);
```

### 2. Oprava Loadovania Dát (`persistence.ts`)

**Pred:**
```typescript
const firebaseAssets = await firebaseService.loadAssetsFromFirebase();
if (firebaseAssets.length > 0) {
  localStorage.setItem(ASSETS_KEY, JSON.stringify(firebaseAssets));
  return firebaseAssets;
}
// Fallback na localStorage - tento kód spôsoboval problém
```

**Po:**
```typescript
const firebaseAssets = await firebaseService.loadAssetsFromFirebase();
// Vždy ulož do localStorage ako cache (aj prázdne pole)
localStorage.setItem(ASSETS_KEY, JSON.stringify(firebaseAssets));
return firebaseAssets;
```

Teraz aplikácia:
- Vždy preferuje Firebase dáta
- LocalStorage používa iba ako cache
- Pri chybe Firebase použije localStorage ako fallback

### 3. Oprava Názvu Kolekcie (`firebaseService.ts`)

```typescript
const COLLECTIONS = {
  ASSETS: 'assets',
  OPERATOR: 'operators',  // Zmenené z 'operator' na 'operators'
  USERS: 'users',
  SETTINGS: 'settings'
};
```

## Ako Synchronizácia Funguje

1. **Pri spustení aplikácie:**
   - Načítajú sa dáta z Firebase
   - Uložia sa do localStorage ako cache
   - Spustia sa real-time listeners

2. **Pri zmene na zariadení A:**
   - Zmena sa uloží lokálne (optimistický update)
   - Okamžite sa synchronizuje do Firebase
   - Firebase notifikuje všetky ostatné zariadenia

3. **Pri zmene na zariadení B:**
   - Real-time listener zachytí zmenu z Firebase
   - Automaticky aktualizuje lokálny stav
   - Aktualizuje localStorage cache
   - Používateľ vidí zmenu bez potreby refreshu

## Testovanie

### Test 1: Pridanie zariadenia
1. Otvorte aplikáciu na dvoch zariadeniach (alebo dvoch prehliadačoch)
2. Na zariadení A pridajte nové zariadenie
3. Zariadenie B by malo automaticky zobraziť nové zariadenie

### Test 2: Pridanie revízie
1. Otvorte aplikáciu na dvoch zariadeniach
2. Na zariadení A pridajte revíziu k zariadeniu
3. Zariadenie B by malo automaticky zobraziť novú revíziu

### Test 3: Vymazanie zariadenia
1. Otvorte aplikáciu na dvoch zariadeniach
2. Vyberte rovnaké zariadenie na oboch zariadeniach
3. Na zariadení A vymažte zariadenie
4. Zariadenie B by malo automaticky zrušiť výber

### Test 4: Zmena operátora
1. Otvorte aplikáciu na dvoch zariadeniach
2. Na zariadení A zmeňte údaje operátora
3. Zariadenie B by malo automaticky zobraziť nové údaje

## Čo Ostáva Rovnaké

- **Explicitné ukladanie**: Každá operácia (add, update, delete) stále explicitne ukladá do Firebase
- **LocalStorage cache**: LocalStorage sa stále používa ako offline cache
- **Fallback mechanizmus**: Pri výpadku Firebase sa používa localStorage

## Možné Problémy a Riešenia

### Ak synchronizácia nefunguje:
1. **Skontrolujte Firebase Console**: Uistite sa, že dáta sú v Firebase
2. **Skontrolujte pravidlá**: Firestore pravidlá musia povoliť čítanie a zápis
3. **Skontrolujte konzolu**: Hľadajte chybové správy v Developer Console
4. **Skontrolujte prihlásenie**: Real-time sync funguje iba pre prihlásených používateľov

### Ak vidíte "race conditions":
- Real-time listener teraz čaká na dokončenie načítania dát
- Aktualizuje iba ak sú dáta z Firebase
- LocalStorage sa aktualizuje až po úspešnej synchronizácii

## Deployment

Po deploymente na GitHub Pages:
1. Vyčistite cache prehliadača (Ctrl+Shift+Delete)
2. Obnovte stránku (Ctrl+F5)
3. Prihláste sa znovu
4. Testujte synchronizáciu na viacerých zariadeniach

## Monitoring

V konzole prehliadača uvidíte:
- `Real-time assets update received: X` - Keď prídu nové dáta z Firebase
- `Real-time operator update received` - Keď sa zmení operátor
- `Assets synced to Firebase` - Keď sa dáta uložia do Firebase

## Ďalšie Vylepšenia (Voliteľné)

Pre budúce verzie môžete pridať:
1. **Conflict resolution**: Detekcia a riešenie konfliktov pri súčasných úpravách
2. **Optimistic locking**: Zabránenie prepísania novších dát staršími
3. **Timestamp tracking**: Sledovanie času poslednej úpravy každého záznamu
4. **Offline support**: Lepšia podpora offline režimu s queue systémom
5. **User awareness**: Zobrazenie kto práve upravuje dáta
