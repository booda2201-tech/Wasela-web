import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { environment } from '../../../environments/environment';
import {
  CmsPage,
  CmsPageSection,
  CmsPageSectionItem,
  PagesService,
  resolveCmsAssetUrl
} from '../../services/pages.service';

type SwiperContainerEl = HTMLElement & { initialize: () => void };

@Component({
  selector: 'app-merchants',
  templateUrl: './merchants.component.html',
  styleUrls: ['./merchants.component.scss']
})
export class MerchantsComponent implements OnInit, AfterViewInit {
  @ViewChild('merchantsSwiperMobile') merchantsSwiperRef?: ElementRef<SwiperContainerEl>;

  loading = true;
  loadError = false;
  page: CmsPage | null = null;

  private merchantsSwiperInited = false;

  /**
   * نفس بيانات التجار مُخزّنة هنا — استدعاء merchantItems()/columns() في القالب كان
   * ينشئ مصفوفات جديدة كل change detection فيُعاد إنشاء الصور وتحميلها من جديد.
   */
  merchantItemsList: CmsPageSectionItem[] = [];
  columnsLayout: CmsPageSectionItem[][] = [[], [], [], []];

  /** موبايل/تابلت: ارتفاع الكرت داخل السلايدر (~500px+ حسب الفيجما) */
  readonly cardMobileHeights =
    'max-lg:h-[600px] max-lg:sm:h-[650px] max-lg:md:h-[860px]';

  /**
   * 4 أعمدة × 3 صفوف — توزيع متدرج:
   * كل عمود نمط مختلف + الصفوف مش متساوية عرضياً
   */
  readonly cardFlexByIndex = [
    3.35, 1.05, 1.75,
    1.85, 3.45, 1.1,
    1.1, 1.95, 3.25,
    3.15, 1.15, 1.65,
  ];

  constructor(
    private readonly pagesService: PagesService,
    private readonly title: Title,
    private readonly meta: Meta
  ) {}

  ngAfterViewInit(): void {
    queueMicrotask(() => setTimeout(() => this.tryInitMerchantsSwiper(), 0));
  }

  ngOnInit(): void {
    this.pagesService.getPageBySlug('merchants').subscribe({
      next: (page) => {
        this.page = page;
        this.rebuildMerchantLayout();
        this.applySeo(page);
        this.loading = false;
        queueMicrotask(() => setTimeout(() => this.tryInitMerchantsSwiper(), 0));
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  heroSection(): CmsPageSection | null {
    return this.pickSection('Merchants');
  }

  merchantsCountSection(): CmsPageSection | null {
    return this.pickSection('1000_Merchants');
  }

  private rebuildMerchantLayout(): void {
    const section = this.merchantsCountSection();
    if (!section?.items?.length) {
      this.merchantItemsList = [];
      this.columnsLayout = [[], [], [], []];
      return;
    }
    const items = [...section.items]
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    this.merchantItemsList = items;
    const cols: CmsPageSectionItem[][] = [[], [], [], []];
    items.forEach((item, index) => {
      cols[index % 4].push(item);
    });
    this.columnsLayout = cols;
  }

  trackByMerchantId(_index: number, item: CmsPageSectionItem): number {
    return item.id;
  }

  trackByColumnIndex(index: number, _col: CmsPageSectionItem[]): number {
    return index;
  }

  private cardPatternIndex(rowIndex: number, columnIndex: number): number {
    return (columnIndex * 3 + rowIndex) % this.cardFlexByIndex.length;
  }

  /** Classes للكرت: ارتفاعات الموبايل فقط؛ الديسكتوب يعتمد على flex + SCSS */
  cardClass(_rowIndex: number, _columnIndex: number): string {
    return this.cardMobileHeights;
  }

  cardFlexWeight(rowIndex: number, columnIndex: number): number {
    return this.cardFlexByIndex[this.cardPatternIndex(rowIndex, columnIndex)];
  }

  cardClassForMerchantIndex(_flatIndex: number): string {
    return this.cardMobileHeights;
  }

  private tryInitMerchantsSwiper(): void {
    if (this.merchantsSwiperInited) {
      return;
    }
    const el = this.merchantsSwiperRef?.nativeElement;
    if (!el || this.merchantItemsList.length === 0) {
      return;
    }
    Object.assign(el, {
      slidesPerView: 1.08,
      spaceBetween: 16,
      speed: 520,
      centeredSlides: true,
      grabCursor: true,
      pagination:
        this.merchantItemsList.length > 1
          ? {
              clickable: true,
            }
          : false,
      breakpoints: {
        480: {
          slidesPerView: 1.18,
          spaceBetween: 18
        },
        640: {
          slidesPerView: 1.28,
          spaceBetween: 20
        }
      }
    });
    el.initialize();
    this.merchantsSwiperInited = true;
  }

  logoSrc(item: CmsPageSectionItem): string | null {
    return resolveCmsAssetUrl(
      environment.apiOrigin,
      item.imageMediaFileUrl || item.imageUrl
    );
  }

  backgroundSrc(item: CmsPageSectionItem): string | null {
    return resolveCmsAssetUrl(
      environment.apiOrigin,
      item.backgroundImageMediaFileUrl || item.backgroundImageUrl
    );
  }

  private applySeo(page: CmsPage): void {
    if (page.metaTitle) {
      this.title.setTitle(page.metaTitle);
    }
    if (page.metaDescription) {
      this.meta.updateTag({ name: 'description', content: page.metaDescription });
    }
  }

  private pickSection(key: string): CmsPageSection | null {
    const section = this.page?.sections?.find((s) => s.sectionKey === key);
    return section?.isActive ? section : null;
  }
}
