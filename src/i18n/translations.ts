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
  nearbyDoctorsOnMap: string;
  searchDoctors: string;
  allSpecialties: string;
  viewOnMap: string;
  viewList: string;

  // DoctorCard
  directions: string;
  // Booking
  bookingDetails: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  selectDate: string;
  selectTime: string;
  selectDateOrTime: string;
  confirmBooking: string;
  bookingSuccess: string;
  bookingFailed: string;
  // Queued booking messages (optional)
  bookingQueuedTitle?: string;
  bookingQueuedMessage?: string;

  // Onboarding specific
  skip: string;
  quickEasy: string;
  endToEndEncryption: string;
  hipaaCompliant: string;
  secureCloudStorage: string;
  liveConsultations: string;
  emergencySupport: string;
  healthMonitoring: string;
  // Onboarding original titles/subtitles/features
  onb_booking_title: string;
  onb_booking_subtitle: string;
  onb_booking_feature_1: string;
  onb_booking_feature_2: string;
  onb_booking_feature_3: string;

  onb_security_title: string;
  onb_security_subtitle: string;
  onb_security_feature_1: string;
  onb_security_feature_2: string;
  onb_security_feature_3: string;

  onb_support_title: string;
  onb_support_subtitle: string;
  onb_support_feature_1: string;
  onb_support_feature_2: string;
  onb_support_feature_3: string;

  // Errors
  sessionExpired: string;
  serverError: string;
  networkError: string;
  invalidEmail: string;
  invalidPhone: string;
  invalidDoctorName: string;
  requiredField: string;
  passwordTooShort: string;
  passwordsDontMatch: string;
  // DoctorBookings and UI
  doctorIdNotFound: string;
  failedLoadAppointments: string;
  loadingAppointments: string;
  offlineCached: string;
  updated: string;
  patients: string;
  all: string;
  date: string;
  time: string;
  deleteRecord: string;
  scheduleClear: string;
  noAppointmentsFiltered: string;
  canceled: string;
  loadingMore: string;
  today: string;
  tomorrow: string;

  // Form Labels
  password: string;
  confirmPassword: string;
  forgotPassword: string;
  createAccount: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  signIn: string;
  signUp: string;
  registrationCreatedMessage: string;
  registrationFailedDefault: string;
  registrationFailedTitle: string;

  // Doctor Specific
  myBookings: string;
  upcomingAppointments: string;
  pastAppointments: string;
  noBookings: string;
  noUpcomingAppointments: string;
  confirmed: string;
  pending: string;
  showLess: string;
  showMore: string; // use '{count}' placeholder
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
    nearbyDoctorsOnMap: 'Zoom in to see doctors',
    searchDoctors: 'Search doctors...',
    allSpecialties: 'All Specialties',
    viewOnMap: 'Map View',
    viewList: 'List View',
    // DoctorCard
    directions: 'Direction',
    // Booking
    bookingDetails: 'Booking Details',
    patientName: 'Your Name',
    patientEmail: 'Your Email',
    patientPhone: 'Your Phone',
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    selectDateOrTime: 'Please select date or hour',
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
    invalidDoctorName: "Name must start with 'Dr.' e.g. Dr. Ahmed",
    requiredField: 'This field is required',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordsDontMatch: 'Passwords do not match',
    registrationCreatedMessage: 'Account created successfully. Please log in.',
    registrationFailedDefault: 'Registration failed. Please try again.',
    registrationFailedTitle: 'Registration Failed',

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
    createAccount: 'Create',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    signIn: 'Sign In',
    signUp: 'Sign Up',
    myBookings: 'My Bookings',
    upcomingAppointments: 'Upcoming Appointments',
    pastAppointments: 'Past Appointments',
    noBookings: 'No bookings yet',
    noUpcomingAppointments: 'No upcoming appointments',
    confirmed: 'Confirmed',
    pending: 'Pending',
    showLess: 'Show Less',
    showMore: 'Show {count} More',
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
    // Onboarding extras
    skip: 'Skip',
    quickEasy: 'Quick & Easy',
    endToEndEncryption: 'End-to-End Encryption',
    hipaaCompliant: 'HIPAA Compliant',
    secureCloudStorage: 'Secure Cloud Storage',
    liveConsultations: 'Live Consultations',
    emergencySupport: 'Emergency Support',
    healthMonitoring: 'Health Monitoring',
    // Onboarding original titles/subtitles/features (English originals)
    onb_booking_title: 'Book Appointments',
    onb_booking_subtitle: 'Quick & Easy',
    onb_booking_feature_1: 'Find Nearby Doctors',
    onb_booking_feature_2: 'Instant Booking',
    onb_booking_feature_3: 'Smart Reminders',

    onb_security_title: 'Secure Health Records',
    onb_security_subtitle: 'Privacy First',
    onb_security_feature_1: 'End-to-End Encryption',
    onb_security_feature_2: 'HIPAA Compliant',
    onb_security_feature_3: 'Secure Cloud Storage',

    onb_support_title: '24/7 Care Support',
    onb_support_subtitle: 'Always Here',
    onb_support_feature_1: 'Live Consultations',
    onb_support_feature_2: 'Emergency Support',
    onb_support_feature_3: 'Health Monitoring',
    // DoctorBookings additions
    doctorIdNotFound: 'Doctor ID not found.',
    failedLoadAppointments: 'Failed to load appointments. Please check your connection.',
    loadingAppointments: 'Loading appointments...',
    offlineCached: 'Offline - Showing cached data',
    updated: 'Updated {time}',
    patients: '{count} patients',
    all: 'All',
    date: 'Date',
    time: 'Time',
    deleteRecord: 'Delete Record',
    scheduleClear: 'Your schedule is clear',
    noAppointmentsFiltered: 'No {type} appointments',
    canceled: 'Canceled',
    loadingMore: 'Loading more...',
    today: 'Today',
    tomorrow: 'Tomorrow',
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
    nearbyDoctorsOnMap: 'Zoomer pour voir les médecins',
    searchDoctors: 'Rechercher des médecins...',
    allSpecialties: 'Toutes les spécialités',
    viewOnMap: 'Vue carte',
    viewList: 'Vue liste',

    // DoctorCard
    directions: 'Direction',

    // Booking
    bookingDetails: 'Détails de la réservation',
    patientName: 'Votre nom',
    patientEmail: 'Votre email',
    patientPhone: 'Votre téléphone',
    selectDate: 'Sélectionner la date',
    selectTime: 'Sélectionner l\'heure',
    selectDateOrTime: 'Veuillez sélectionner la date ou l\'heure',
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
    invalidDoctorName: "Le nom doit commencer par 'Dr.' ex: Dr. Ahmed",
    requiredField: 'Ce champ est obligatoire',
    passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères',
    passwordsDontMatch: 'Les mots de passe ne correspondent pas',
    registrationCreatedMessage: 'Compte créé avec succès. Veuillez vous connecter.',
    registrationFailedDefault: 'Échec de l\'inscription. Veuillez réessayer.',
    registrationFailedTitle: 'Échec de l\'inscription',

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
    createAccount: 'Créer',
    alreadyHaveAccount: 'Vous avez déjà un compte?',
    dontHaveAccount: "Vous n'avez pas de compte?",
    signIn: 'Se connecter',
    signUp: 'S\'inscrire',
    myBookings: 'Mes réservations',
    upcomingAppointments: 'Rendez-vous à venir',
    pastAppointments: 'Rendez-vous passés',
    noBookings: 'Aucune réservation',
    noUpcomingAppointments: 'Aucun rendez-vous à venir',
    confirmed: 'Confirmé',
    pending: 'En attente',
    showLess: 'Montrer moins',
    showMore: 'Afficher {count} de plus',
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
    // Onboarding extras
    skip: 'Passer',
    quickEasy: 'Rapide et Facile',
    endToEndEncryption: 'Chiffrement de bout en bout',
    hipaaCompliant: 'Conforme HIPAA',
    secureCloudStorage: 'Stockage Cloud Sécurisé',
    liveConsultations: 'Consultations en direct',
    emergencySupport: 'Assistance d\'urgence',
    healthMonitoring: 'Surveillance de la santé',
    // Onboarding original titles/subtitles/features (using English originals for now)
    onb_booking_title: 'Prendre rendez-vous',
    onb_booking_subtitle: 'Rapide et Facile',
    onb_booking_feature_1: 'Trouver des médecins à proximité',
    onb_booking_feature_2: 'Réservation instantanée',
    onb_booking_feature_3: 'Rappels intelligents',
    onb_security_title: 'Archives sécurisées',
    onb_security_subtitle: 'La confidentialité avant tout',
    onb_security_feature_1: 'Chiffrement de bout en bout',
    onb_security_feature_2: 'Conforme HIPAA',
    onb_security_feature_3: 'Stockage Cloud Sécurisé',

    onb_support_title: 'Support de soins 24/7',
    onb_support_subtitle: 'Toujours là',
    onb_support_feature_1: 'Consultations en direct',
    onb_support_feature_2: 'Support d\'urgence',
    onb_support_feature_3: 'Surveillance de la santé',
    // DoctorBookings additions (French)
    doctorIdNotFound: 'ID du médecin introuvable.',
    failedLoadAppointments: 'Échec du chargement des rendez-vous. Veuillez vérifier votre connexion.',
    loadingAppointments: 'Chargement des rendez-vous...',
    offlineCached: 'Hors ligne - affichage des données en cache',
    updated: 'Mis à jour {time}',
    patients: '{count} patients',
    all: 'Tous',
    date: 'Date',
    time: 'Heure',
    deleteRecord: 'Supprimer l\'enregistrement',
    scheduleClear: 'Votre planning est vide',
    noAppointmentsFiltered: 'Aucun rendez-vous {type}',
    canceled: 'Annulé',
    loadingMore: 'Chargement...',
    today: 'Aujourd\'hui',
    tomorrow: 'Demain',
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
    nearbyDoctorsOnMap: 'قم بالتكبير لرؤية الأطباء',
    searchDoctors: 'ابحث عن أطباء...',
    allSpecialties: 'جميع التخصصات',
    viewOnMap: 'عرض الخريطة',
    viewList: 'عرض القائمة',

    // DoctorCard
    directions: 'اتجاه',

    // Booking
    bookingDetails: 'تفاصيل الحجز',
    patientName: 'اسمك',
    patientEmail: 'بريدك الإلكتروني',
    patientPhone: 'هاتفك',
    selectDate: 'اختر التاريخ',
    selectTime: 'اختر الوقت',
    selectDateOrTime: 'الرجاء اختيار التاريخ أو الوقت',
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

    passwordTooShort: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل',
    passwordsDontMatch: 'كلمات المرور غير متطابقة',
    registrationCreatedMessage: 'تم إنشاء الحساب بنجاح. يرجى تسجيل الدخول.',
    registrationFailedDefault: 'فشل التسجيل. حاول مرة أخرى.',
    registrationFailedTitle: 'فشل التسجيل',

    // Navigation & Actions
    back: 'رجوع',
    next: 'التالي',
    submit: 'إرسال',
    close: 'إغلاق',
    confirm: 'تأكيد',
    editProfile: 'تعديل الملف الشخصي',
    viewProfile: 'الملف الشخصي',

    // Authentication
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    forgotPassword: 'هل نسيت كلمة المرور؟',
    createAccount: 'إنشاء',
    alreadyHaveAccount: 'هل لديك حساب؟',
    dontHaveAccount: 'ليس لديك حساب؟',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',

    // Bookings Management
    myBookings: 'حجوزاتي',
    upcomingAppointments: 'المواعيد القادمة',
    pastAppointments: 'المواعيد السابقة',
    noBookings: 'لا توجد حجوزات',
    noUpcomingAppointments: 'لا توجد مواعيد قادمة',
    confirmed: 'مؤكد',
    pending: 'قيد الانتظار',
    showLess: 'عرض أقل',
    showMore: 'عرض {count} المزيد',
    acceptBooking: 'قبول',
    rejectBooking: 'رفض',
    completeBooking: 'إكمال',
    invalidPhone: 'رقم هاتف غير صالح',
    invalidDoctorName: "الاسم يجب أن يبدأ بـ 'Dr.' مثال: Dr. Ahmed",
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
    // Onboarding extras
    skip: 'تخطي',
    quickEasy: 'سريع وسهل',
    endToEndEncryption: 'تشفير من الطرف إلى الطرف',
    hipaaCompliant: 'متوافق مع HIPAA',
    secureCloudStorage: 'تخزين سحابي آمن',
    liveConsultations: 'استشارات مباشرة',
    emergencySupport: 'دعم الطوارئ',
    healthMonitoring: 'مراقبة الصحة',
    // Onboarding original titles/subtitles/features
    onb_booking_title: 'حجز المواعيد',
    onb_booking_subtitle: 'سريع وسهل',
    onb_booking_feature_1: 'ابحث عن أطباء قريبين',
    onb_booking_feature_2: 'حجز فوري',
    onb_booking_feature_3: 'تذكيرات ذكية',
    onb_security_title: 'سجلات صحية آمنة',
    onb_security_subtitle: 'الخصوصية أولاً',
    onb_security_feature_1: 'تشفير من الطرف إلى الطرف',
    onb_security_feature_2: 'متوافق مع HIPAA',
    onb_security_feature_3: 'تخزين سحابي آمن',

    onb_support_title: 'دعم الرعاية 24/7',
    onb_support_subtitle: 'دائمًا هنا',
    onb_support_feature_1: 'استشارات مباشرة',
    onb_support_feature_2: 'دعم الطوارئ',
    onb_support_feature_3: 'مراقبة الصحة',
    // DoctorBookings additions (Arabic)
    doctorIdNotFound: 'لم يتم العثور على معرف الطبيب.',
    failedLoadAppointments: 'فشل في تحميل المواعيد. يرجى التحقق من اتصالك.',
    loadingAppointments: 'جاري تحميل المواعيد...',
    offlineCached: 'غير متصل - عرض البيانات المخزنة مؤقتًا',
    updated: 'تم التحديث {time}',
    patients: '{count} مرضى',
    all: 'الكل',
    date: 'التاريخ',
    time: 'الوقت',
    deleteRecord: 'حذف السجل',
    scheduleClear: 'جدولك فارغ',
    noAppointmentsFiltered: 'لا توجد مواعيد {type}',
    canceled: 'ملغى',
    loadingMore: 'جاري التحميل...',
    today: 'اليوم',
    tomorrow: 'غدًا',
  },
};
