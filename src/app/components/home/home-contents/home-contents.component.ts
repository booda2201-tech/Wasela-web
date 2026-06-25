import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CmsPage,
  CmsPageSection,
  CmsPageSectionItem,
  PagesService,
  resolveCmsAssetUrl,
} from '../../../services/pages.service';

@Component({
  selector: 'app-home-contents',
  templateUrl: './home-contents.component.html',
  styleUrls: ['./home-contents.component.scss'],
})
export class HomeContentsComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() homePage: CmsPage | null = null;
  @Input() merchantsPage: CmsPage | null = null;

  @ViewChild('testimonialSwiper') testimonialSwiperRef?: ElementRef<HTMLElement & { initialize: () => void }>;
  @ViewChild('partnersSwiperMobile') partnersSwiperMobileRef?: ElementRef<HTMLElement & { initialize: () => void }>;
  @ViewChild('categoriesTabletSwiper') categoriesTabletSwiperRef?: ElementRef<HTMLElement & { initialize: () => void }>;

  private testimonialSwiperInited = false;
  private partnersMobileSwiperInited = false;
  private categoriesTabletSwiperInited = false;

  categories: Array<{ id: number; title: string; img: string; imgId: string }> = [];

  partnerColumns: Array<{
    title: string;
    partners: Array<{ name: string; logo: string }>;
    styleBase: number;
  }> = [];

  merchantColumns: Array<
    Array<{ bg: string; logo: string; mobileHeight: string; flexWeight: number }>
  > = [[], [], [], []];

  get hasMerchantCards(): boolean {
    return this.merchantColumns.some((col) => col.length > 0);
  }

  testimonials: Array<{
    type: string;
    name: string;
    content: string;
    featured?: boolean;
    avatarSrc: string | null;
    backgroundSrc: string | null;
  }> = [];

  downloadHeadingLine1 = '';
  downloadHeadingLine2 = '';
  downloadSubtitle = '';
  downloadSubtitleMobile = '';
  downloadBackgroundUrl: string | null = null;
  appStoreUrl: string | null = null;
  googlePlayUrl: string | null = null;

  private partnersRotationTimer?: ReturnType<typeof setInterval>;
  private partnersSwapTimeout?: ReturnType<typeof setTimeout>;
  partnersSwapping = false;

  /** عدد كروت التجار في الـ home — 4 أعمدة × 2 صفوف */
  readonly homeMerchantMaxCount = 8;

  /** أوزان flex — توزيع masonry متدرج (كل عمود نمط مختلف) */
  readonly homeMerchantFlexByColumn: number[][] = [
    [2.55, 1.05],
    [1.85, 2.65],
    [1.1, 2.5],
    [2.45, 1.15],
  ];

  /** ارتفاعات متفاوتة على الموبايل/التابلت */
  readonly homeMerchantMobileHeightsByColumn: string[][] = [
    ['350px', '240px'],
    ['260px', '400px'],
    ['240px', '385px'],
    ['355px', '250px'],
  ];

  constructor(private readonly pagesService: PagesService) {}

  ngOnInit(): void {
    if (!this.homePage) {
      forkJoin({
        home: this.pagesService.getPageBySlug('home'),
        merchants: this.pagesService.getPageBySlug('merchants').pipe(catchError(() => of(null))),
      }).subscribe({
        next: ({ home, merchants }) => {
          this.homePage = home;
          this.merchantsPage = merchants;
          this.applyCmsData();
        },
      });
    } else {
      this.applyCmsData();
    }

    this.partnersRotationTimer = setInterval(() => {
      this.partnersSwapping = true;
      this.partnersSwapTimeout = setTimeout(() => {
        this.partnerColumns.forEach((col) => this.rotatePartners(col.partners));
        this.partnersSwapping = false;
      }, 280);
    }, 2600);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['homePage'] || changes['merchantsPage']) {
      this.applyCmsData();
      queueMicrotask(() => this.refreshSwipers());
    }
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.initTestimonialSwiper();
      this.initPartnersMobileSwiper();
      this.initCategoriesTabletSwiper();
    });
  }

  ngOnDestroy(): void {
    if (this.partnersRotationTimer) {
      clearInterval(this.partnersRotationTimer);
    }
    if (this.partnersSwapTimeout) {
      clearTimeout(this.partnersSwapTimeout);
    }
  }

  sectionByKey(key: string): CmsPageSection | null {
    const section = this.homePage?.sections?.find((s) => s.sectionKey === key);
    return section?.isActive ? section : null;
  }

  financeSection(): CmsPageSection | null {
    return this.sectionByKey('finance_categories');
  }

  partnersSection(): CmsPageSection | null {
    return this.sectionByKey('our_partners');
  }

  homeMerchantsSection(): CmsPageSection | null {
    return this.sectionByKey('merchants');
  }

  testimonialsSection(): CmsPageSection | null {
    return this.sectionByKey('testimonials');
  }

  downloadSection(): CmsPageSection | null {
    return this.sectionByKey('download_app_cta');
  }

  asset(path: string | null | undefined): string | null {
    return resolveCmsAssetUrl(environment.apiOrigin, path);
  }

  isExternalUrl(url: string | null | undefined): boolean {
    return !!url && /^https?:\/\//i.test(url);
  }

  /** يقسّم وصف الشركاء لسطرين متساويين عند نهاية الجملة الأولى */
  partnersSubtitleLines(description: string | null | undefined): string[] {
    const text = (description ?? '').trim();
    if (!text) {
      return [];
    }

    const sentenceEnd = text.search(/\.\s+/);
    if (sentenceEnd === -1) {
      return [text];
    }

    const first = text.slice(0, sentenceEnd + 1).trim();
    const second = text.slice(sentenceEnd + 1).trim();
    return second ? [first, second] : [first];
  }

  /** مسار الـ router لزر التجّار في الـ home؛ الافتراضي `/merchants` */
  merchantsHomeCtaRouterPath(section: CmsPageSection): string {
    const raw = section.buttonUrl?.trim();
    if (!raw || this.isExternalUrl(raw)) {
      return '/merchants';
    }
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  /** رابط خارجي لزر التجّار أو `null` لو المفروض يستخدم router */
  merchantsHomeCtaExternalHref(section: CmsPageSection): string | null {
    const raw = section.buttonUrl?.trim();
    return raw && this.isExternalUrl(raw) ? raw : null;
  }

  homeMerchantCardClass(flexWeight: number): string {
    return flexWeight >= 2.2 ? 'merchant-card--tall' : 'merchant-card--short';
  }

  homeMerchantHoverFlex(flexWeight: number): number {
    return flexWeight >= 2.2 ? flexWeight + 0.85 : 1.85;
  }

  merchantLogoSrc(item: CmsPageSectionItem): string | null {
    return this.asset(item.imageMediaFileUrl || item.imageUrl);
  }

  merchantBgSrc(item: CmsPageSectionItem): string | null {
    return this.asset(item.backgroundImageMediaFileUrl || item.backgroundImageUrl);
  }

  private applyCmsData(): void {
    this.buildCategories();
    this.buildPartnerColumns();
    this.buildMerchantColumns();
    this.buildTestimonials();
    this.buildDownloadSection();
  }

  private buildCategories(): void {
    const section = this.financeSection();
    if (!section?.items?.length) {
      this.categories = [];
      return;
    }
    const items = [...section.items]
      .filter((i) => i.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    this.categories = items.map((item) => {
      const src =
        this.asset(item.imageMediaFileUrl || item.imageUrl) ?? '';
      return {
        id: item.id,
        title: item.title ?? '',
        img: src,
        imgId: `category-img-${item.id}`,
      };
    });
  }

  private buildPartnerColumns(): void {
    const section = this.partnersSection();
    if (!section?.items?.length) {
      this.partnerColumns = [];
      return;
    }
    const items = [...section.items]
      .filter((i) => i.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    this.partnerColumns = items.map((item, colIndex) => {
      const partners = item.galleryMedia
        .filter((g) => g.isActive && g.fileUrl)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
        .map((g, logoIndex) => ({
          name: `${item.title ?? 'Partner'} ${logoIndex + 1}`,
          logo: this.asset(g.fileUrl) ?? '',
        }));
      return {
        title: item.title ?? '',
        partners,
        styleBase: colIndex * 2,
      };
    });
  }

  private buildMerchantColumns(): void {
    const page = this.merchantsPage;
    const section = page?.sections?.find((s) => s.sectionKey === '1000_Merchants' && s.isActive);
    if (!section?.items?.length) {
      this.merchantColumns = [[], [], [], []];
      return;
    }
    const source = [...section.items]
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .slice(0, this.homeMerchantMaxCount);
    const cols: CmsPageSectionItem[][] = [[], [], [], []];
    source.forEach((item, index) => {
      cols[index % 4].push(item);
    });
    this.merchantColumns = cols.map((col, columnIndex) =>
      col.map((item, indexInColumn) => {
        const bg = this.merchantBgSrc(item) ?? '';
        const logo = this.merchantLogoSrc(item) ?? '';
        return {
          bg,
          logo,
          mobileHeight:
            this.homeMerchantMobileHeightsByColumn[columnIndex]?.[indexInColumn] ?? '260px',
          flexWeight: this.homeMerchantFlexByColumn[columnIndex]?.[indexInColumn] ?? 1,
        };
      })
    );
  }

  private buildTestimonials(): void {
    const section = this.testimonialsSection();
    if (!section?.items?.length) {
      this.testimonials = [];
      return;
    }
    const items = [...section.items]
      .filter((i) => i.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    this.testimonials = items.map((item, index) => ({
      type: item.title ?? '',
      name: item.subTitle ?? '',
      content: item.description ?? '',
      featured: index === 1,
      avatarSrc: this.asset(item.imageMediaFileUrl || item.imageUrl),
      backgroundSrc: this.asset(item.backgroundImageMediaFileUrl || item.backgroundImageUrl),
    }));
  }

  private buildDownloadSection(): void {
    const section = this.downloadSection();
    if (!section) {
      this.downloadHeadingLine1 = '';
      this.downloadHeadingLine2 = '';
      this.downloadSubtitle = '';
      this.downloadSubtitleMobile = '';
      this.downloadBackgroundUrl = null;
      this.appStoreUrl = null;
      this.googlePlayUrl = null;
      return;
    }
    const title = section.title ?? '';
    const lower = title.toLowerCase();
    const splitAt = lower.indexOf('what matters');
    if (splitAt > 0) {
      this.downloadHeadingLine1 = title.slice(0, splitAt).trim();
      this.downloadHeadingLine2 = title.slice(splitAt).trim();
    } else {
      this.downloadHeadingLine1 = title;
      this.downloadHeadingLine2 = '';
    }
    this.downloadSubtitle = section.description ?? '';
    this.downloadSubtitleMobile = section.description ?? '';
    this.downloadBackgroundUrl = this.asset(
      section.backgroundImageMediaFileUrl || section.backgroundImageUrl
    );
    const parsed = this.parseStoreUrls(section.extraDataJson);
    const app = parsed.appStoreUrl?.trim();
    const play = parsed.googlePlayUrl?.trim();
    this.appStoreUrl =
      app && !this.isPlaceholderUrl(app) ? app : null;
    this.googlePlayUrl =
      play && !this.isPlaceholderUrl(play) ? play : null;
  }

  private isPlaceholderUrl(url: string): boolean {
    return url === '...' || url === '#' || url.length < 4;
  }

  private parseStoreUrls(json: string | null): { appStoreUrl?: string; googlePlayUrl?: string } {
    if (!json) {
      return {};
    }
    try {
      const o = JSON.parse(json) as Record<string, unknown>;
      return {
        appStoreUrl: (o['appStoreUrl'] ?? o['app_store_url']) as string | undefined,
        googlePlayUrl: (o['googlePlayUrl'] ?? o['google_play_url']) as string | undefined,
      };
    } catch {
      return {};
    }
  }

  private refreshSwipers(): void {
    this.testimonialSwiperInited = false;
    this.partnersMobileSwiperInited = false;
    this.categoriesTabletSwiperInited = false;
    this.initTestimonialSwiper();
    this.initPartnersMobileSwiper();
    this.initCategoriesTabletSwiper();
  }

  private initTestimonialSwiper(): void {
    if (this.testimonialSwiperInited) {
      return;
    }
    const el = this.testimonialSwiperRef?.nativeElement;
    if (!el) {
      return;
    }
    Object.assign(el, {
      slidesPerView: 1,
      slidesPerGroup: 1,
      spaceBetween: 10,
      speed: 450,
      centeredSlides: true,
      breakpoints: {
        640: {
          slidesPerView: 1,
          slidesPerGroup: 1,
          spaceBetween: 20,
          centeredSlides: false,
        },
        1024: {
          slidesPerView: 2,
          slidesPerGroup: 2,
          spaceBetween: 18,
          centeredSlides: true,
        },
        1200: {
          slidesPerView: 3,
          slidesPerGroup: 3,
          spaceBetween: 10,
          centeredSlides: false,
        },
        1360: {
          slidesPerView: 3,
          slidesPerGroup: 3,
          spaceBetween: 18,
          centeredSlides: false,
        },
        1440: {
          slidesPerView: 3,
          slidesPerGroup: 3,
          spaceBetween: 24,
          centeredSlides: false,
        },
      },
    });
    el.initialize();
    this.testimonialSwiperInited = true;
  }

  private initPartnersMobileSwiper(): void {
    if (this.partnersMobileSwiperInited) {
      return;
    }
    const el = this.partnersSwiperMobileRef?.nativeElement;
    if (!el) {
      return;
    }
    Object.assign(el, {
      slidesPerView: 1,
      slidesPerGroup: 1,
      spaceBetween: 20,
      speed: 450,
    });
    el.initialize();
    this.partnersMobileSwiperInited = true;
  }

  private initCategoriesTabletSwiper(): void {
    if (this.categoriesTabletSwiperInited) {
      return;
    }
    const el = this.categoriesTabletSwiperRef?.nativeElement;
    if (!el || this.categories.length < 1) {
      return;
    }

    Object.assign(el, {
      effect: 'coverflow',
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: 1,
      slidesPerGroup: 1,
      loop: this.categories.length > 2,
      speed: 500,
      spaceBetween: 12,
      pagination:
        this.categories.length > 1
          ? {
              clickable: true,
            }
          : false,
      coverflowEffect: {
        rotate: 26,
        stretch: 0,
        depth: 110,
        modifier: 1.05,
        slideShadows: false,
      },
      breakpoints: {
        768: {
          slidesPerView: 1,
          slidesPerGroup: 1,
          spaceBetween: 28,
          centeredSlides: true,
          coverflowEffect: {
            rotate: 0,
            stretch: 0,
            depth: 0,
            modifier: 1,
            slideShadows: false,
          },
        },
      },
    });
    el.initialize();
    this.categoriesTabletSwiperInited = true;
  }

  private rotatePartners(partners: Array<{ name: string; logo: string }>): void {
    if (partners.length < 2) {
      return;
    }
    const first = partners.shift();
    if (first) {
      partners.push(first);
    }
  }
}
