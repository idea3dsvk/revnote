import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from '@firebase/app-check';

// Firebase konfigurácia - tieto hodnoty získate z Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Kontrola či sú Firebase credentials nastavené
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

console.log('Firebase Configuration Status:', {
  isConfigured: isFirebaseConfigured,
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey
});

// Inicializácia Firebase
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Firebase App Check temporarily disabled due to configuration issues
    // Uncomment below when reCAPTCHA is properly configured
    /*
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (recaptchaSiteKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log('Firebase App Check initialized successfully');
    } else {
      console.warn('reCAPTCHA Site Key not configured. App Check disabled.');
    }
    */
    
    console.log('Firebase initialized successfully (App Check disabled)');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
} else {
  console.warn('Firebase not configured. Please set up environment variables.');
}

export { db, auth, isFirebaseConfigured };
export default app;
