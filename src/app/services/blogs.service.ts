import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, combineLatest, map, Observable, of, switchMap } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  AppLanguage,
  LanguageService,
  pickLocalized
} from './language.service';
import {
  CmsPageSection,
  CmsPageSectionItem,
  joinApiPath,
  PagesService,
  readApiEnvelope,
  resolveCmsAssetUrl
} from './pages.service';

/** Matches dashboard blog detail form: Banner → Quote → Intro → Section 1 → Section 2 */
export interface BlogDetailPost {
  id: number;
  slug: string | null;
  title: string;
  heroImage: string | null;
  quote: string | null;
  quoteBy: string | null;
  introParagraphs: string[];
  section1: {
    title: string | null;
    body: string | null;
  };
  section2: {
    title: string | null;
    lead: string | null;
    listItems: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class BlogsService {
  constructor(
    private readonly http: HttpClient,
    private readonly pagesService: PagesService,
    private readonly language: LanguageService
  ) {}

  getPostById(id: number): Observable<BlogDetailPost | null> {
    if (!Number.isFinite(id) || id <= 0) {
      return of(null);
    }

    return combineLatest([this.loadRawPost(id), this.language.lang$]).pipe(
      map(([raw, lang]) => (raw ? this.localizePost(raw, lang) : null))
    );
  }

  private loadRawPost(id: number): Observable<RawBlogDetail | null> {
    return this.tryDedicatedBlogApi(id).pipe(
      switchMap((fromApi) => (fromApi ? of(fromApi) : this.fromCmsBlogsPage(id)))
    );
  }

  private tryDedicatedBlogApi(id: number): Observable<RawBlogDetail | null> {
    const paths = [
      `/blog-posts/${id}`,
      `/BlogPosts/${id}`,
      `/blogs/${id}`,
      `/blogs/detail/${id}`
    ];

    const tryPath = (index: number): Observable<RawBlogDetail | null> => {
      if (index >= paths.length) {
        return of(null);
      }
      const url = joinApiPath(environment.apiBaseUrl, paths[index]);
      return this.http.get<unknown>(url).pipe(
        map((raw) => {
          const envelope = readApiEnvelope<unknown>(raw);
          if (!envelope.success || envelope.data == null) {
            return null;
          }
          return this.normalizeDashboardPayload(envelope.data, id);
        }),
        catchError(() => tryPath(index + 1))
      );
    };

    return tryPath(0);
  }

  private fromCmsBlogsPage(id: number): Observable<RawBlogDetail | null> {
    return this.pagesService.getPageBySlug('blogs').pipe(
      map((page) => {
        for (const section of page.sections ?? []) {
          if (!section.isActive || !section.items?.length) {
            continue;
          }
          const item = section.items.find((i) => i.isActive && i.id === id);
          if (item) {
            return this.mapCmsItemToRaw(item, section);
          }
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  private mapCmsItemToRaw(
    item: CmsPageSectionItem,
    section: CmsPageSection
  ): RawBlogDetail {
    const detail = this.parseDetailJson(item.extraDataJson);
    const isFeatured = section.sectionKey === 'featured_blog';

    const heroFromCms =
      (isFeatured ? section.imageMediaFileUrl || section.imageUrl : null) ||
      item.backgroundImageMediaFileUrl ||
      item.backgroundImageUrl ||
      item.imageMediaFileUrl ||
      item.imageUrl;

    const raw: RawBlogDetail = {
      id: item.id,
      slug: detail.slug,
      titleEn: detail.titleEn || (isFeatured ? section.titleEn : null) || item.titleEn,
      titleAr: detail.titleAr || (isFeatured ? section.titleAr : null) || item.titleAr,
      heroImage: detail.heroImage || heroFromCms,
      quoteEn: detail.quoteEn,
      quoteAr: detail.quoteAr,
      quoteByEn: detail.quoteByEn,
      quoteByAr: detail.quoteByAr,
      paragraphsEn: detail.paragraphsEn || null,
      paragraphsAr: detail.paragraphsAr || null,
      section1HeadingEn: detail.section1HeadingEn,
      section1HeadingAr: detail.section1HeadingAr,
      section1TextEn: detail.section1TextEn,
      section1TextAr: detail.section1TextAr,
      section2HeadingEn: detail.section2HeadingEn,
      section2HeadingAr: detail.section2HeadingAr,
      section2LeadEn: detail.section2LeadEn,
      section2LeadAr: detail.section2LeadAr,
      section2ListEn: detail.section2ListEn,
      section2ListAr: detail.section2ListAr
    };

    return this.withFilledArticleIfSparse(raw, item);
  }

  /**
   * List cards keep a short description + date.
   * Detail pages need the full article layout — fill when CMS only has a blurb.
   */
  private withFilledArticleIfSparse(
    raw: RawBlogDetail,
    item: CmsPageSectionItem
  ): RawBlogDetail {
    const hasArticle =
      !!(raw.quoteEn || raw.quoteAr) ||
      !!(raw.section1HeadingEn || raw.section1TextEn) ||
      !!(raw.section2HeadingEn || raw.section2LeadEn || raw.section2ListEn) ||
      splitParagraphs(raw.paragraphsEn).length > 1;

    if (hasArticle) {
      if (!raw.paragraphsEn && item.descriptionEn) {
        return { ...raw, paragraphsEn: item.descriptionEn };
      }
      return raw;
    }

    const d = defaultBlogDetailBody();
    const blurb = (item.descriptionEn || '').trim();
    const paragraphsEn =
      blurb && blurb.length <= 280
        ? [blurb, ...d.introParagraphsEn.slice(1)].join('\n\n')
        : d.introParagraphsEn.join('\n\n');

    return {
      ...raw,
      quoteEn: d.quoteEn,
      quoteAr: d.quoteAr,
      quoteByEn: d.quoteByEn,
      quoteByAr: d.quoteByAr,
      paragraphsEn,
      paragraphsAr: d.introParagraphsAr.join('\n\n'),
      section1HeadingEn: d.section1.titleEn,
      section1HeadingAr: d.section1.titleAr,
      section1TextEn: d.section1.bodyEn,
      section1TextAr: d.section1.bodyAr,
      section2HeadingEn: d.section2.titleEn,
      section2HeadingAr: d.section2.titleAr,
      section2LeadEn: d.section2.leadEn,
      section2LeadAr: d.section2.leadAr,
      section2ListEn: d.section2.listItemsEn.join('\n'),
      section2ListAr: d.section2.listItemsAr.join('\n')
    };
  }

  /** Normalize dedicated API / dashboard save payload into bilingual raw fields. */
  private normalizeDashboardPayload(raw: unknown, fallbackId: number): RawBlogDetail | null {
    const r = asRecord(raw);
    const id = Number(r['id'] ?? r['Id'] ?? fallbackId);
    if (!id) {
      return null;
    }

    const nested = this.parseDetailJson(
      str(r['extraDataJson'] ?? r['ExtraDataJson'] ?? r['detailJson'] ?? r['DetailJson'])
    );

    const section1 = asRecord(r['section1'] ?? r['Section1'] ?? nested.section1Obj);
    const section2 = asRecord(r['section2'] ?? r['Section2'] ?? nested.section2Obj);

    return {
      id,
      slug: str(r['slug'] ?? r['Slug']) || nested.slug,
      titleEn:
        bilingual(r, 'title').en ||
        bilingual(r, 'bannerTitle').en ||
        nested.titleEn,
      titleAr:
        bilingual(r, 'title').ar ||
        bilingual(r, 'bannerTitle').ar ||
        nested.titleAr,
      heroImage:
        str(
          r['bannerImageUrl'] ??
            r['BannerImageUrl'] ??
            r['bannerImageMediaFileUrl'] ??
            r['BannerImageMediaFileUrl'] ??
            r['imageMediaFileUrl'] ??
            r['ImageMediaFileUrl'] ??
            r['imageUrl'] ??
            r['ImageUrl']
        ) || nested.heroImage,
      quoteEn: bilingual(r, 'quote').en || nested.quoteEn,
      quoteAr: bilingual(r, 'quote').ar || nested.quoteAr,
      quoteByEn:
        bilingual(r, 'quoteBy').en ||
        bilingual(r, 'quoteAuthor').en ||
        nested.quoteByEn,
      quoteByAr:
        bilingual(r, 'quoteBy').ar ||
        bilingual(r, 'quoteAuthor').ar ||
        nested.quoteByAr,
      paragraphsEn:
        bilingual(r, 'paragraphs').en ||
        bilingual(r, 'introParagraphs').en ||
        nested.paragraphsEn,
      paragraphsAr:
        bilingual(r, 'paragraphs').ar ||
        bilingual(r, 'introParagraphs').ar ||
        nested.paragraphsAr,
      section1HeadingEn:
        bilingual(section1, 'heading').en ||
        bilingual(section1, 'title').en ||
        nested.section1HeadingEn,
      section1HeadingAr:
        bilingual(section1, 'heading').ar ||
        bilingual(section1, 'title').ar ||
        nested.section1HeadingAr,
      section1TextEn:
        bilingual(section1, 'text').en ||
        bilingual(section1, 'body').en ||
        nested.section1TextEn,
      section1TextAr:
        bilingual(section1, 'text').ar ||
        bilingual(section1, 'body').ar ||
        nested.section1TextAr,
      section2HeadingEn:
        bilingual(section2, 'heading').en ||
        bilingual(section2, 'title').en ||
        nested.section2HeadingEn,
      section2HeadingAr:
        bilingual(section2, 'heading').ar ||
        bilingual(section2, 'title').ar ||
        nested.section2HeadingAr,
      section2LeadEn:
        bilingual(section2, 'leadText').en ||
        bilingual(section2, 'lead').en ||
        nested.section2LeadEn,
      section2LeadAr:
        bilingual(section2, 'leadText').ar ||
        bilingual(section2, 'lead').ar ||
        nested.section2LeadAr,
      section2ListEn:
        bilingual(section2, 'list').en ||
        listField(section2, 'listItems', 'listItemsEn') ||
        nested.section2ListEn,
      section2ListAr:
        bilingual(section2, 'list').ar ||
        listField(section2, 'listItemsAr') ||
        nested.section2ListAr
    };
  }

  private parseDetailJson(raw: string | null | undefined): ParsedDetail {
    const empty: ParsedDetail = {
      slug: null,
      titleEn: null,
      titleAr: null,
      heroImage: null,
      quoteEn: null,
      quoteAr: null,
      quoteByEn: null,
      quoteByAr: null,
      paragraphsEn: null,
      paragraphsAr: null,
      section1HeadingEn: null,
      section1HeadingAr: null,
      section1TextEn: null,
      section1TextAr: null,
      section2HeadingEn: null,
      section2HeadingAr: null,
      section2LeadEn: null,
      section2LeadAr: null,
      section2ListEn: null,
      section2ListAr: null,
      section1Obj: null,
      section2Obj: null
    };

    if (!raw?.trim() || (!raw.trim().startsWith('{') && !raw.trim().startsWith('['))) {
      return empty;
    }

    try {
      const parsed = asRecord(JSON.parse(raw));
      const section1 = asRecord(parsed['section1'] ?? parsed['Section1']);
      const section2 = asRecord(parsed['section2'] ?? parsed['Section2']);

      return {
        slug: str(parsed['slug'] ?? parsed['Slug']),
        titleEn: bilingual(parsed, 'title').en || bilingual(parsed, 'bannerTitle').en,
        titleAr: bilingual(parsed, 'title').ar || bilingual(parsed, 'bannerTitle').ar,
        heroImage: str(
          parsed['heroImage'] ??
            parsed['bannerImage'] ??
            parsed['bannerImageUrl'] ??
            parsed['imageUrl']
        ),
        quoteEn: bilingual(parsed, 'quote').en,
        quoteAr: bilingual(parsed, 'quote').ar,
        quoteByEn: bilingual(parsed, 'quoteBy').en || bilingual(parsed, 'quoteAuthor').en,
        quoteByAr: bilingual(parsed, 'quoteBy').ar || bilingual(parsed, 'quoteAuthor').ar,
        paragraphsEn:
          bilingual(parsed, 'paragraphs').en || bilingual(parsed, 'introParagraphs').en,
        paragraphsAr:
          bilingual(parsed, 'paragraphs').ar || bilingual(parsed, 'introParagraphs').ar,
        section1HeadingEn:
          bilingual(section1, 'heading').en ||
          bilingual(section1, 'title').en ||
          bilingual(parsed, 'section1Heading').en,
        section1HeadingAr:
          bilingual(section1, 'heading').ar ||
          bilingual(section1, 'title').ar ||
          bilingual(parsed, 'section1Heading').ar,
        section1TextEn:
          bilingual(section1, 'text').en ||
          bilingual(section1, 'body').en ||
          bilingual(parsed, 'section1Text').en,
        section1TextAr:
          bilingual(section1, 'text').ar ||
          bilingual(section1, 'body').ar ||
          bilingual(parsed, 'section1Text').ar,
        section2HeadingEn:
          bilingual(section2, 'heading').en ||
          bilingual(section2, 'title').en ||
          bilingual(parsed, 'section2Heading').en,
        section2HeadingAr:
          bilingual(section2, 'heading').ar ||
          bilingual(section2, 'title').ar ||
          bilingual(parsed, 'section2Heading').ar,
        section2LeadEn:
          bilingual(section2, 'leadText').en ||
          bilingual(section2, 'lead').en ||
          bilingual(parsed, 'section2Lead').en,
        section2LeadAr:
          bilingual(section2, 'leadText').ar ||
          bilingual(section2, 'lead').ar ||
          bilingual(parsed, 'section2Lead').ar,
        section2ListEn:
          bilingual(section2, 'list').en ||
          listField(section2, 'listItems', 'listItemsEn') ||
          bilingual(parsed, 'section2List').en,
        section2ListAr:
          bilingual(section2, 'list').ar ||
          listField(section2, 'listItemsAr') ||
          bilingual(parsed, 'section2List').ar,
        section1Obj: section1,
        section2Obj: section2
      };
    } catch {
      return empty;
    }
  }

  private localizePost(raw: RawBlogDetail, lang: AppLanguage): BlogDetailPost {
    const paragraphsText = pickLocalized(lang, raw.paragraphsEn, raw.paragraphsAr);
    const listText = pickLocalized(lang, raw.section2ListEn, raw.section2ListAr);

    return {
      id: raw.id,
      slug: raw.slug,
      title: pickLocalized(lang, raw.titleEn, raw.titleAr) || '',
      heroImage: resolveCmsAssetUrl(environment.apiOrigin, raw.heroImage),
      quote: pickLocalized(lang, raw.quoteEn, raw.quoteAr),
      quoteBy: pickLocalized(lang, raw.quoteByEn, raw.quoteByAr),
      introParagraphs: splitParagraphs(paragraphsText),
      section1: {
        title: pickLocalized(lang, raw.section1HeadingEn, raw.section1HeadingAr),
        body: pickLocalized(lang, raw.section1TextEn, raw.section1TextAr)
      },
      section2: {
        title: pickLocalized(lang, raw.section2HeadingEn, raw.section2HeadingAr),
        lead: pickLocalized(lang, raw.section2LeadEn, raw.section2LeadAr),
        listItems: splitListItems(listText)
      }
    };
  }
}

interface RawBlogDetail {
  id: number;
  slug: string | null;
  titleEn: string | null;
  titleAr: string | null;
  heroImage: string | null;
  quoteEn: string | null;
  quoteAr: string | null;
  quoteByEn: string | null;
  quoteByAr: string | null;
  paragraphsEn: string | null;
  paragraphsAr: string | null;
  section1HeadingEn: string | null;
  section1HeadingAr: string | null;
  section1TextEn: string | null;
  section1TextAr: string | null;
  section2HeadingEn: string | null;
  section2HeadingAr: string | null;
  section2LeadEn: string | null;
  section2LeadAr: string | null;
  section2ListEn: string | null;
  section2ListAr: string | null;
}

interface ParsedDetail extends Omit<RawBlogDetail, 'id'> {
  section1Obj: Record<string, unknown> | null;
  section2Obj: Record<string, unknown> | null;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function str(v: unknown): string | null {
  if (v == null) {
    return null;
  }
  if (Array.isArray(v)) {
    return v.map((x) => String(x).trim()).filter(Boolean).join('\n') || null;
  }
  const s = String(v).trim();
  return s ? s : null;
}

function bilingual(
  r: Record<string, unknown>,
  base: string
): { en: string | null; ar: string | null } {
  const enKey = `${base}En`;
  const arKey = `${base}Ar`;
  const pascal = base.charAt(0).toUpperCase() + base.slice(1);
  return {
    en: str(r[enKey] ?? r[`${pascal}En`] ?? r[base] ?? r[pascal]),
    ar: str(r[arKey] ?? r[`${pascal}Ar`])
  };
}

function listField(r: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = r[key] ?? r[key.charAt(0).toUpperCase() + key.slice(1)];
    if (Array.isArray(v)) {
      return v.map((x) => String(x).trim()).filter(Boolean).join('\n') || null;
    }
    const s = str(v);
    if (s) {
      return s;
    }
  }
  return null;
}

function splitParagraphs(text: string | null | undefined): string[] {
  if (!text?.trim()) {
    return [];
  }
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function splitListItems(text: string | null | undefined): string[] {
  if (!text?.trim()) {
    return [];
  }
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•\d]+[.)]\s*/, '').trim())
    .filter(Boolean);
}

/** Same layout as dashboard blog editor defaults — used when a card has no full article yet */
function defaultBlogDetailBody() {
  return {
    quoteEn:
      '“Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation labor”',
    quoteAr:
      '«هذا نص تجريبي يوضح الاقتباس الظاهر تحت صورة المقال، ويمكن استبداله بمحتوى عربي حقيقي.»',
    quoteByEn: '— Waseela Editorial',
    quoteByAr: '— فريق وسيلة',
    introParagraphsEn: [
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
      'Elit nisi in eleifend sed nisi. Pulvinar at orci, proin imperdiet commodo consectetur convallis risus. Sed condimentum enim dignissim adipiscing faucibus consequat, urna. Viverra purus et erat auctor aliquam. Risus, volutpat vulputate posuere purus sit congue convallis aliquet.',
      'Ipsum sit mattis nulla quam nulla. Gravida id gravida ac enim mauris id. Non pellentesque congue eget consectetur turpis. Sapien, dictum molestie sem tempor. Diam elit, orci, tincidunt aenean tempus. Quis velit eget ut tortor tellus. Sed vel, congue felis elit.'
    ],
    introParagraphsAr: [
      'هذه فقرة تعريفية بالعربية تظهر بعد الاقتباس مباشرة على صفحة المقال.',
      'فقرة ثانية تشرح الفكرة بمزيد من التفاصيل حتى تبدو الصفحة ممتلئة.',
      'فقرة ثالثة يمكن استبدالها بنص المنتج أو التحديثات الفعلية لوسيلة.'
    ],
    section1: {
      titleEn: 'Lorem ipsum',
      titleAr: 'عنوان القسم الأول',
      bodyEn:
        'Pharetra morbi libero id aliquam elit massa integer tellus. Quis felis aliquam ullamcorper porttitor. Pulvinar ullamcorper sit dictumst ut eget a, elementum eu. Maecenas est morbi mattis id in ac pellentesque ac.',
      bodyAr: 'نص القسم الأول بالعربية. اكتب هنا التفاصيل الأساسية للمقال.'
    },
    section2: {
      titleEn: 'Lorem ipsum',
      titleAr: 'عنوان القسم الثاني',
      leadEn:
        'Sagittis et eu at elementum, quis in. Proin praesent volutpat egestas sociis sit lorem nunc nunc sit. Eget diam curabitur mi ac.',
      leadAr: 'مقدمة القسم الثاني بالعربية قبل القائمة المرقّمة.',
      listItemsEn: [
        'Lectus id duis vitae porttitor enim gravida morbi.',
        'Eu turpis posuere semper feugiat volutpat elit, ultrices suspendisse.',
        'Suspendisse maecenas ac donec scelerisque diam sed est duis purus.',
        'Auctor vel in vitae placerat.'
      ],
      listItemsAr: [
        'نقطة أولى بالعربية يمكن تعديلها من الداشبورد.',
        'نقطة ثانية توضح فائدة أو خطوة عملية.',
        'نقطة ثالثة لاستكمال الشكل النهائي للمقال.',
        'نقطة رابعة اختيارية حسب طول المحتوى.'
      ]
    }
  };
}
