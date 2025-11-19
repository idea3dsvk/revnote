# Deployment Checklist - Oprava Synchronizácie

## Pred Deploymentom

- [x] Opravená real-time synchronizácia v `App.tsx`
- [x] Opravené loadovanie dát v `persistence.ts`
- [x] Opravený názov kolekcie v `firebaseService.ts`
- [x] Skontrolované TypeScript chyby

## Deployment Kroky

1. **Commit zmien do Git:**
   ```powershell
   git add .
   git commit -m "Fix: Oprava synchronizácie dát medzi zariadeniami - aktivovaná real-time sync"
   ```

2. **Push do GitHub:**
   ```powershell
   git push origin master
   ```

3. **GitHub Actions automaticky deployuje:**
   - Počkajte 2-3 minúty na build a deployment
   - Skontrolujte v GitHub Actions tab či deployment prebehol úspešne

## Po Deplomente

### Kroky na Testovacích Zariadeniach:

1. **Vyčistite cache:**
   - Chrome/Edge: `Ctrl + Shift + Delete` → Vymazať cache a cookies pre poslednú hodinu
   - Firefox: `Ctrl + Shift + Delete` → Vymazať cache

2. **Hard refresh:**
   - `Ctrl + F5` alebo `Ctrl + Shift + R`

3. **Prihláste sa znovu:**
   - Odhláste sa a prihláste sa znovu

### Testovanie Synchronizácie:

**Test 1 - Pridanie zariadenia:**
1. Otvorte https://idea3dsvk.github.io/revnote/ na dvoch zariadeniach/prehliadačoch
2. Prihláste sa s rovnakým účtom na oboch
3. Na zariadení A pridajte nové zariadenie
4. ✅ Na zariadení B by sa zariadenie malo automaticky zobraziť (do ~1 sekundy)

**Test 2 - Pridanie revízie:**
1. Na zariadení A pridajte revíziu k zariadeniu
2. ✅ Na zariadení B by sa revízia mala automaticky zobraziť

**Test 3 - Úprava operátora:**
1. Na zariadení A upravte údaje prevádzkovateľa
2. ✅ Na zariadení B by sa mali automaticky aktualizovať

**Test 4 - Vymazanie:**
1. Vyberte rovnaké zariadenie na oboch zariadeniach
2. Na zariadení A zariadenie vymažte
3. ✅ Na zariadení B by sa malo automaticky zrušiť označenie

## Monitorovanie

Otvorte Developer Console (F12) a sledujte logy:

### Úspešné správy:
```
Firebase initialized successfully
Real-time assets update received: X
Real-time operator update received
Assets synced to Firebase
```

### Chybové správy (ak sa vyskytnú):
```
Error in assets subscription: [detaily]
Error loading from Firebase: [detaily]
```

## Riešenie Problémov

### Synchronizácia nefunguje:

1. **Skontrolujte Firebase Console:**
   - https://console.firebase.google.com/
   - Firestore Database → Skontrolujte kolekcie `assets`, `operators`
   - Skontrolujte či sa dáta zapisujú

2. **Skontrolujte prihlásenie:**
   - Authentication → Users
   - Používateľ musí byť `isActive: true`

3. **Skontrolujte pravidlá:**
   - Firestore Database → Rules
   - Pravidlá musia povoliť čítanie pre prihlásených používateľov

4. **Skontrolujte konzolu prehliadača:**
   - F12 → Console
   - Hľadajte červené error messages

### Staré dáta sa stále zobrazujú:

1. Odhláste sa
2. Vyčistite localStorage: `localStorage.clear()` v konzole
3. Hard refresh: `Ctrl + F5`
4. Prihláste sa znovu

### "Permission denied" chyby:

1. Skontrolujte Firestore Rules
2. Skontrolujte či je používateľ aktívny
3. Skontrolujte rolu používateľa (USER/REVISOR/ADMINISTRATOR)

## Rollback (V prípade kritického problému)

Ak synchronizácia spôsobí vážne problémy:

1. **Dočasne vypnite real-time sync:**
   ```typescript
   // V App.tsx zakomentujte useEffect pre real-time sync
   ```

2. **Revertujte commit:**
   ```powershell
   git revert HEAD
   git push origin master
   ```

3. **Aplikácia sa vráti k predošlému stavu**
   - Dáta sa budú synchronizovať iba manuálne (refresh)
   - Strata funkcionality real-time sync, ale zachová sa stabilita

## Kontakt v Prípade Problémov

- Skontrolujte `SYNC_FIX_SUMMARY.md` pre detailné informácie
- Skontrolujte GitHub Issues pre známe problémy
- Logs v Developer Console (F12) pre diagnostiku
