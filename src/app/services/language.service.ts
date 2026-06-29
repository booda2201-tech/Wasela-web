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

  label(key: NavLabelKey): string {
    return NAV_LABELS[key][this.current];
  }

  private readStored(): AppLanguage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'ar' ? 'ar' : 'en';
    } catch {
      return 'en';
    }
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

const NAV_LABELS: Record<NavLabelKey, Record<AppLanguage, string>> = {
  home: { en: 'Home', ar: 'الرئيسية' },
  merchants: { en: 'Merchants', ar: 'التجار' },
  categories: { en: 'Categories', ar: 'الفئات' },
  aboutUs: { en: 'About Us', ar: 'من نحن' },
  contactUs: { en: 'Contact Us', ar: 'تواصل معنا' },
  downloadNow: { en: 'Download now', ar: 'حمّل التطبيق' },
  language: { en: 'العربية', ar: 'English' },
};
