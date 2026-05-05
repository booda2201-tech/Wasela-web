import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { environment } from '../../../environments/environment';
import {
  CmsPage,
  CmsPageSection,
  CmsPageSectionItem,
  PagesService,
  resolveCmsAssetUrl,
} from '../../services/pages.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent implements OnInit {
  loading = true;
  loadError = false;
  page: CmsPage | null = null;

  constructor(
    private readonly pagesService: PagesService,
    private readonly title: Title,
    private readonly meta: Meta
  ) {}

  ngOnInit(): void {
    this.pagesService.getPageBySlug('categories').subscribe({
      next: (page) => {
        this.page = page;
        this.applySeo(page);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      },
    });
  }

  heroSection(): CmsPageSection | null {
    return this.pickSection('Categories_We_Finance');
  }

  categorySections(): CmsPageSection[] {
    if (!this.page?.sections?.length) {
      return [];
    }

    return [...this.page.sections]
      .filter((s) => s.isActive && s.sectionKey !== 'Categories_We_Finance')
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  activeItems(section: CmsPageSection): CmsPageSectionItem[] {
    return [...(section.items ?? [])]
      .filter((i) => i.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  sectionImage(section: CmsPageSection): string | null {
    return resolveCmsAssetUrl(
      environment.apiOrigin,
      section.imageMediaFileUrl || section.imageUrl
    );
  }

  itemImage(item: CmsPageSectionItem): string | null {
    return resolveCmsAssetUrl(
      environment.apiOrigin,
      item.imageMediaFileUrl || item.imageUrl
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
    const s = this.page?.sections?.find((x) => x.sectionKey === key);
    return s?.isActive ? s : null;
  }
}
