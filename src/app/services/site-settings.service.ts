import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  forkJoin,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
  take,
  timeout
} from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AppLanguage, LanguageService, pickLocalized } from './language.service';
import {
  CmsPage,
  joinApiPath,
  PagesService,
  readApiEnvelope
} from './pages.service';

export interface SiteSettingItem {
  id: number;
  key: string;
  value: string | null;
  valueEn?: string | null;
  valueAr?: string | null;
  dataType: number | string;
  group: number | string;
  label: string | null;
  description: string | null;
  isPublic: boolean;
  isActive: boolean;
}

export interface FooterPublicConfig {
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  fra: string;
  trn: string;
  crn: string;
  appStoreUrl: string;
  playStoreUrl: string;
}

/** Contact Ways shown on Contact Us & Join Us (from Site Settings) */
export interface ContactWaysPublicConfig {
  email: string;
  phone: string;
  address: string;
  emailHref: string;
  phoneHref: string;
  addressHref: string;
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
}

/** Empty until dashboard/CMS responds — never ship stale FRA/TRN/CRN defaults. */
export const EMPTY_FOOTER_PUBLIC: FooterPublicConfig = {
  facebookUrl: '',
  instagramUrl: '',
  linkedinUrl: '',
  fra: '',
  trn: '',
  crn: '',
  appStoreUrl: environment.appStoreUrl || '',
  playStoreUrl: environment.googlePlayUrl || '',
};

/** @deprecated use EMPTY_FOOTER_PUBLIC */
export const DEFAULT_FOOTER_PUBLIC = EMPTY_FOOTER_PUBLIC;

/** Empty shell — pills only appear when dashboard/CMS provides values. */
export const EMPTY_CONTACT_WAYS: ContactWaysPublicConfig = {
  email: '',
  phone: '',
  address: '',
  emailHref: 'javascript:void(0)',
  phoneHref: 'javascript:void(0)',
  addressHref: 'javascript:void(0)',
  showEmail: true,
  showPhone: true,
  showAddress: true,
};

/** @deprecated use EMPTY_CONTACT_WAYS — kept so older imports compile */
export const DEFAULT_CONTACT_WAYS = EMPTY_CONTACT_WAYS;

const SITE_FOOTER_SECTION_KEY = 'site_footer';
const DOWNLOAD_CTA_SECTION_KEY = 'download_app_cta';

/** Plain text for contact pills — do not treat phone/address like URLs */
function cleanContactText(raw: string | null | undefined): string {
  const v = (raw ?? '').trim();
  if (!v || v === '...' || v === '—' || v === '#') {
    return '';
  }
  return v;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

function normalizeSettingItem(raw: unknown): SiteSettingItem {
  const r = asRecord(raw);
  const valueEn = (r['valueEn'] ?? r['ValueEn'] ?? null) as string | null;
  const valueAr = (r['valueAr'] ?? r['ValueAr'] ?? null) as string | null;
  // API often sends empty `value` while real data is in valueEn/valueAr — don't let "" win.
  const valueLegacy = (r['value'] ?? r['Value'] ?? null) as string | null;
  const value =
    (typeof valueLegacy === 'string' && valueLegacy.trim() ? valueLegacy : null) ??
    (typeof valueEn === 'string' && valueEn.trim() ? valueEn : null) ??
    (typeof valueAr === 'string' && valueAr.trim() ? valueAr : null);
  return {
    id: Number(r['id'] ?? r['Id'] ?? 0),
    key: String(r['key'] ?? r['Key'] ?? ''),
    value,
    valueEn,
    valueAr,
    dataType: (r['dataType'] ?? r['DataType'] ?? 0) as number | string,
    group: (r['group'] ?? r['Group'] ?? 0) as number | string,
    label: (r['label'] ?? r['Label'] ?? r['labelEn'] ?? r['LabelEn'] ?? null) as string | null,
    description: (r['description'] ?? r['Description'] ?? null) as string | null,
    isPublic: (r['isPublic'] ?? r['IsPublic'] ?? true) !== false,
    isActive: (r['isActive'] ?? r['IsActive'] ?? true) !== false,
  };
}

function settingValue(map: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const v = cleanUrlOrText(map[key] ?? '');
    if (v) {
      return v;
    }
  }
  return '';
}

/** Reject empty / placeholder CMS values like "..." — for URLs only */
function cleanUrlOrText(raw: string | null | undefined): string {
  const v = (raw ?? '').trim();
  if (!v || v === '#' || v === '...' || v === '—') {
    return '';
  }
  // CMS placeholder social profiles
  if (/yourhandle|yourchannel|example\.com/i.test(v)) {
    return '';
  }
  return v;
}

/** Licensing codes may look like "#500" — do not strip leading # */
function cleanLicensingValue(raw: string | null | undefined): string {
  const v = (raw ?? '').trim();
  if (!v || v === '...' || v === '—') {
    return '';
  }
  return v;
}

function parseJsonObject(raw: unknown): Record<string, unknown> {
  if (raw == null) {
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return asRecord(raw);
  }
  if (typeof raw !== 'string') {
    return {};
  }
  const text = raw.trim();
  if (!text) {
    return {};
  }
  try {
    return asRecord(JSON.parse(text));
  } catch {
    return {};
  }
}

function parseFooterExtra(raw: unknown): Partial<FooterPublicConfig> {
  const o = parseJsonObject(raw);
  const url = (v: unknown) =>
    ensureHttpUrl(cleanUrlOrText(v == null ? '' : String(v)));
  const code = (v: unknown) => cleanLicensingValue(v == null ? '' : String(v));
  return {
    facebookUrl: url(
      o['facebookUrl'] ?? o['facebook'] ?? o['facebook_url'] ?? o['socialFacebook']
    ),
    instagramUrl: url(
      o['instagramUrl'] ?? o['instagram'] ?? o['instagram_url'] ?? o['socialInstagram']
    ),
    linkedinUrl: url(
      o['linkedinUrl'] ?? o['linkedin'] ?? o['linkedin_url'] ?? o['socialLinkedin']
    ),
    fra: code(o['fra'] ?? o['FRA'] ?? o['licensedByFra'] ?? o['licensed_by_fra']),
    trn: code(o['trn'] ?? o['TRN'] ?? o['trnNumber'] ?? o['trn_number']),
    crn: code(o['crn'] ?? o['CRN']),
    appStoreUrl: url(
      o['appStoreUrl'] ?? o['app_store_url'] ?? o['appStore'] ?? o['appleStoreUrl']
    ),
    playStoreUrl: url(
      o['playStoreUrl'] ??
        o['play_store_url'] ??
        o['googlePlayUrl'] ??
        o['google_play_url'] ??
        o['googlePlay']
    ),
  };
}

function parseContactWaysExtra(raw: unknown): {
  email: string;
  phone: string;
  address: string;
  emailLink: string;
  phoneLink: string;
  addressLink: string;
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
} {
  const o = parseJsonObject(raw);
  const text = (v: unknown) => cleanContactText(v == null ? '' : String(v));
  const link = (v: unknown) => cleanUrlOrText(v == null ? '' : String(v));
  const flag = (v: unknown, fallback: boolean) => {
    if (v === false || v === 'false' || v === 0 || v === '0') {
      return false;
    }
    if (v === true || v === 'true' || v === 1 || v === '1') {
      return true;
    }
    return fallback;
  };
  return {
    email: text(o['email'] ?? o['Email'] ?? o['contactEmail']),
    phone: text(o['phone'] ?? o['Phone'] ?? o['contactPhone']),
    address: text(
      o['address'] ??
        o['Address'] ??
        o['addressEn'] ??
        o['AddressEn'] ??
        o['addressAr'] ??
        o['AddressAr'] ??
        o['contactAddress']
    ),
    emailLink: link(
      o['emailLink'] ?? o['EmailLink'] ?? o['mailto'] ?? o['email_link']
    ),
    phoneLink: link(
      o['phoneLink'] ?? o['PhoneLink'] ?? o['tel'] ?? o['phone_link']
    ),
    addressLink: link(
      o['addressLink'] ??
        o['AddressLink'] ??
        o['mapsUrl'] ??
        o['maps'] ??
        o['address_link']
    ),
    showEmail: flag(o['showEmail'] ?? o['ShowEmail'] ?? o['show_email'], true),
    showPhone: flag(o['showPhone'] ?? o['ShowPhone'] ?? o['show_phone'], true),
    showAddress: flag(
      o['showAddress'] ?? o['ShowAddress'] ?? o['show_address'],
      true
    ),
  };
}

function toContactWaysConfig(
  raw: ReturnType<typeof parseContactWaysExtra>
): ContactWaysPublicConfig {
  const email = raw.email;
  const phone = raw.phone;
  const address = raw.address;
  return {
    email,
    phone,
    address,
    emailHref: raw.emailLink || (email ? `mailto:${email}` : 'javascript:void(0)'),
    phoneHref:
      raw.phoneLink ||
      (phone ? `tel:${phone.replace(/\s+/g, '')}` : 'javascript:void(0)'),
    addressHref: raw.addressLink || 'javascript:void(0)',
    showEmail: raw.showEmail !== false,
    showPhone: raw.showPhone !== false,
    showAddress: raw.showAddress !== false,
  };
}

function mergeWaysLayers(
  ...layers: Array<Partial<ContactWaysPublicConfig> | null | undefined>
): ContactWaysPublicConfig {
  const out: ContactWaysPublicConfig = { ...EMPTY_CONTACT_WAYS };
  for (const layer of layers) {
    if (!layer) {
      continue;
    }
    if (layer.email?.trim()) {
      out.email = layer.email.trim();
    }
    if (layer.phone?.trim()) {
      out.phone = layer.phone.trim();
    }
    if (layer.address?.trim()) {
      out.address = layer.address.trim();
    }
    if (layer.emailHref && layer.emailHref !== 'javascript:void(0)') {
      out.emailHref = layer.emailHref;
    }
    if (layer.phoneHref && layer.phoneHref !== 'javascript:void(0)') {
      out.phoneHref = layer.phoneHref;
    }
    if (layer.addressHref && layer.addressHref !== 'javascript:void(0)') {
      out.addressHref = layer.addressHref;
    }
    if (typeof layer.showEmail === 'boolean') {
      out.showEmail = layer.showEmail;
    }
    if (typeof layer.showPhone === 'boolean') {
      out.showPhone = layer.showPhone;
    }
    if (typeof layer.showAddress === 'boolean') {
      out.showAddress = layer.showAddress;
    }
  }
  if (!out.emailHref || out.emailHref === 'javascript:void(0)') {
    out.emailHref = out.email ? `mailto:${out.email}` : 'javascript:void(0)';
  }
  if (!out.phoneHref || out.phoneHref === 'javascript:void(0)') {
    out.phoneHref = out.phone
      ? `tel:${out.phone.replace(/\s+/g, '')}`
      : 'javascript:void(0)';
  }
  return out;
}

function firstNonEmpty(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    const cleaned = (value ?? '').trim();
    if (cleaned && cleaned !== '...' && cleaned !== '—') {
      // bare "#" is not a real value; "#500" (FRA) is valid
      if (cleaned === '#') {
        continue;
      }
      return cleaned;
    }
  }
  return '';
}

/** Ensure social / store links work as absolute hrefs. */
function ensureHttpUrl(raw: string | null | undefined): string {
  const v = (raw ?? '').trim();
  if (!v) {
    return '';
  }
  if (/^https?:\/\//i.test(v) || /^mailto:/i.test(v) || /^tel:/i.test(v)) {
    return v;
  }
  if (/^(www\.|facebook\.|instagram\.|linkedin\.|fb\.|apps\.|play\.google)/i.test(v)) {
    return `https://${v}`;
  }
  return v;
}

const CONTACT_WAYS_CACHE_KEY = 'wasela.contactWays.v1';
const FOOTER_CACHE_KEY = 'wasela.footer.v1';

function hasContactWays(ways: ContactWaysPublicConfig | null | undefined): boolean {
  return !!(ways && (ways.email || ways.phone || ways.address));
}

function hasFooterData(cfg: FooterPublicConfig | null | undefined): boolean {
  return !!(
    cfg &&
    (cfg.fra ||
      cfg.trn ||
      cfg.crn ||
      cfg.facebookUrl ||
      cfg.instagramUrl ||
      cfg.linkedinUrl ||
      cfg.appStoreUrl ||
      cfg.playStoreUrl)
  );
}

function readSessionJson<T>(key: string): T | null {
  try {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeSessionJson(key: string, value: unknown): void {
  try {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota */
  }
}

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  /** Bump to force footer + contact pills to re-fetch after dashboard Save / tab focus. */
  private readonly refresh$ = new BehaviorSubject<number>(0);

  private lastContactWays: ContactWaysPublicConfig | null =
    readSessionJson<ContactWaysPublicConfig>(CONTACT_WAYS_CACHE_KEY);
  private lastFooter: FooterPublicConfig | null =
    readSessionJson<FooterPublicConfig>(FOOTER_CACHE_KEY);

  private readonly footerShared$ = this.refresh$.pipe(
    switchMap(() => this.fetchFooterConfig()),
    tap((cfg) => this.rememberFooter(cfg)),
    // Keep last value across route changes so footer/pills don't blank out.
    shareReplay({ bufferSize: 1, refCount: false })
  );

  private readonly contactWaysShared$ = this.refresh$.pipe(
    switchMap(() => this.fetchContactWaysConfig()),
    tap((ways) => this.rememberContactWays(ways)),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  constructor(
    private readonly http: HttpClient,
    private readonly pagesService: PagesService,
    private readonly language: LanguageService
  ) {}

  private invalidateQueued = false;

  /** Drop CMS page cache and re-pull public settings / footer / contact ways. */
  invalidate(): void {
    if (this.invalidateQueued) {
      return;
    }
    this.invalidateQueued = true;
    queueMicrotask(() => {
      this.invalidateQueued = false;
      this.pagesService.invalidatePageCache();
      this.refresh$.next(Date.now());
    });
  }

  getSettingsMapByGroup(groupId: number): Observable<Record<string, string>> {
    const url = joinApiPath(
      environment.apiBaseUrl,
      `/settings/admin/by-group/${encodeURIComponent(String(groupId))}`
    );

    return this.http.get<unknown>(url).pipe(
      map((raw) => {
        const envelope = readApiEnvelope<unknown>(raw);
        if (!envelope.success || envelope.data === null || envelope.data === undefined) {
          throw new Error(envelope.message || 'Failed to load settings');
        }

        const listRaw = Array.isArray(envelope.data) ? envelope.data : [];
        const list = listRaw.map((x) => normalizeSettingItem(x));

        return list.reduce<Record<string, string>>((acc, item) => {
          const val = cleanUrlOrText(item.valueEn || item.value || item.valueAr || '');
          if (item.isActive && item.key && val) {
            acc[item.key] = val;
          }
          return acc;
        }, {});
      })
    );
  }

  getMergedSettingsMapByGroups(groupIds: number[]): Observable<Record<string, string>> {
    const sources = groupIds.map((id) => this.getSettingsMapByGroup(id));
    return forkJoin(sources).pipe(
      map((maps) => maps.reduce<Record<string, string>>((acc, curr) => ({ ...acc, ...curr }), {}))
    );
  }

  /** Public settings map (social + optional footer.* keys). */
  getPublicSettingsMap(cacheBust = false): Observable<Record<string, string>> {
    return this.getPublicSettingsRaw(cacheBust).pipe(
      map((list) =>
        list.reduce<Record<string, string>>((acc, row) => {
          const isContactText =
            row.key === 'contact.email' ||
            row.key === 'contact.phone' ||
            row.key === 'contact.address';
          // API keys: footer.crn, footer.licensed_by_fra, footer.trn_number, …
          const isLicensing =
            /\.(fra|trn|crn)$/i.test(row.key) ||
            /\.(licensed_by_fra|trn_number)$/i.test(row.key);
          const raw =
            [row.valueEn, row.value, row.valueAr].find((x) => (x ?? '').trim()) ?? '';
          const val = isContactText
            ? cleanContactText(raw)
            : isLicensing
              ? cleanLicensingValue(raw)
              : cleanUrlOrText(raw);
          if (row.isActive && row.key && val) {
            acc[row.key] = val;
          }
          return acc;
        }, {})
      )
    );
  }

  /**
   * Footer from Site Settings:
   * - Social → public `social.*` keys
   * - FRA / TRN / CRN / store URLs → Home `site_footer` ExtraData (dashboard 04 Footer)
   * Always Fresh-fetches Home so Save + refresh shows new CRN etc.
   */
  getFooterConfig(): Observable<FooterPublicConfig> {
    return this.fetchFooterConfig();
  }

  /** Live footer stream — re-fetches on invalidate() (tab focus / route). */
  watchFooterConfig(): Observable<FooterPublicConfig> {
    // Paint cached footer immediately while network catch-up runs.
    return this.lastFooter && hasFooterData(this.lastFooter)
      ? this.footerShared$.pipe(startWith(this.lastFooter))
      : this.footerShared$;
  }

  /**
   * Contact Ways pills — ONE source for Contact Us & Join Us:
   * Site Settings public `contact.*` + Contact Us page ExtraData (`contact_us`).
   * Never reads Join Us `join_contact_ways` (often stale).
   */
  getContactWaysConfig(): Observable<ContactWaysPublicConfig> {
    return this.fetchContactWaysConfig();
  }

  /** Live contact pills — same data on Contact Us & Join Us; refreshes on lang + invalidate(). */
  watchContactWaysConfig(): Observable<ContactWaysPublicConfig> {
    // Paint cached pills immediately (same visit / soft reload) while API catches up.
    return this.lastContactWays && hasContactWays(this.lastContactWays)
      ? this.contactWaysShared$.pipe(startWith(this.lastContactWays))
      : this.contactWaysShared$;
  }

  /** Build pills from an already-loaded CMS page + optional public settings map. */
  buildWaysFromPageAndSettings(
    page: CmsPage | null | undefined,
    settings: Record<string, string> = {}
  ): ContactWaysPublicConfig {
    const list = Object.entries(settings).map(([key, value]) =>
      normalizeSettingItem({ key, value, valueEn: value, valueAr: value, isActive: true })
    );
    return this.mergeContactWaysConfig(list, page ?? null, this.language.current);
  }

  /** Pull Contact Ways from a CMS page already loaded by the component. */
  extractWaysFromPage(page: CmsPage | null | undefined): ContactWaysPublicConfig | null {
    if (!page) {
      return null;
    }
    const raw = this.readContactWaysExtra(page);
    if (!raw.email && !raw.phone && !raw.address) {
      return null;
    }
    return toContactWaysConfig(raw);
  }

  private fetchFooterConfig(): Observable<FooterPublicConfig> {
    // Emit as soon as settings arrive (home starts as null), then refine with Home ExtraData.
    return combineLatest({
      settings: this.getPublicSettingsMap(true).pipe(
        timeout(20_000),
        catchError(() => of({} as Record<string, string>))
      ),
      home: this.pagesService.getPageBySlugFresh('home').pipe(
        take(1),
        timeout(20_000),
        catchError(() => of(null as CmsPage | null)),
        startWith(null as CmsPage | null)
      ),
    }).pipe(
      map(({ settings, home }) => this.mergeFooterConfig(settings, home)),
      catchError(() =>
        of(this.lastFooter && hasFooterData(this.lastFooter)
          ? this.lastFooter
          : { ...EMPTY_FOOTER_PUBLIC })
      )
    );
  }

  private fetchContactWaysConfig(): Observable<ContactWaysPublicConfig> {
    // Keep stream open for lang$; emit pills from public settings immediately
    // (contact page starts null) then merge ExtraData links when the page arrives.
    return combineLatest({
      settings: this.getPublicSettingsRaw(true).pipe(
        timeout(20_000),
        catchError(() => of([] as SiteSettingItem[]))
      ),
      contact: this.pagesService.getPageBySlugFresh('contact-us').pipe(
        take(1),
        timeout(20_000),
        catchError(() => of(null as CmsPage | null)),
        startWith(null as CmsPage | null)
      ),
      lang: this.language.lang$,
    }).pipe(
      map(({ settings, contact, lang }) =>
        this.mergeContactWaysConfig(settings, contact, lang)
      ),
      catchError(() =>
        of(
          this.lastContactWays && hasContactWays(this.lastContactWays)
            ? this.lastContactWays
            : { ...EMPTY_CONTACT_WAYS }
        )
      )
    );
  }

  private rememberContactWays(ways: ContactWaysPublicConfig): void {
    if (!hasContactWays(ways)) {
      return;
    }
    this.lastContactWays = { ...ways };
    writeSessionJson(CONTACT_WAYS_CACHE_KEY, this.lastContactWays);
  }

  private rememberFooter(cfg: FooterPublicConfig): void {
    if (!hasFooterData(cfg)) {
      return;
    }
    this.lastFooter = { ...cfg };
    writeSessionJson(FOOTER_CACHE_KEY, this.lastFooter);
  }

  private getPublicSettingsRaw(cacheBust = false): Observable<SiteSettingItem[]> {
    let url = joinApiPath(environment.apiBaseUrl, '/settings/public');
    if (cacheBust) {
      url += `?_=${Date.now()}`;
    }
    return this.http.get<unknown>(url).pipe(
      timeout(20_000),
      map((raw) => {
        const envelope = readApiEnvelope<unknown>(raw);
        if (!envelope.success || envelope.data === null || envelope.data === undefined) {
          throw new Error(envelope.message || 'Failed to load public settings');
        }
        const listRaw = Array.isArray(envelope.data) ? envelope.data : [];
        return listRaw.map((item) => normalizeSettingItem(item));
      })
    );
  }

  private settingPair(
    list: SiteSettingItem[],
    key: string
  ): { en: string; ar: string } {
    const row = list.find((item) => item.isActive !== false && item.key === key);
    if (!row) {
      return { en: '', ar: '' };
    }
    const en = cleanContactText(row.valueEn || row.value || '');
    const ar = cleanContactText(row.valueAr || row.value || '');
    return { en, ar };
  }

  private mergeContactWaysConfig(
    settings: SiteSettingItem[],
    contact: CmsPage | null,
    lang: AppLanguage
  ): ContactWaysPublicConfig {
    const fromContact = toContactWaysConfig(this.readContactWaysExtra(contact));

    const emailPair = this.settingPair(settings, 'contact.email');
    const phonePair = this.settingPair(settings, 'contact.phone');
    const addressPair = this.settingPair(settings, 'contact.address');

    const fromSettings: Partial<ContactWaysPublicConfig> = {
      email: cleanContactText(pickLocalized(lang, emailPair.en, emailPair.ar) || ''),
      phone: cleanContactText(pickLocalized(lang, phonePair.en, phonePair.ar) || ''),
      address: cleanContactText(
        pickLocalized(lang, addressPair.en, addressPair.ar) || ''
      ),
    };

    // ExtraData (links / visibility) first, then public contact.* text wins (dashboard Save)
    const merged = mergeWaysLayers(fromContact, fromSettings);
    return this.syncContactHrefs(merged, fromContact);
  }

  /**
   * Keep custom mailto/tel/maps links from ExtraData only when they still match
   * the winning email/phone — otherwise rebuild so Site Settings edits show up.
   */
  private syncContactHrefs(
    merged: ContactWaysPublicConfig,
    fromPage: ContactWaysPublicConfig
  ): ContactWaysPublicConfig {
    const out: ContactWaysPublicConfig = { ...merged };

    if (out.email) {
      const pageLink = fromPage.emailHref || '';
      const mentionsEmail =
        pageLink !== 'javascript:void(0)' &&
        pageLink.toLowerCase().includes(out.email.toLowerCase());
      out.emailHref = mentionsEmail ? pageLink : `mailto:${out.email}`;
    }

    if (out.phone) {
      const digits = out.phone.replace(/\s+/g, '');
      const compactDigits = digits.replace(/^\+/, '');
      const pageLink = fromPage.phoneHref || '';
      const normalizedPage = pageLink.replace(/[\s\-()]/g, '');
      const mentionsPhone =
        pageLink !== 'javascript:void(0)' &&
        (normalizedPage.includes(digits) || normalizedPage.includes(compactDigits));
      out.phoneHref = mentionsPhone ? pageLink : `tel:${digits}`;
    }

    if (fromPage.addressHref && fromPage.addressHref !== 'javascript:void(0)') {
      out.addressHref = fromPage.addressHref;
    }

    return out;
  }

  private readContactWaysExtra(page: CmsPage | null): ReturnType<
    typeof parseContactWaysExtra
  > {
    const empty = parseContactWaysExtra(null);
    if (!page) {
      return empty;
    }
    const sections = page.sections ?? [];

    const pick = (...predicates: Array<(key: string) => boolean>) => {
      for (const pred of predicates) {
        const found = sections.find(
          (s) => s.isActive !== false && pred((s.sectionKey || '').toLowerCase())
        );
        if (found) {
          return parseContactWaysExtra(found.extraDataJson);
        }
      }
      return empty;
    };

    // Only Contact Us page sections — never Join Us (keeps both pages identical)
    const fromWays = pick(
      (k) => k === 'contact_ways',
      (k) => k.includes('contact_ways') || k.includes('ways_to_contact')
    );
    const fromForm = pick(
      (k) => k === 'contact_us',
      (k) => k.includes('contact_us')
    );

    // contact_us ExtraData is what Site Settings Save writes for phone/email/address/links.
    return {
      email: fromForm.email || fromWays.email,
      phone: fromForm.phone || fromWays.phone,
      address: fromForm.address || fromWays.address,
      emailLink: fromForm.emailLink || fromWays.emailLink,
      phoneLink: fromForm.phoneLink || fromWays.phoneLink,
      addressLink: fromForm.addressLink || fromWays.addressLink,
      showEmail: fromForm.email || fromForm.emailLink ? fromForm.showEmail : fromWays.showEmail,
      showPhone: fromForm.phone || fromForm.phoneLink ? fromForm.showPhone : fromWays.showPhone,
      showAddress:
        fromForm.address || fromForm.addressLink ? fromForm.showAddress : fromWays.showAddress,
    };
  }

  private mergeFooterConfig(
    settings: Record<string, string>,
    home: CmsPage | null
  ): FooterPublicConfig {
    const lic = (...keys: string[]) => {
      for (const key of keys) {
        const v = cleanLicensingValue(settings[key] ?? '');
        if (v) {
          return v;
        }
      }
      return '';
    };

    const fromSettings: Partial<FooterPublicConfig> = {
      facebookUrl: ensureHttpUrl(
        settingValue(
          settings,
          'social.facebook',
          'footer.facebook',
          'footer.facebook_url'
        )
      ),
      instagramUrl: ensureHttpUrl(
        settingValue(
          settings,
          'social.instagram',
          'footer.instagram',
          'footer.instagram_url'
        )
      ),
      linkedinUrl: ensureHttpUrl(
        settingValue(
          settings,
          'social.linkedin',
          'footer.linkedin',
          'footer.linkedin_url'
        )
      ),
      // Public API uses footer.licensed_by_fra / footer.trn_number / footer.crn
      fra: lic('footer.licensed_by_fra', 'footer.fra', 'general.fra'),
      trn: lic('footer.trn_number', 'footer.trn', 'general.trn'),
      crn: lic('footer.crn', 'general.crn'),
      appStoreUrl: ensureHttpUrl(
        settingValue(
          settings,
          'footer.app_store_url',
          'footer.appStoreUrl',
          'general.app_store_url'
        )
      ),
      playStoreUrl: ensureHttpUrl(
        settingValue(
          settings,
          'footer.google_play_url',
          'footer.play_store_url',
          'footer.googlePlayUrl',
          'general.play_store_url'
        )
      ),
    };

    const fromSiteFooter = this.sectionExtra(home, SITE_FOOTER_SECTION_KEY);
    const fromDownloadCta = this.sectionExtra(home, DOWNLOAD_CTA_SECTION_KEY);

    return {
      // Social: public settings (dashboard 03 Social)
      facebookUrl: firstNonEmpty(fromSettings.facebookUrl, fromSiteFooter.facebookUrl),
      instagramUrl: firstNonEmpty(fromSettings.instagramUrl, fromSiteFooter.instagramUrl),
      linkedinUrl: firstNonEmpty(fromSettings.linkedinUrl, fromSiteFooter.linkedinUrl),
      // Licensing: site_footer ExtraData, then public footer.* settings
      fra: firstNonEmpty(fromSiteFooter.fra, fromSettings.fra),
      trn: firstNonEmpty(fromSiteFooter.trn, fromSettings.trn),
      crn: firstNonEmpty(fromSiteFooter.crn, fromSettings.crn),
      // Store URLs: settings win over empty ExtraData / "..." CTA placeholders
      appStoreUrl: firstNonEmpty(
        fromSettings.appStoreUrl,
        fromSiteFooter.appStoreUrl,
        fromDownloadCta.appStoreUrl
      ),
      playStoreUrl: firstNonEmpty(
        fromSettings.playStoreUrl,
        fromSiteFooter.playStoreUrl,
        fromDownloadCta.playStoreUrl
      ),
    };
  }

  private sectionExtra(
    page: CmsPage | null,
    sectionKey: string
  ): Partial<FooterPublicConfig> {
    const want = sectionKey.toLowerCase();
    const matches =
      page?.sections?.filter((s) => (s.sectionKey || '').toLowerCase() === want) ?? [];
    const section =
      matches.find((s) => s.isActive !== false) ?? matches[0] ?? null;
    return section ? parseFooterExtra(section.extraDataJson) : {};
  }
}
