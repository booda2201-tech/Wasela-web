import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, combineLatest, shareReplay } from 'rxjs';

import { environment } from '../../environments/environment';
import { AppLanguage, LanguageService, pickLocalized } from './language.service';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

/** Supports camelCase or default .NET JSON (PascalCase) property names. */
export function readApiEnvelope<T>(raw: unknown): ApiEnvelope<T> {
  const r = asRecord(raw);
  const successVal = r['success'] ?? r['Success'];
  const message = String(r['message'] ?? r['Message'] ?? '');
  const data = (r['data'] ?? r['Data']) as T;
  const errors = r['errors'] ?? r['Errors'] ?? null;
  const success = successVal === true || successVal === 'true';
  return { success, message, data, errors };
}

export interface CmsGalleryMediaItem {
  id: number;
  mediaFileId: number;
  fileUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CmsPageSectionItem {
  id: number;
  pageSectionId: number;
  title: string | null;
  titleEn: string | null;
  titleAr: string | null;
  subTitle: string | null;
  subTitleEn: string | null;
  subTitleAr: string | null;
  description: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  imageUrl: string | null;
  imageMediaFileUrl: string | null;
  backgroundImageUrl: string | null;
  backgroundImageMediaFileUrl: string | null;
  extraDataJson: string | null;
  buttonText: string | null;
  buttonTextEn: string | null;
  buttonTextAr: string | null;
  buttonUrl: string | null;
  galleryMedia: CmsGalleryMediaItem[];
  sortOrder: number;
  isActive: boolean;
}

export interface CmsPageSection {
  id: number;
  pageId: number;
  sectionKey: string;
  sectionType: string | number;
  title: string | null;
  titleEn: string | null;
  titleAr: string | null;
  subTitle: string | null;
  subTitleEn: string | null;
  subTitleAr: string | null;
  description: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  buttonText: string | null;
  buttonTextEn: string | null;
  buttonTextAr: string | null;
  buttonUrl: string | null;
  extraDataJson: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  imageMediaFileUrl: string | null;
  backgroundImageUrl: string | null;
  backgroundImageMediaFileUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  items: CmsPageSectionItem[];
}

export interface CmsPage {
  id: number;
  name: string;
  nameEn: string | null;
  nameAr: string | null;
  slug: string;
  isActive: boolean;
  metaTitle: string | null;
  metaTitleEn: string | null;
  metaTitleAr: string | null;
  metaDescription: string | null;
  metaDescriptionEn: string | null;
  metaDescriptionAr: string | null;
  sections: CmsPageSection[];
}

function strOrNull(v: unknown): string | null {
  if (v === null || v === undefined) {
    return null;
  }
  const s = String(v);
  return s === '' ? null : s;
}

function readBilingual(
  r: Record<string, unknown>,
  enKey: string,
  arKey: string,
  legacyKey?: string
): { en: string | null; ar: string | null } {
  const legacy = legacyKey ? strOrNull(r[legacyKey] ?? r[legacyKey[0].toUpperCase() + legacyKey.slice(1)]) : null;
  const en = strOrNull(r[enKey] ?? r[enKey[0].toUpperCase() + enKey.slice(1)] ?? legacy);
  const ar = strOrNull(r[arKey] ?? r[arKey[0].toUpperCase() + arKey.slice(1)]);
  return { en, ar };
}

function normalizeGalleryMediaItem(raw: unknown): CmsGalleryMediaItem {
  const r = asRecord(raw);
  return {
    id: Number(r['id'] ?? r['Id']),
    mediaFileId: Number(r['mediaFileId'] ?? r['MediaFileId'] ?? 0),
    fileUrl: strOrNull(r['fileUrl'] ?? r['FileUrl']),
    sortOrder: Number(r['sortOrder'] ?? r['SortOrder'] ?? 0),
    isActive: !!(r['isActive'] ?? r['IsActive']),
  };
}

function normalizeItem(raw: unknown): CmsPageSectionItem {
  const r = asRecord(raw);
  const galleryRaw = (r['galleryMedia'] ?? r['GalleryMedia'] ?? []) as unknown[];
  const gallery = Array.isArray(galleryRaw)
    ? galleryRaw
        .map(normalizeGalleryMediaItem)
        .filter((g) => g.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    : [];
  const title = readBilingual(r, 'titleEn', 'titleAr', 'title');
  const subTitle = readBilingual(r, 'subTitleEn', 'subTitleAr', 'subTitle');
  const description = readBilingual(r, 'descriptionEn', 'descriptionAr', 'description');
  const buttonText = readBilingual(r, 'buttonTextEn', 'buttonTextAr', 'buttonText');
  return {
    id: Number(r['id'] ?? r['Id']),
    pageSectionId: Number(r['pageSectionId'] ?? r['PageSectionId']),
    titleEn: title.en,
    titleAr: title.ar,
    title: title.en ?? title.ar,
    subTitleEn: subTitle.en,
    subTitleAr: subTitle.ar,
    subTitle: subTitle.en ?? subTitle.ar,
    descriptionEn: description.en,
    descriptionAr: description.ar,
    description: description.en ?? description.ar,
    buttonTextEn: buttonText.en,
    buttonTextAr: buttonText.ar,
    buttonText: buttonText.en ?? buttonText.ar,
    imageUrl: strOrNull(r['imageUrl'] ?? r['ImageUrl']),
    imageMediaFileUrl: strOrNull(r['imageMediaFileUrl'] ?? r['ImageMediaFileUrl']),
    backgroundImageUrl: strOrNull(r['backgroundImageUrl'] ?? r['BackgroundImageUrl']),
    backgroundImageMediaFileUrl: strOrNull(
      r['backgroundImageMediaFileUrl'] ?? r['BackgroundImageMediaFileUrl']
    ),
    extraDataJson: strOrNull(r['extraDataJson'] ?? r['ExtraDataJson']),
    buttonUrl: strOrNull(r['buttonUrl'] ?? r['ButtonUrl']),
    galleryMedia: gallery,
    sortOrder: Number(r['sortOrder'] ?? r['SortOrder'] ?? 0),
    isActive: !!(r['isActive'] ?? r['IsActive']),
  };
}

function normalizeSection(raw: unknown): CmsPageSection {
  const r = asRecord(raw);
  const itemsRaw = (r['items'] ?? r['Items'] ?? []) as unknown[];
  const sectionTypeRaw = r['sectionType'] ?? r['SectionType'] ?? 0;
  const title = readBilingual(r, 'titleEn', 'titleAr', 'title');
  const subTitle = readBilingual(r, 'subTitleEn', 'subTitleAr', 'subTitle');
  const description = readBilingual(r, 'descriptionEn', 'descriptionAr', 'description');
  const buttonText = readBilingual(r, 'buttonTextEn', 'buttonTextAr', 'buttonText');
  return {
    id: Number(r['id'] ?? r['Id']),
    pageId: Number(r['pageId'] ?? r['PageId']),
    sectionKey: String(r['sectionKey'] ?? r['SectionKey'] ?? ''),
    sectionType:
      typeof sectionTypeRaw === 'string' || typeof sectionTypeRaw === 'number'
        ? sectionTypeRaw
        : 0,
    titleEn: title.en,
    titleAr: title.ar,
    title: title.en ?? title.ar,
    subTitleEn: subTitle.en,
    subTitleAr: subTitle.ar,
    subTitle: subTitle.en ?? subTitle.ar,
    descriptionEn: description.en,
    descriptionAr: description.ar,
    description: description.en ?? description.ar,
    buttonTextEn: buttonText.en,
    buttonTextAr: buttonText.ar,
    buttonText: buttonText.en ?? buttonText.ar,
    buttonUrl: strOrNull(r['buttonUrl'] ?? r['ButtonUrl']),
    extraDataJson: strOrNull(r['extraDataJson'] ?? r['ExtraDataJson']),
    videoUrl: strOrNull(r['videoUrl'] ?? r['VideoUrl']),
    imageUrl: strOrNull(r['imageUrl'] ?? r['ImageUrl']),
    imageMediaFileUrl: strOrNull(r['imageMediaFileUrl'] ?? r['ImageMediaFileUrl']),
    backgroundImageUrl: strOrNull(r['backgroundImageUrl'] ?? r['BackgroundImageUrl']),
    backgroundImageMediaFileUrl: strOrNull(
      r['backgroundImageMediaFileUrl'] ?? r['BackgroundImageMediaFileUrl']
    ),
    sortOrder: Number(r['sortOrder'] ?? r['SortOrder'] ?? 0),
    isActive: !!(r['isActive'] ?? r['IsActive']),
    items: Array.isArray(itemsRaw) ? itemsRaw.map(normalizeItem) : [],
  };
}

/** Normalizes API payload whether JSON uses camelCase or PascalCase. */
export function normalizeCmsPage(raw: unknown): CmsPage {
  const r = asRecord(raw);
  const sectionsRaw = (r['sections'] ?? r['Sections'] ?? []) as unknown[];
  const name = readBilingual(r, 'nameEn', 'nameAr', 'name');
  const metaTitle = readBilingual(r, 'metaTitleEn', 'metaTitleAr', 'metaTitle');
  const metaDescription = readBilingual(
    r,
    'metaDescriptionEn',
    'metaDescriptionAr',
    'metaDescription'
  );
  return {
    id: Number(r['id'] ?? r['Id']),
    nameEn: name.en,
    nameAr: name.ar,
    name: name.en ?? name.ar ?? '',
    slug: String(r['slug'] ?? r['Slug'] ?? ''),
    isActive: !!(r['isActive'] ?? r['IsActive']),
    metaTitleEn: metaTitle.en,
    metaTitleAr: metaTitle.ar,
    metaTitle: metaTitle.en ?? metaTitle.ar,
    metaDescriptionEn: metaDescription.en,
    metaDescriptionAr: metaDescription.ar,
    metaDescription: metaDescription.en ?? metaDescription.ar,
    sections: Array.isArray(sectionsRaw) ? sectionsRaw.map(normalizeSection) : [],
  };
}

export function localizeCmsPage(page: CmsPage, lang: AppLanguage): CmsPage {
  return {
    ...page,
    name: pickLocalized(lang, page.nameEn, page.nameAr) ?? page.name,
    metaTitle: pickLocalized(lang, page.metaTitleEn, page.metaTitleAr),
    metaDescription: pickLocalized(lang, page.metaDescriptionEn, page.metaDescriptionAr),
    sections: page.sections.map((section) => localizeCmsSection(section, lang)),
  };
}

function localizeCmsSection(section: CmsPageSection, lang: AppLanguage): CmsPageSection {
  return {
    ...section,
    title: pickLocalized(lang, section.titleEn, section.titleAr),
    subTitle: pickLocalized(lang, section.subTitleEn, section.subTitleAr),
    description: pickLocalized(lang, section.descriptionEn, section.descriptionAr),
    buttonText: pickLocalized(lang, section.buttonTextEn, section.buttonTextAr),
    items: section.items.map((item) => localizeCmsItem(item, lang)),
  };
}

function localizeCmsItem(item: CmsPageSectionItem, lang: AppLanguage): CmsPageSectionItem {
  return {
    ...item,
    title: pickLocalized(lang, item.titleEn, item.titleAr),
    subTitle: pickLocalized(lang, item.subTitleEn, item.subTitleAr),
    description: pickLocalized(lang, item.descriptionEn, item.descriptionAr),
    buttonText: pickLocalized(lang, item.buttonTextEn, item.buttonTextAr),
  };
}

export function joinApiPath(base: string, path: string): string {
  const b = base.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

/** Resolve a CMS media or image path to a full URL for img src. */
export function resolveCmsAssetUrl(
  apiBaseUrl: string,
  path: string | null | undefined
): string | null {
  if (path == null || path === '') {
    return null;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return joinApiPath(apiBaseUrl, path);
}

@Injectable({ providedIn: 'root' })
export class PagesService {
  private readonly rawPageCache = new Map<string, Observable<CmsPage>>();

  constructor(
    private readonly http: HttpClient,
    private readonly languageService: LanguageService
  ) {}

  getPageBySlug(slug: string): Observable<CmsPage> {
    return combineLatest([this.getRawPage(slug), this.languageService.lang$]).pipe(
      map(([page, lang]) => localizeCmsPage(page, lang))
    );
  }

  private getRawPage(slug: string): Observable<CmsPage> {
    const cached = this.rawPageCache.get(slug);
    if (cached) {
      return cached;
    }

    const url = joinApiPath(
      environment.apiBaseUrl,
      `/pages/by-slug/${encodeURIComponent(slug)}`
    );
    const raw$ = this.http.get<unknown>(url).pipe(
      map((raw) => {
        const envelope = readApiEnvelope<unknown>(raw);
        if (!envelope.success || envelope.data === null || envelope.data === undefined) {
          throw new Error(envelope.message || 'Failed to load page');
        }
        return normalizeCmsPage(envelope.data);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.rawPageCache.set(slug, raw$);
    return raw$;
  }
}
