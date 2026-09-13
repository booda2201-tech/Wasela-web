import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppLanguage = 'en' | 'ar';

const STORAGE_KEY = 'waseela.lang';

export function pickLocalized(
  lang: AppLanguage,
  en: string | null | undefined,
  ar: string | null | undefined
): string | null {
  const primary = lang === 'ar' ? ar : en;
  const fallback = lang === 'ar' ? en : ar;
  if (primary?.trim()) {
    return primary.trim();
  }
  if (fallback?.trim()) {
    return fallback.trim();
  }
  return null;
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly langSubject = new BehaviorSubject<AppLanguage>(this.readStored());

  readonly lang$ = this.langSubject.asObservable();

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.applyDocumentLang(this.langSubject.value);
  }

  get current(): AppLanguage {
    return this.langSubject.value;
  }

  get isArabic(): boolean {
    return this.current === 'ar';
  }

  setLanguage(lang: AppLanguage): void {
    if (this.langSubject.value === lang) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore storage errors (private mode, etc.).
    }
    this.langSubject.next(lang);
    this.applyDocumentLang(lang);
  }

  toggleLanguage(): void {
    this.setLanguage(this.current === 'en' ? 'ar' : 'en');
  }

  pick(en: string | null | undefined, ar: string | null | undefined): string | null {
    return pickLocalized(this.current, en, ar);
  }

  label(key: AppLabelKey): string {
    return APP_LABELS[key][this.current];
  }

  private readStored(): AppLanguage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'ar' || stored === 'en') {
        return stored;
      }
    } catch {
      // Ignore storage errors (private mode, etc.).
    }
    return 'en';
  }

  private applyDocumentLang(lang: AppLanguage): void {
    const html = this.document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.document.body.classList.toggle('lang-ar', lang === 'ar');
    this.document.body.classList.toggle('lang-en', lang === 'en');
  }
}

export type NavLabelKey =
  | 'home'
  | 'merchants'
  | 'categories'
  | 'aboutUs'
  | 'contactUs'
  | 'downloadNow'
  | 'language';

export type FooterLabelKey =
  | 'mainPages'
  | 'quickLinks'
  | 'learnMore'
  | 'careers'
  | 'blogs'
  | 'faq'
  | 'privacyPolicy'
  | 'termsConditions'
  | 'joinUs'
  | 'licensedByFra'
  | 'trnNumber'
  | 'crn'
  | 'followUs'
  | 'downloadTheApp'
  | 'googlePlay'
  | 'appStore'
  | 'aurCapital'
  | 'copyright';

export type ContactLabelKey =
  | 'firstName'
  | 'lastName'
  | 'phoneNumber'
  | 'emailAddress'
  | 'message'
  | 'firstNamePlaceholder'
  | 'lastNamePlaceholder'
  | 'phonePlaceholder'
  | 'emailPlaceholder'
  | 'messagePlaceholder'
  | 'submit'
  | 'submitting'
  | 'errFirstName'
  | 'errLastName'
  | 'errPhone'
  | 'errEmail'
  | 'errMessage'
  | 'sendSuccess'
  | 'sendMailFallback'
  | 'sendError'
  | 'pageLoadError';

export type JoinLabelKey =
  | 'joinSubtitle'
  | 'commercialRegisterQuestion'
  | 'selectAnOption'
  | 'optionYes'
  | 'optionNo'
  | 'companyName'
  | 'companyNamePlaceholder'
  | 'contactPersonName'
  | 'contactPersonNamePlaceholder'
  | 'contactPersonPhone'
  | 'contactPersonPhonePlaceholder'
  | 'category'
  | 'categoryPlaceholder'
  | 'websiteLink'
  | 'websiteLinkPlaceholder'
  | 'governorate'
  | 'selectGovernorate'
  | 'numberOfBranches'
  | 'numberOfBranchesPlaceholder'
  | 'averageMonthlySales'
  | 'averageMonthlySalesPlaceholder'
  | 'errCommercialRegister'
  | 'errCompanyName'
  | 'errContactPersonName'
  | 'errContactPersonPhone'
  | 'errCategory'
  | 'errGovernorate'
  | 'errBranches'
  | 'errSales'
  | 'joinSuccess'
  | 'joinError'
  | 'joinPageLoadError';

export type AppLabelKey = NavLabelKey | FooterLabelKey | ContactLabelKey | JoinLabelKey;

/** Governorate values are stable API keys — only the display name is localized. */
export const EGYPT_GOVERNORATES: ReadonlyArray<{
  value: string;
  en: string;
  ar: string;
}> = [
  { value: 'alexandria', en: 'Alexandria', ar: 'الإسكندرية' },
  { value: 'aswan', en: 'Aswan', ar: 'أسوان' },
  { value: 'assiut', en: 'Assiut', ar: 'أسيوط' },
  { value: 'beheira', en: 'Beheira', ar: 'البحيرة' },
  { value: 'beni-suef', en: 'Beni Suef', ar: 'بني سويف' },
  { value: 'cairo', en: 'Cairo', ar: 'القاهرة' },
  { value: 'dakahlia', en: 'Dakahlia', ar: 'الدقهلية' },
  { value: 'damietta', en: 'Damietta', ar: 'دمياط' },
  { value: 'fayoum', en: 'Fayoum', ar: 'الفيوم' },
  { value: 'gharbia', en: 'Gharbia', ar: 'الغربية' },
  { value: 'giza', en: 'Giza', ar: 'الجيزة' },
  { value: 'ismailia', en: 'Ismailia', ar: 'الإسماعيلية' },
  { value: 'kafr-el-sheikh', en: 'Kafr El Sheikh', ar: 'كفر الشيخ' },
  { value: 'luxor', en: 'Luxor', ar: 'الأقصر' },
  { value: 'matrouh', en: 'Matrouh', ar: 'مطروح' },
  { value: 'menofia', en: 'Menofia', ar: 'المنوفية' },
  { value: 'minya', en: 'Minya', ar: 'المنيا' },
  { value: 'new-valley', en: 'New Valley', ar: 'الوادي الجديد' },
  { value: 'north-sinai', en: 'North Sinai', ar: 'شمال سيناء' },
  { value: 'port-said', en: 'Port Said', ar: 'بورسعيد' },
  { value: 'qalyubia', en: 'Qalyubia', ar: 'القليوبية' },
  { value: 'qena', en: 'Qena', ar: 'قنا' },
  { value: 'red-sea', en: 'Red Sea', ar: 'البحر الأحمر' },
  { value: 'sharqia', en: 'Sharqia', ar: 'الشرقية' },
  { value: 'sohag', en: 'Sohag', ar: 'سوهاج' },
  { value: 'south-sinai', en: 'South Sinai', ar: 'جنوب سيناء' },
  { value: 'suez', en: 'Suez', ar: 'السويس' },
];

const APP_LABELS: Record<AppLabelKey, Record<AppLanguage, string>> = {
  home: { en: 'Home', ar: 'الرئيسية' },
  merchants: { en: 'Merchants', ar: 'التجار' },
  categories: { en: 'Categories', ar: 'الفئات' },
  aboutUs: { en: 'About Us', ar: 'من نحن' },
  contactUs: { en: 'Contact Us', ar: 'تواصل معنا' },
  downloadNow: { en: 'Download now', ar: 'حمّل التطبيق' },
  language: { en: 'العربية', ar: 'English' },
  mainPages: { en: 'Main Pages', ar: 'الصفحات الرئيسية' },
  quickLinks: { en: 'Quick Links', ar: 'روابط سريعة' },
  learnMore: { en: 'Learn more', ar: 'اعرف المزيد' },
  careers: { en: 'Careers', ar: 'الوظائف' },
  blogs: { en: 'Blogs', ar: 'المدونة' },
  faq: { en: "FAQ'S", ar: 'الأسئلة الشائعة' },
  privacyPolicy: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
  termsConditions: { en: 'Terms & Conditions', ar: 'الشروط والأحكام' },
  joinUs: { en: 'Join Us (For Merchants)', ar: 'نضم الينا (للتجار)' },
  licensedByFra: { en: 'FRA License', ar: 'رخصة الهيئة العامة للرقابة المالية' },
  trnNumber: { en: 'TRN', ar: 'رقم التسجيل الضريبي' },
  crn: { en: 'CRN', ar: 'رقم السجل التجاري' },
  followUs: { en: 'Follow Us', ar: 'تابعنا' },
  downloadTheApp: { en: 'Download the App', ar: 'حمّل التطبيق' },
  googlePlay: { en: 'Google Play', ar: 'Google Play' },
  appStore: { en: 'App Store', ar: 'App Store' },
  aurCapital: { en: 'AUR Capital', ar: 'أور كابيتال' },
  copyright: {
    en: '©2026 Waseela | Powered by AUR Capital',
    ar: '©2026 وسيلة | بدعم من أور كابيتال',
  },
  firstName: { en: 'First Name', ar: 'الاسم الأول' },
  lastName: { en: 'Last Name', ar: 'اسم العائلة' },
  phoneNumber: { en: 'Phone Number', ar: 'رقم الهاتف' },
  emailAddress: { en: 'Email Address', ar: 'البريد الإلكتروني' },
  message: { en: 'Message', ar: 'الرسالة' },
  firstNamePlaceholder: { en: 'Enter your first name', ar: 'اكتب اسمك الأول' },
  lastNamePlaceholder: { en: 'Enter your last name', ar: 'اكتب اسم العائلة' },
  phonePlaceholder: { en: '+1 012 3456 789', ar: '+1 012 3456 789' },
  emailPlaceholder: { en: 'name@example.com', ar: 'name@example.com' },
  messagePlaceholder: { en: 'Write your message..', ar: 'اكتب رسالتك..' },
  submit: { en: 'Submit', ar: 'إرسال' },
  submitting: { en: 'Submitting...', ar: 'جارٍ الإرسال...' },
  errFirstName: {
    en: 'Please enter your first name.',
    ar: 'من فضلك اكتب اسمك الأول.',
  },
  errLastName: {
    en: 'Please enter your last name.',
    ar: 'من فضلك اكتب اسم العائلة.',
  },
  errPhone: {
    en: 'Please enter your phone number.',
    ar: 'من فضلك اكتب رقم الهاتف.',
  },
  errEmail: {
    en: 'Please enter a valid email address.',
    ar: 'من فضلك اكتب بريدًا إلكترونيًا صحيحًا.',
  },
  errMessage: {
    en: 'Please write your message.',
    ar: 'من فضلك اكتب رسالتك.',
  },
  sendSuccess: {
    en: 'Your message was sent successfully. We will get back to you soon.',
    ar: 'تم إرسال رسالتك بنجاح. سنتواصل معك قريبًا.',
  },
  sendMailFallback: {
    en: 'Opening your email app to send the message. If nothing opens, email us directly.',
    ar: 'جارٍ فتح تطبيق البريد لإرسال الرسالة. لو لم يفتح، راسلنا مباشرة.',
  },
  sendError: {
    en: 'Could not send your message. Please try again or email us directly.',
    ar: 'تعذر إرسال رسالتك. من فضلك حاول مرة أخرى أو راسلنا مباشرة.',
  },
  pageLoadError: {
    en: 'Could not load the Contact Us page.',
    ar: 'تعذر تحميل صفحة تواصل معنا.',
  },
  joinSubtitle: {
    en: 'Join us as a merchant partner with our consumer finance company, seamless communication, and helping your business grow with confidence.',
    ar: 'انضم إلينا كشريك تاجر مع شركة التمويل الاستهلاكي — تواصل سلس ومساعدة عملك على النمو بثقة.',
  },
  commercialRegisterQuestion: {
    en: 'Do you have a Commercial Register and Tax Card ID?',
    ar: 'هل لديك سجل تجاري وبطاقة ضريبية؟',
  },
  selectAnOption: { en: 'Select an option', ar: 'اختر إجابة' },
  optionYes: { en: 'Yes', ar: 'نعم' },
  optionNo: { en: 'No', ar: 'لا' },
  companyName: {
    en: 'Company / Organization Name',
    ar: 'اسم الشركة / المؤسسة',
  },
  companyNamePlaceholder: {
    en: 'Enter company name',
    ar: 'اكتب اسم الشركة',
  },
  contactPersonName: {
    en: 'Contact Person Name',
    ar: 'اسم مسؤول التواصل',
  },
  contactPersonNamePlaceholder: {
    en: 'Enter contact person name',
    ar: 'اكتب اسم مسؤول التواصل',
  },
  contactPersonPhone: {
    en: 'Contact Person Phone Number',
    ar: 'رقم هاتف مسؤول التواصل',
  },
  contactPersonPhonePlaceholder: {
    en: '+20 1XX XXX XXXX',
    ar: '+20 1XX XXX XXXX',
  },
  category: { en: 'Category', ar: 'الفئة' },
  categoryPlaceholder: { en: 'Enter Category', ar: 'اكتب الفئة' },
  websiteLink: {
    en: 'Website or Facebook Page Link',
    ar: 'رابط الموقع أو صفحة فيسبوك',
  },
  websiteLinkPlaceholder: { en: 'Enter Link', ar: 'اكتب الرابط' },
  governorate: { en: 'Governorate', ar: 'المحافظة' },
  selectGovernorate: { en: 'Select governorate', ar: 'اختر المحافظة' },
  numberOfBranches: { en: 'Number of Branches', ar: 'عدد الفروع' },
  numberOfBranchesPlaceholder: {
    en: 'Enter Number of Branches',
    ar: 'اكتب عدد الفروع',
  },
  averageMonthlySales: {
    en: 'Average Monthly Sales',
    ar: 'متوسط المبيعات الشهرية',
  },
  averageMonthlySalesPlaceholder: {
    en: 'Enter Average Monthly Sales',
    ar: 'اكتب متوسط المبيعات الشهرية',
  },
  errCommercialRegister: {
    en: 'Please select whether you have a Commercial Register and Tax Card ID.',
    ar: 'من فضلك اختر إذا كان لديك سجل تجاري وبطاقة ضريبية.',
  },
  errCompanyName: {
    en: 'Please enter your company or organization name.',
    ar: 'من فضلك اكتب اسم الشركة أو المؤسسة.',
  },
  errContactPersonName: {
    en: 'Please enter the contact person name.',
    ar: 'من فضلك اكتب اسم مسؤول التواصل.',
  },
  errContactPersonPhone: {
    en: 'Please enter the contact person phone number.',
    ar: 'من فضلك اكتب رقم هاتف مسؤول التواصل.',
  },
  errCategory: {
    en: 'Please enter a category.',
    ar: 'من فضلك اكتب الفئة.',
  },
  errGovernorate: {
    en: 'Please select a governorate.',
    ar: 'من فضلك اختر المحافظة.',
  },
  errBranches: {
    en: 'Please enter a valid number of branches.',
    ar: 'من فضلك اكتب عدد فروع صحيح.',
  },
  errSales: {
    en: 'Please enter a valid average monthly sales amount.',
    ar: 'من فضلك اكتب متوسط مبيعات شهرية صحيح.',
  },
  joinSuccess: {
    en: 'Your application was submitted successfully. We will contact you soon.',
    ar: 'تم إرسال طلبك بنجاح. سنتواصل معك قريبًا.',
  },
  joinError: {
    en: 'Could not submit your application. Please try again.',
    ar: 'تعذر إرسال طلبك. من فضلك حاول مرة أخرى.',
  },
  joinPageLoadError: {
    en: 'Could not load the Join Us page.',
    ar: 'تعذر تحميل صفحة انضم إلينا.',
  },
};
