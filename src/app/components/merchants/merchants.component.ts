import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { environment } from '../../../environments/environment';
import {
  CmsPage,
  CmsPageSection,
  CmsPageSectionItem,
  PagesService,
  resolveCmsAssetUrl
} from '../../services/pages.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-merchants',
  templateUrl: './merchants.component.html',
  styleUrls: ['./merchants.component.scss']
})
export class MerchantsComponent implements OnInit {
  loading = true;
  loadError = false;
  page: CmsPage | null = null;

  /**
   * نفس بيانات التجار مُخزّنة هنا — استدعاء merchantItems()/columns() في القالب كان
   * ينشئ مصفوفات جديدة كل change detection فيُعاد إنشاء الصور وتحميلها من جديد.
   */
  merchantItemsList: CmsPageSectionItem[] = [];
  columnsLayout: CmsPageSectionItem[][] = [[], [], [], []];
  /** موبايل: عمودان، نفس إيقاع الهوم */
  mobileColumns: CmsPageSectionItem[][] = [[], []];

  private readonly mobileFlexByColumn: number[][] = [
    [2.55, 1.05],
    [1.85, 2.65],
  ];

  /** موبايل/تابلت: ارتفاع الكرت داخل السلايدر (~500px+ حسب الفيجما) */
  readonly cardMobileHeights =
    'max-lg:h-[600px] max-lg:sm:h-[650px] max-lg:md:h-[860px]';

  /**
   * 4 أعمدة × 3 صفوف — توزيع متدرج:
   * كل عمود نمط مختلف + الصفوف مش متساوية عرضياً
   */
  readonly cardFlexByIndex = [
    2.75, 1.6, 2.1,
    2.15, 2.85, 1.7,
    1.7, 2.15, 2.65,
    2.55, 1.7, 2.05,
  ];

  constructor(
    private readonly pagesService: PagesService,
    private readonly title: Title,
    private readonly meta: Meta,
    readonly language: LanguageService
  ) {}

  ngOnInit(): void {
    this.pagesService.getPageBySlug('merchants').subscribe({
      next: (page) => {
        this.page = page;
        this.rebuildMerchantLayout();
        this.applySeo(page);
        this.loading = false;
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

  /**
   * عنوان العدد من الـ CMS فقط.
   * فاضي أو الرقم = 0 (مثل 0_Merchants) → null (إخفاء النص + التوجل).
   * رقم > 0 → يظهر العنوان زي ما هو.
   */
  merchantsCountLabel(section: CmsPageSection | null): string | null {
    if (!section) {
      return null;
    }

    const cmsTitle = (section.title ?? section.subTitle ?? '').trim();
    if (!cmsTitle) {
      return null;
    }

    const match = cmsTitle.match(/\d+/);
    if (!match) {
      return null;
    }

    const count = Number(match[0]);
    if (!Number.isFinite(count) || count <= 0) {
      return null;
    }

    return cmsTitle;
  }

  get merchantsCountView(): { section: CmsPageSection; label: string } | null {
    const section = this.merchantsCountSection();
    if (!section) {
      return null;
    }

    const label = this.merchantsCountLabel(section);
    if (!label) {
      return null;
    }

    return { section, label };
  }

  private rebuildMerchantLayout(): void {
    const section = this.merchantsCountSection();
    if (!section?.items?.length) {
      this.merchantItemsList = [];
      this.columnsLayout = [[], [], [], []];
      this.mobileColumns = [[], []];
      return;
    }
    const items = [...section.items]
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    this.merchantItemsList = items;
    const cols: CmsPageSectionItem[][] = [[], [], [], []];
    const mobile: CmsPageSectionItem[][] = [[], []];
    items.forEach((item, index) => {
      cols[index % 4].push(item);
      mobile[index % 2].push(item);
    });
    this.columnsLayout = cols;
    this.mobileColumns = mobile;
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

  /** Classes للكرت: ارتفاعات الموبايل + تمييز طويل/قصير على الديسكتوب */
  cardClass(rowIndex: number, columnIndex: number): string {
    const flex = this.cardFlexWeight(rowIndex, columnIndex);
    const size =
      flex >= 2.2 ? 'merchant-col__card--tall' : 'merchant-col__card--short';
    return `${this.cardMobileHeights} ${size}`;
  }

  cardFlexWeight(rowIndex: number, columnIndex: number): number {
    return this.cardFlexByIndex[this.cardPatternIndex(rowIndex, columnIndex)];
  }

  /** flex عند الهوفر — القصير ثابت، الطويل يتمد حسب حجمه */
  cardHoverFlexWeight(rowIndex: number, columnIndex: number): number {
    const flex = this.cardFlexWeight(rowIndex, columnIndex);
    return flex >= 2.2 ? flex + 0.95 : 1.85;
  }

  mobileFlex(rowIndex: number, columnIndex: number): number {
    const pattern = this.mobileFlexByColumn[columnIndex % 2];
    return pattern[rowIndex % pattern.length];
  }

  mobileHoverFlex(rowIndex: number, columnIndex: number): number {
    const flex = this.mobileFlex(rowIndex, columnIndex);
    return flex >= 2.2 ? flex + 0.85 : 1.85;
  }

  mobileCardClass(rowIndex: number, columnIndex: number): string {
    return this.mobileFlex(rowIndex, columnIndex) >= 2.2
      ? 'merchant-col__card--tall'
      : 'merchant-col__card--short';
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

  hideBrokenImage(event: Event): void {
    (event.target as HTMLImageElement).style.visibility = 'hidden';
  }

  hideBrokenCardImage(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.visibility = 'hidden';
    img.closest('.merchant-col__card')?.classList.add('merchant-col__card--no-image');
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
