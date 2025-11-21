// src/i18n/translations.ts
export type Language = 'en' | 'fr' | 'ar';

export interface Translations {
  // Language Selection Screen
  selectLanguage: string;
  english: string;
  french: string;
  arabic: string;
  continue: string;

  // Welcome Screen
  welcome: string;
  findDoctors: string;
  bookAppointments: string;
  manageHealth: string;
  getStarted: string;

  // Role Selection
  selectRole: string;
  imADoctor: string;
  imAPatient: string;
  doctorDescription: string;
  patientDescription: string;

  // Common
  login: string;
  register: string;
  logout: string;
  cancel: string;
  ok: string;
  yes: string;
  no: string;
  retry: string;
  save: string;
  edit: string;
  delete: string;
  search: string;
  filter: string;
  loading: string;
  error: string;
  success: string;
  back: string;
  next: string;
  submit: string;
  close: string;
  confirm: string;

  // Doctor Profile
  profile: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  address: string;
  experience: string;
  about: string;
  workingHours: string;
  bookAppointment: string;
  editProfile: string;
  viewProfile: string;

  // Home Screen
  nearbyDoctors: string;
  searchDoctors: string;
  allSpecialties: string;
  viewOnMap: string;
  viewList: string;

  // Booking
  bookingDetails: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  selectDate: string;
  selectTime: string;
  confirmBooking: string;
  bookingSuccess: string;
  bookingFailed: string;
  // Queued booking messages (optional)
  bookingQueuedTitle?: string;
  bookingQueuedMessage?: string;

  // Errors
  sessionExpired: string;
  serverError: string;
  networkError: string;
  invalidEmail: string;
  invalidPhone: string;
  requiredField: string;

  // Form Labels
  password: string;
  confirmPassword: string;
  forgotPassword: string;
  createAccount: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  signIn: string;
  signUp: string;

  // Doctor Specific
  myBookings: string;
  upcomingAppointments: string;
  pastAppointments: string;
  noBookings: string;
  acceptBooking: string;
  rejectBooking: string;
  completeBooking: string;

  // Profile Tabs & Sections
  info: string;
  services: string;
  hours: string;
  location: string;
  qualifications: string;
  years: string;
  servicesOffered: string;
  clinicLocation: string;
  closed: string;
  selectSpecialty: string;

  // Specialties
  hearing: string;
  orthopedic: string;
  brain: string;
  cardiology: string;
  dermatology: string;
  pediatrics: string;
  ophthalmology: string;
  psychiatry: string;
  gastroenterology: string;
  endocrinology: string;
  neurology: string;
  ent: string;
  urology: string;
  nephrology: string;
  oncology: string;
  gynecology: string;
  dentistry: string;
  pulmonology: string;
  rheumatology: string;
  allergy: string;
  leg: string;
  cardio: string;
  dental: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Language Selection
    selectLanguage: 'Select Your Language',
    english: 'English',
    french: 'Français',
    arabic: 'العربية',
    continue: 'Continue',

    // Welcome Screen
    welcome: 'Welcome to HealthApp',
    findDoctors: ' Doctors Near You',
    bookAppointments: 'Book appointments easily',
    manageHealth: 'Manage your health',
    getStarted: 'Get Started',

    // Role Selection
    selectRole: 'I am...',
    imADoctor: 'Doctor',
    imAPatient: 'Patient',
    doctorDescription: 'Manage appointments and patient records',
    patientDescription: 'Find and book appointments with doctors',

    // Common
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    cancel: 'Cancel',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    retry: 'Retry',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    filter: 'Filter',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',

    // Doctor Profile
    profile: 'Profile',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    specialty: 'Specialty',
    address: 'Address',
    experience: 'Experience',
    about: 'About',
    workingHours: 'Working Hours',
    bookAppointment: 'Book Appointment',

    // Home Screen
    nearbyDoctors: 'Nearby Doctors',
    searchDoctors: 'Search doctors...',
    allSpecialties: 'All Specialties',
    viewOnMap: 'Map View',
    viewList: 'List View',

    // Booking
    bookingDetails: 'Booking Details',
    patientName: 'Your Name',
    patientEmail: 'Your Email',
    patientPhone: 'Your Phone',
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    confirmBooking: 'Confirm Booking',
    bookingSuccess: 'Booking Successful',
    bookingFailed: 'Booking Failed',
    bookingQueuedTitle: 'Booking Queued',
    bookingQueuedMessage: 'Your booking was queued and will be sent when your device is online.',

    // Errors
    sessionExpired: 'Session Expired',
    serverError: 'Server Error',
    networkError: 'Network Error',
    invalidEmail: 'Invalid email address',
    invalidPhone: 'Invalid phone number',
    requiredField: 'This field is required',

    // New additions
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    close: 'Close',
    confirm: 'Confirm',
    editProfile: 'Edit Profile',
    viewProfile: 'View Profile',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    signIn: 'Sign In',
    signUp: 'Sign Up',
    myBookings: 'My Bookings',
    upcomingAppointments: 'Upcoming Appointments',
    pastAppointments: 'Past Appointments',
    noBookings: 'No bookings yet',
    acceptBooking: 'Accept',
    rejectBooking: 'Reject',
    completeBooking: 'Complete',
    
    // Profile Tabs & Sections
    info: 'Info',
    services: 'Services',
    hours: 'Hours',
    location: 'Location',
    qualifications: 'Qualifications',
    years: 'years',
    servicesOffered: 'Services Offered',
    clinicLocation: 'Clinic Location',
    closed: 'Closed',
    selectSpecialty: 'Select Specialty',

    // Specialties
    hearing: 'Hearing',
    orthopedic: 'Orthopedic',
    brain: 'Brain',
    cardiology: 'Cardiology',
    dermatology: 'Dermatology',
    pediatrics: 'Pediatrics',
    ophthalmology: 'Ophthalmology',
    psychiatry: 'Psychiatry',
    gastroenterology: 'Gastroenterology',
    endocrinology: 'Endocrinology',
    neurology: 'Neurology',
    ent: 'ENT',
    urology: 'Urology',
    nephrology: 'Nephrology',
    oncology: 'Oncology',
    gynecology: 'Gynecology',
    dentistry: 'Dentistry',
    pulmonology: 'Pulmonology',
    rheumatology: 'Rheumatology',
    allergy: 'Allergy',
    leg: 'Leg',
    cardio: 'Cardio',
    dental: 'Dental',
  },

  fr: {
    // Language Selection
    selectLanguage: 'Choisissez votre langue',
    english: 'English',
    french: 'Français',
    arabic: 'العربية',
    continue: 'Continuer',

    // Welcome Screen
    welcome: 'Bienvenue sur HealthApp',
    findDoctors: 'médecins près de chez vous',
    bookAppointments: 'Prenez rendez-vous facilement',
    manageHealth: 'Gérez votre santé',
    getStarted: 'Commencer',

    // Role Selection
    selectRole: 'Je suis...',
    imADoctor: 'Un Médecin',
    imAPatient: 'Un Patient',
    doctorDescription: 'Gérer les rendez-vous et les dossiers patients',
    patientDescription: 'Trouver et réserver des rendez-vous avec des médecins',

    // Common
    login: 'Connexion',
    register: 'S\'inscrire',
    logout: 'Déconnexion',
    cancel: 'Annuler',
    ok: 'OK',
    yes: 'Oui',
    no: 'Non',
    retry: 'Réessayer',
    save: 'Enregistrer',
    edit: 'Modifier',
    delete: 'Supprimer',
    search: 'Rechercher',
    filter: 'Filtrer',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',

    // Doctor Profile
    profile: 'Profil',
    name: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    specialty: 'Spécialité',
    address: 'Adresse',
    experience: 'Expérience',
    about: 'À propos',
    workingHours: 'Horaires de travail',
    bookAppointment: 'Prendre rendez-vous',

    // Home Screen
    nearbyDoctors: 'Médecins à proximité',
    searchDoctors: 'Rechercher des médecins...',
    allSpecialties: 'Toutes les spécialités',
    viewOnMap: 'Vue carte',
    viewList: 'Vue liste',

    // Booking
    bookingDetails: 'Détails de la réservation',
    patientName: 'Votre nom',
    patientEmail: 'Votre email',
    patientPhone: 'Votre téléphone',
    selectDate: 'Sélectionner la date',
    selectTime: 'Sélectionner l\'heure',
    confirmBooking: 'Confirmer la réservation',
    bookingSuccess: 'Réservation réussie',
    bookingFailed: 'Échec de la réservation',
    bookingQueuedTitle: 'Réservation en file',
    bookingQueuedMessage: 'Votre réservation a été mise en file et sera envoyée lorsque votre appareil sera en ligne.',

    // Errors
    sessionExpired: 'Session expirée',
    serverError: 'Erreur du serveur',
    networkError: 'Erreur réseau',
    invalidEmail: 'Adresse email invalide',
    invalidPhone: 'Numéro de téléphone invalide',
    requiredField: 'Ce champ est obligatoire',

    // New additions
    back: 'Retour',
    next: 'Suivant',
    submit: 'Soumettre',
    close: 'Fermer',
    confirm: 'Confirmer',
    editProfile: 'Modifier le profil',
    viewProfile: 'Voir le profil',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    forgotPassword: 'Mot de passe oublié?',
    createAccount: 'Créer un compte',
    alreadyHaveAccount: 'Vous avez déjà un compte?',
    dontHaveAccount: "Vous n'avez pas de compte?",
    signIn: 'Se connecter',
    signUp: 'S\'inscrire',
    myBookings: 'Mes réservations',
    upcomingAppointments: 'Rendez-vous à venir',
    pastAppointments: 'Rendez-vous passés',
    noBookings: 'Aucune réservation',
    acceptBooking: 'Accepter',
    rejectBooking: 'Rejeter',
    completeBooking: 'Terminer',
    
    // Profile Tabs & Sections
    info: 'Info',
    services: 'Services',
    hours: 'Heures',
    location: 'Emplacement',
    qualifications: 'Qualifications',
    years: 'ans',
    servicesOffered: 'Services Offerts',
    clinicLocation: 'Emplacement de la Clinique',
    closed: 'Fermé',
    selectSpecialty: 'Sélectionner la Spécialité',

    // Specialties
    hearing: 'Audition',
    orthopedic: 'Orthopédie',
    brain: 'Cerveau',
    cardiology: 'Cardiologie',
    dermatology: 'Dermatologie',
    pediatrics: 'Pédiatrie',
    ophthalmology: 'Ophtalmologie',
    psychiatry: 'Psychiatrie',
    gastroenterology: 'Gastro-entérologie',
    endocrinology: 'Endocrinologie',
    neurology: 'Neurologie',
    ent: 'ORL',
    urology: 'Urologie',
    nephrology: 'Néphrologie',
    oncology: 'Oncologie',
    gynecology: 'Gynécologie',
    dentistry: 'Dentisterie',
    pulmonology: 'Pneumologie',
    rheumatology: 'Rhumatologie',
    allergy: 'Allergie',
    leg: 'Jambe',
    cardio: 'Cardio',
    dental: 'Dentaire',
  },

  ar: {
    // Language Selection
    selectLanguage: 'اختر لغتك',
    english: 'English',
    french: 'Français',
    arabic: 'العربية',
    continue: 'متابعة',

    // Welcome Screen
    welcome: 'مرحبا بك في تطبيق الصحة',
    findDoctors: 'الأطباء بالقرب منك',
    bookAppointments: 'احجز المواعيد بسهولة',
    manageHealth: 'أدر صحتك',
    getStarted: 'ابدأ الآن',

    // Role Selection
    selectRole: 'أنا...',
    imADoctor: 'طبيب',
    imAPatient: 'مريض',
    doctorDescription: 'إدارة المواعيد وسجلات المرضى',
    patientDescription: 'ابحث واحجز مواعيد مع الأطباء',

    // Common
    login: 'تسجيل الدخول',
    register: 'التسجيل',
    logout: 'تسجيل الخروج',
    cancel: 'إلغاء',
    ok: 'حسنا',
    yes: 'نعم',
    no: 'لا',
    retry: 'إعادة المحاولة',
    save: 'حفظ',
    edit: 'تعديل',
    delete: 'حذف',
    search: 'بحث',
    filter: 'تصفية',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',

    // Doctor Profile
    profile: 'الملف الشخصي',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    specialty: 'التخصص',
    address: 'العنوان',
    experience: 'الخبرة',
    about: 'حول',
    workingHours: 'ساعات العمل',
    bookAppointment: 'حجز موعد',

    // Home Screen
    nearbyDoctors: 'الأطباء القريبون',
    searchDoctors: 'ابحث عن أطباء...',
    allSpecialties: 'جميع التخصصات',
    viewOnMap: 'عرض الخريطة',
    viewList: 'عرض القائمة',

    // Booking
    bookingDetails: 'تفاصيل الحجز',
    patientName: 'اسمك',
    patientEmail: 'بريدك الإلكتروني',
    patientPhone: 'هاتفك',
    selectDate: 'اختر التاريخ',
    selectTime: 'اختر الوقت',
    confirmBooking: 'تأكيد الحجز',
    bookingSuccess: 'تم الحجز بنجاح',
    bookingFailed: 'فشل الحجز',
    bookingQueuedTitle: 'تم وضع الحجز في الطابور',
    bookingQueuedMessage: 'تم وضع حجرك في قائمة الانتظار وسيتم إرساله بمجرد أن يكون جهازك متصلاً بالإنترنت.',

    // Errors
    sessionExpired: 'انتهت الجلسة',
    serverError: 'خطأ في الخادم',
    networkError: 'خطأ في الشبكة',
    invalidEmail: 'عنوان بريد إلكتروني غير صالح',

    // Navigation & Actions
    back: 'رجوع',
    next: 'التالي',
    submit: 'إرسال',
    close: 'إغلاق',
    confirm: 'تأكيد',
    editProfile: 'تعديل الملف الشخصي',
    viewProfile: 'عرض الملف الشخصي',

    // Authentication
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    forgotPassword: 'هل نسيت كلمة المرور؟',
    createAccount: 'إنشاء حساب',
    alreadyHaveAccount: 'هل لديك حساب؟',
    dontHaveAccount: 'ليس لديك حساب؟',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',

    // Bookings Management
    myBookings: 'حجوزاتي',
    upcomingAppointments: 'المواعيد القادمة',
    pastAppointments: 'المواعيد السابقة',
    noBookings: 'لا توجد حجوزات',
    acceptBooking: 'قبول',
    rejectBooking: 'رفض',
    completeBooking: 'إكمال',
    invalidPhone: 'رقم هاتف غير صالح',
    requiredField: 'هذا الحقل مطلوب',
    
    // Profile Tabs & Sections
    info: 'معلومات',
    services: 'الخدمات',
    hours: 'الساعات',
    location: 'الموقع',
    qualifications: 'المؤهلات',
    years: 'سنوات',
    servicesOffered: 'الخدمات المقدمة',
    clinicLocation: 'موقع العيادة',
    closed: 'مغلق',
    selectSpecialty: 'اختر التخصص',

    // Specialties
    hearing: 'السمع',
    orthopedic: 'العظام',
    brain: 'الدماغ',
    cardiology: 'القلب',
    dermatology: 'الجلدية',
    pediatrics: 'الأطفال',
    ophthalmology: 'العيون',
    psychiatry: 'الطب النفسي',
    gastroenterology: 'الجهاز الهضمي',
    endocrinology: 'الغدد الصماء',
    neurology: 'الأعصاب',
    ent: 'الأنف والأذن والحنجرة',
    urology: 'المسالك البولية',
    nephrology: 'الكلى',
    oncology: 'الأورام',
    gynecology: 'النساء والتوليد',
    dentistry: 'الأسنان',
    pulmonology: 'الصدرية',
    rheumatology: 'الروماتيزم',
    allergy: 'الحساسية',
    leg: 'الساق',
    cardio: 'القلب',
    dental: 'الأسنان',
  },
};
