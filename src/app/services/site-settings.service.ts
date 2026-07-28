import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, shareReplay } from 'rxjs';
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

export const DEFAULT_FOOTER_PUBLIC: FooterPublicConfig = {
  facebookUrl: '',
  instagramUrl: '',
  linkedinUrl: '',
  fra: '#40',
  trn: '724-133-259',
  crn: '90420',
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
  const value = (r['value'] ?? r['Value'] ?? valueEn ?? valueAr ?? null) as string | null;
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

/** Reject empty / placeholder CMS values like "..." */
function cleanUrlOrText(raw: string | null | undefined): string {
  const v = (raw ?? '').trim();
  if (!v || v === '#' || v === '...' || v === '—') {
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
  const str = (v: unknown) => cleanUrlOrText(v == null ? '' : String(v));
  return {
    fra: str(o['fra'] ?? o['FRA'] ?? o['licensedByFra'] ?? o['licensed_by_fra']),
    trn: str(o['trn'] ?? o['TRN'] ?? o['trnNumber'] ?? o['trn_number']),
    crn: str(o['crn'] ?? o['CRN']),
    appStoreUrl: str(
      o['appStoreUrl'] ?? o['app_store_url'] ?? o['appStore'] ?? o['appleStoreUrl']
    ),
    playStoreUrl: str(
      o['playStoreUrl'] ??
        o['play_store_url'] ??
        o['googlePlayUrl'] ??
        o['google_play_url'] ??
        o['googlePlay']
    ),
  };
}

function firstNonEmpty(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    const cleaned = cleanUrlOrText(value);
    if (cleaned) {
      return cleaned;
    }
  }
  return '';
}

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private footerConfig$?: Observable<FooterPublicConfig>;

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
      map((raw) => {
        const envelope = readApiEnvelope<unknown>(raw);
        if (!envelope.success || envelope.data === null || envelope.data === undefined) {
          throw new Error(envelope.message || 'Failed to load public settings');
        }
        const listRaw = Array.isArray(envelope.data) ? envelope.data : [];
        return listRaw.reduce<Record<string, string>>((acc, item) => {
          const row = normalizeSettingItem(item);
          const val = cleanUrlOrText(row.valueEn || row.value || row.valueAr || '');
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
   */
  getFooterConfig(): Observable<FooterPublicConfig> {
    if (!this.footerConfig$) {
      this.footerConfig$ = forkJoin({
        settings: this.getPublicSettingsMap().pipe(
          catchError(() => of({} as Record<string, string>))
        ),
        home: this.pagesService.getPageBySlug('home').pipe(
          catchError(() => of(null as CmsPage | null))
        ),
      }).pipe(
        map(({ settings, home }) => this.mergeFooterConfig(settings, home)),
        catchError(() => of({ ...DEFAULT_FOOTER_PUBLIC })),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.footerConfig$;
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
      facebookUrl: firstNonEmpty(
        fromSettings.facebookUrl,
        DEFAULT_FOOTER_PUBLIC.facebookUrl
      ),
      instagramUrl: firstNonEmpty(
        fromSettings.instagramUrl,
        DEFAULT_FOOTER_PUBLIC.instagramUrl
      ),
      linkedinUrl: firstNonEmpty(
        fromSettings.linkedinUrl,
        DEFAULT_FOOTER_PUBLIC.linkedinUrl
      ),
      fra: firstNonEmpty(
        fromSettings.fra,
        fromSiteFooter.fra,
        DEFAULT_FOOTER_PUBLIC.fra
      ),
      trn: firstNonEmpty(
        fromSettings.trn,
        fromSiteFooter.trn,
        DEFAULT_FOOTER_PUBLIC.trn
      ),
      crn: firstNonEmpty(
        fromSettings.crn,
        fromSiteFooter.crn,
        DEFAULT_FOOTER_PUBLIC.crn
      ),
      appStoreUrl: firstNonEmpty(
        fromSettings.appStoreUrl,
        fromSiteFooter.appStoreUrl,
        fromDownloadCta.appStoreUrl,
        DEFAULT_FOOTER_PUBLIC.appStoreUrl
      ),
      playStoreUrl: firstNonEmpty(
        fromSettings.playStoreUrl,
        fromSiteFooter.playStoreUrl,
        fromDownloadCta.playStoreUrl,
        DEFAULT_FOOTER_PUBLIC.playStoreUrl
      ),
    };
  }

  private sectionExtra(
    page: CmsPage | null,
    sectionKey: string
  ): Partial<FooterPublicConfig> {
    const section = page?.sections?.find(
      (s) => s.isActive && s.sectionKey?.toLowerCase() === sectionKey
    );
    return section ? parseFooterExtra(section.extraDataJson) : {};
  }
}
