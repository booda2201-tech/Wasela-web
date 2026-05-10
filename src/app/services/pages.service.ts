import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';

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
  subTitle: string | null;
  description: string | null;
  imageUrl: string | null;
  imageMediaFileUrl: string | null;
  backgroundImageUrl: string | null;
  backgroundImageMediaFileUrl: string | null;
  extraDataJson: string | null;
  buttonText: string | null;
  buttonUrl: string | null;
  galleryMedia: CmsGalleryMediaItem[];
  sortOrder: number;
  isActive: boolean;
}

export interface CmsPageSection {
  id: number;
  pageId: number;
  sectionKey: string;
  sectionType: number;
  title: string | null;
  subTitle: string | null;
  description: string | null;
  buttonText: string | null;
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
  slug: string;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  sections: CmsPageSection[];
}

function strOrNull(v: unknown): string | null {
  if (v === null || v === undefined) {
    return null;
  }
  const s = String(v);
  return s === '' ? null : s;
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
  return {
    id: Number(r['id'] ?? r['Id']),
    pageSectionId: Number(r['pageSectionId'] ?? r['PageSectionId']),
    title: strOrNull(r['title'] ?? r['Title']),
    subTitle: strOrNull(r['subTitle'] ?? r['SubTitle']),
    description: strOrNull(r['description'] ?? r['Description']),
    imageUrl: strOrNull(r['imageUrl'] ?? r['ImageUrl']),
    imageMediaFileUrl: strOrNull(r['imageMediaFileUrl'] ?? r['ImageMediaFileUrl']),
    backgroundImageUrl: strOrNull(r['backgroundImageUrl'] ?? r['BackgroundImageUrl']),
    backgroundImageMediaFileUrl: strOrNull(
      r['backgroundImageMediaFileUrl'] ?? r['BackgroundImageMediaFileUrl']
    ),
    extraDataJson: strOrNull(r['extraDataJson'] ?? r['ExtraDataJson']),
    buttonText: strOrNull(r['buttonText'] ?? r['ButtonText']),
    buttonUrl: strOrNull(r['buttonUrl'] ?? r['ButtonUrl']),
    galleryMedia: gallery,
    sortOrder: Number(r['sortOrder'] ?? r['SortOrder'] ?? 0),
    isActive: !!(r['isActive'] ?? r['IsActive']),
  };
}

function normalizeSection(raw: unknown): CmsPageSection {
  const r = asRecord(raw);
  const itemsRaw = (r['items'] ?? r['Items'] ?? []) as unknown[];
  return {
    id: Number(r['id'] ?? r['Id']),
    pageId: Number(r['pageId'] ?? r['PageId']),
    sectionKey: String(r['sectionKey'] ?? r['SectionKey'] ?? ''),
    sectionType: Number(r['sectionType'] ?? r['SectionType'] ?? 0),
    title: strOrNull(r['title'] ?? r['Title']),
    subTitle: strOrNull(r['subTitle'] ?? r['SubTitle']),
    description: strOrNull(r['description'] ?? r['Description']),
    buttonText: strOrNull(r['buttonText'] ?? r['ButtonText']),
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
  return {
    id: Number(r['id'] ?? r['Id']),
    name: String(r['name'] ?? r['Name'] ?? ''),
    slug: String(r['slug'] ?? r['Slug'] ?? ''),
    isActive: !!(r['isActive'] ?? r['IsActive']),
    metaTitle: strOrNull(r['metaTitle'] ?? r['MetaTitle']),
    metaDescription: strOrNull(r['metaDescription'] ?? r['MetaDescription']),
    sections: Array.isArray(sectionsRaw) ? sectionsRaw.map(normalizeSection) : [],
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
  constructor(private readonly http: HttpClient) {}

  getPageBySlug(slug: string): Observable<CmsPage> {
    const url = joinApiPath(
      environment.apiBaseUrl,
      `/pages/by-slug/${encodeURIComponent(slug)}`
    );
    return this.http.get<unknown>(url).pipe(
      map((raw) => {
        const envelope = readApiEnvelope<unknown>(raw);
        if (!envelope.success || envelope.data === null || envelope.data === undefined) {
          throw new Error(envelope.message || 'Failed to load page');
        }
        return normalizeCmsPage(envelope.data);
      })
    );
  }
}
