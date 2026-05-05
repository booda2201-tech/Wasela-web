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

@Component({
  selector: 'app-merchants',
  templateUrl: './merchants.component.html',
  styleUrls: ['./merchants.component.scss']
})
export class MerchantsComponent implements OnInit {
  loading = true;
  loadError = false;
  page: CmsPage | null = null;

  readonly cardHeightClasses = [
    'h-[450px] hover:h-[580px]',
    'h-[360px] hover:h-[480px]',
    'h-[290px] hover:h-[400px]',
    'h-[480px] hover:h-[620px]',
    'h-[340px] hover:h-[460px]',
    'h-[280px] hover:h-[400px]',
    'h-[320px] hover:h-[420px]',
    'h-[380px] hover:h-[520px]',
    'h-[400px] hover:h-[540px]',
    'h-[360px] hover:h-[500px]',
    'h-[420px] hover:h-[560px]',
    'h-[320px] hover:h-[430px]'
  ];

  constructor(
    private readonly pagesService: PagesService,
    private readonly title: Title,
    private readonly meta: Meta
  ) {}

  ngOnInit(): void {
    this.pagesService.getPageBySlug('merchants').subscribe({
      next: (page) => {
        this.page = page;
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

  merchantItems(): CmsPageSectionItem[] {
    const section = this.merchantsCountSection();
    if (!section?.items?.length) {
      return [];
    }
    return [...section.items]
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }

  columns(): CmsPageSectionItem[][] {
    const source = this.merchantItems();
    const cols: CmsPageSectionItem[][] = [[], [], [], []];
    source.forEach((item, index) => {
      cols[index % 4].push(item);
    });
    return cols;
  }

  cardClass(indexInColumn: number, columnIndex: number): string {
    const idx = (columnIndex * 3 + indexInColumn) % this.cardHeightClasses.length;
    return this.cardHeightClasses[idx];
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
