import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, timeout } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';
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

export const DEFAULT_FOOTER_PUBLIC: FooterPublicConfig = {
  facebookUrl: 'https://www.facebook.com/share/1EQbdqvhcb/',
  instagramUrl: 'https://www.instagram.com/waseelaeg?igsh=bHdhZXU5cWtkeDV6',
  linkedinUrl: 'https://eg.linkedin.com/company/waseela-egypt',
  fra: '#500',
  trn: '724-133-259',
  crn: '2030',
  appStoreUrl: environment.appStoreUrl || '',
  playStoreUrl: environment.googlePlayUrl || '',
};

const SITE_FOOTER_SECTION_KEY = 'site_footer';
const DOWNLOAD_CTA_SECTION_KEY = 'download_app_cta';

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
  const url = (v: unknown) => cleanUrlOrText(v == null ? '' : String(v));
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
  const str = (v: unknown) => cleanUrlOrText(v == null ? '' : String(v));
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
    email: str(o['email'] ?? o['Email'] ?? o['contactEmail']),
    phone: str(o['phone'] ?? o['Phone'] ?? o['contactPhone']),
    address: str(o['address'] ?? o['Address'] ?? o['contactAddress']),
    emailLink: str(
      o['emailLink'] ?? o['EmailLink'] ?? o['mailto'] ?? o['email_link']
    ),
    phoneLink: str(
      o['phoneLink'] ?? o['PhoneLink'] ?? o['tel'] ?? o['phone_link']
    ),
    addressLink: str(
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

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  constructor(
    private readonly http: HttpClient,
    private readonly pagesService: PagesService
  ) {}

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
  getPublicSettingsMap(): Observable<Record<string, string>> {
    const url = joinApiPath(environment.apiBaseUrl, '/settings/public');
    return this.http.get<unknown>(url).pipe(
      timeout(20_000),
      map((raw) => {
        const envelope = readApiEnvelope<unknown>(raw);
        if (!envelope.success || envelope.data === null || envelope.data === undefined) {
          throw new Error(envelope.message || 'Failed to load public settings');
        }
        const listRaw = Array.isArray(envelope.data) ? envelope.data : [];
        return listRaw.reduce<Record<string, string>>((acc, item) => {
          const row = normalizeSettingItem(item);
          const val = cleanUrlOrText(
            [row.valueEn, row.value, row.valueAr].find((x) => (x ?? '').trim()) ?? ''
          );
          if (row.isActive && row.key && val) {
            acc[row.key] = val;
          }
          return acc;
        }, {});
      })
    );
  }

  /**
   * Footer from Site Settings (social + licensing/app keys) with fallbacks from
   * Home sections `site_footer` and `download_app_cta`.
   *
   * Always refetches (no long-lived cache) so CMS edits show after refresh.
   */
  getFooterConfig(): Observable<FooterPublicConfig> {
    return forkJoin({
      settings: this.getPublicSettingsMap().pipe(
        catchError(() => of({} as Record<string, string>))
      ),
      home: this.pagesService.getPageBySlugFresh('home').pipe(
        catchError(() => of(null as CmsPage | null))
      ),
    }).pipe(
      map(({ settings, home }) => this.mergeFooterConfig(settings, home)),
      catchError(() => of({ ...DEFAULT_FOOTER_PUBLIC }))
    );
  }

  /**
   * Contact Ways for Contact Us & Join Us.
   * Always reads Site Settings + Contact Us page ExtraData (where the dashboard saves).
   */
  getContactWaysConfig(_pageSlug?: string): Observable<ContactWaysPublicConfig> {
    const emptyWays: ContactWaysPublicConfig = {
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

    return forkJoin({
      settings: this.getPublicSettingsMap().pipe(
        catchError(() => of({} as Record<string, string>))
      ),
      // Site Settings persists ways on the Contact Us page — never use join-us for this.
      contact: this.pagesService.getPageBySlug('contact-us').pipe(
        catchError(() => of(null as CmsPage | null))
      ),
    }).pipe(
      timeout(25_000),
      map(({ settings, contact }) => this.mergeContactWaysConfig(settings, contact)),
      catchError(() => of(emptyWays))
    );
  }

  private mergeContactWaysConfig(
    settings: Record<string, string>,
    contact: CmsPage | null
  ): ContactWaysPublicConfig {
    const fromExtra = this.readContactWaysExtra(contact);
    // ExtraData (CMS Site Settings) wins — then public settings keys
    const email =
      fromExtra.email || settingValue(settings, 'contact.email') || '';
    const phone =
      fromExtra.phone || settingValue(settings, 'contact.phone') || '';
    const address =
      fromExtra.address || settingValue(settings, 'contact.address') || '';
    const emailLink = fromExtra.emailLink;
    const phoneLink = fromExtra.phoneLink;
    const addressLink = fromExtra.addressLink;

    return {
      email,
      phone,
      address,
      emailHref: emailLink || (email ? `mailto:${email}` : 'javascript:void(0)'),
      phoneHref:
        phoneLink ||
        (phone ? `tel:${phone.replace(/\s+/g, '')}` : 'javascript:void(0)'),
      addressHref: addressLink || 'javascript:void(0)',
      showEmail: fromExtra.showEmail !== false,
      showPhone: fromExtra.showPhone !== false,
      showAddress: fromExtra.showAddress !== false,
    };
  }

  private readContactWaysExtra(page: CmsPage | null): ReturnType<
    typeof parseContactWaysExtra
  > {
    const sections = page?.sections ?? [];
    const byKey = (...matchers: ((key: string) => boolean)[]) => {
      for (const match of matchers) {
        const found = sections.find(
          (s) => s.isActive !== false && match((s.sectionKey || '').toLowerCase())
        );
        if (found) {
          return parseContactWaysExtra(found.extraDataJson);
        }
      }
      return null;
    };
    const fromUs = byKey(
      (k) => k === 'contact_us' || k.includes('contact_us')
    );
    const fromWays = byKey(
      (k) =>
        k === 'contact_ways' ||
        k === 'join_contact_ways' ||
        k.includes('contact_ways') ||
        k.includes('ways_to_contact')
    );
    const empty = parseContactWaysExtra(null);
    const a = fromUs ?? empty;
    const b = fromWays ?? empty;
    const primaryHasData = !!(
      a.email ||
      a.phone ||
      a.address ||
      a.emailLink ||
      a.phoneLink ||
      a.addressLink
    );
    const primary = primaryHasData ? a : b;
    const secondary = primary === a ? b : a;
    return {
      email: primary.email || secondary.email,
      phone: primary.phone || secondary.phone,
      address: primary.address || secondary.address,
      emailLink: primary.emailLink || secondary.emailLink,
      phoneLink: primary.phoneLink || secondary.phoneLink,
      addressLink: primary.addressLink || secondary.addressLink,
      showEmail: primary.showEmail,
      showPhone: primary.showPhone,
      showAddress: primary.showAddress,
    };
  }

  private mergeFooterConfig(
    settings: Record<string, string>,
    home: CmsPage | null
  ): FooterPublicConfig {
    const fromSettings: Partial<FooterPublicConfig> = {
      facebookUrl: settingValue(
        settings,
        'social.facebook',
        'footer.facebook',
        'footer.facebook_url'
      ),
      instagramUrl: settingValue(
        settings,
        'social.instagram',
        'footer.instagram',
        'footer.instagram_url'
      ),
      linkedinUrl: settingValue(
        settings,
        'social.linkedin',
        'footer.linkedin',
        'footer.linkedin_url'
      ),
      fra: settingValue(
        settings,
        'footer.fra',
        'footer.licensed_by_fra',
        'general.fra'
      ),
      trn: settingValue(
        settings,
        'footer.trn',
        'footer.trn_number',
        'general.trn'
      ),
      crn: settingValue(settings, 'footer.crn', 'general.crn'),
      appStoreUrl: settingValue(
        settings,
        'footer.app_store_url',
        'footer.appStoreUrl',
        'general.app_store_url'
      ),
      playStoreUrl: settingValue(
        settings,
        'footer.play_store_url',
        'footer.google_play_url',
        'footer.googlePlayUrl',
        'general.play_store_url'
      ),
    };

    const fromSiteFooter = this.sectionExtra(home, SITE_FOOTER_SECTION_KEY);
    const fromDownloadCta = this.sectionExtra(home, DOWNLOAD_CTA_SECTION_KEY);

    return {
      // Social: Site Settings public keys, then optional site_footer JSON
      facebookUrl: firstNonEmpty(
        fromSettings.facebookUrl,
        fromSiteFooter.facebookUrl,
        DEFAULT_FOOTER_PUBLIC.facebookUrl
      ),
      instagramUrl: firstNonEmpty(
        fromSettings.instagramUrl,
        fromSiteFooter.instagramUrl,
        DEFAULT_FOOTER_PUBLIC.instagramUrl
      ),
      linkedinUrl: firstNonEmpty(
        fromSettings.linkedinUrl,
        fromSiteFooter.linkedinUrl,
        DEFAULT_FOOTER_PUBLIC.linkedinUrl
      ),
      // Licensing & apps: Home `site_footer` is source of truth (dashboard Save)
      fra: firstNonEmpty(
        fromSiteFooter.fra,
        fromSettings.fra,
        DEFAULT_FOOTER_PUBLIC.fra
      ),
      trn: firstNonEmpty(
        fromSiteFooter.trn,
        fromSettings.trn,
        DEFAULT_FOOTER_PUBLIC.trn
      ),
      crn: firstNonEmpty(
        fromSiteFooter.crn,
        fromSettings.crn,
        DEFAULT_FOOTER_PUBLIC.crn
      ),
      appStoreUrl: firstNonEmpty(
        fromSiteFooter.appStoreUrl,
        fromSettings.appStoreUrl,
        fromDownloadCta.appStoreUrl,
        DEFAULT_FOOTER_PUBLIC.appStoreUrl
      ),
      playStoreUrl: firstNonEmpty(
        fromSiteFooter.playStoreUrl,
        fromSettings.playStoreUrl,
        fromDownloadCta.playStoreUrl,
        DEFAULT_FOOTER_PUBLIC.playStoreUrl
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
