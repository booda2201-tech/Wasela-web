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

export type AppLabelKey = NavLabelKey | FooterLabelKey;

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
  joinUs: { en: 'Join Us', ar: 'انضم إلينا' },
  licensedByFra: { en: 'Licensed by FRA', ar: 'مرخّص من الهيئة العامة للرقابة المالية' },
  trnNumber: { en: 'TRN Number', ar: 'الرقم الضريبي' },
  crn: { en: 'CRN', ar: 'السجل التجاري' },
  followUs: { en: 'Follow Us', ar: 'تابعنا' },
  downloadTheApp: { en: 'Download the App', ar: 'حمّل التطبيق' },
  googlePlay: { en: 'Google Play', ar: 'Google Play' },
  appStore: { en: 'App Store', ar: 'App Store' },
  aurCapital: { en: 'AUR Capital', ar: 'AUR Capital' },
  copyright: {
    en: '©2026 Waseela | Powered by AUR Capital',
    ar: '©2026 وصيلة | بدعم من AUR Capital',
  },
};
