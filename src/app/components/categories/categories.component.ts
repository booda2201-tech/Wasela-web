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

  /** يقسّم وصف القسم لسطرين متوازنين — موبايل وتابلت */
  sectionSubtitleLines(description: string | null | undefined): string[] {
    const text = (description ?? '').trim();
    if (!text) {
      return [];
    }

    if (text.length < 30) {
      return [text];
    }

    const candidates: [string, string][] = [];

    const sentenceEnd = text.search(/\.\s+/);
    if (sentenceEnd !== -1 && sentenceEnd < text.length - 10) {
      candidates.push([
        text.slice(0, sentenceEnd + 1).trim(),
        text.slice(sentenceEnd + 1).trim()
      ]);
    }

    for (const match of text.matchAll(/,/g)) {
      const idx = match.index ?? -1;
      if (idx < 0) {
        continue;
      }
      const first = text.slice(0, idx + 1).trim();
      const second = text.slice(idx + 1).trim();
      if (first && second) {
        candidates.push([first, second]);
      }
    }

    const wordSplit = this.balanceSectionByWords(text);
    if (wordSplit.length === 2) {
      candidates.push([wordSplit[0], wordSplit[1]]);
    }

    const valid = candidates.filter(([first, second]) => first.length > 0 && second.length > 0);
    if (!valid.length) {
      return [text];
    }

    const lineScore = ([first, second]: [string, string]): number => {
      const maxLen = Math.max(first.length, second.length);
      const balance = Math.abs(first.length - second.length);
      const w1 = first.split(/\s+/).filter(Boolean).length;
      const w2 = second.split(/\s+/).filter(Boolean).length;
      const wordBalance = Math.abs(w1 - w2);
      const lengthOverflow = Math.max(0, maxLen - 46) * 18;
      const orphanPenalty =
        w1 === 1 || w2 === 1 ? 80 : w2 === 2 && w1 > w2 + 2 ? 20 : 0;
      return maxLen * 8 + balance + wordBalance * 12 + lengthOverflow + orphanPenalty;
    };

    valid.sort((a, b) => lineScore(a) - lineScore(b));
    return valid[0];
  }

  private balanceSectionByWords(text: string): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 4) {
      return [text];
    }

    let bestBreak = 1;
    let bestScore = Infinity;

    for (let i = 1; i < words.length; i++) {
      const first = words.slice(0, i).join(' ');
      const second = words.slice(i).join(' ');
      const maxLen = Math.max(first.length, second.length);
      const balance = Math.abs(first.length - second.length);
      const wordBalance = Math.abs(i - (words.length - i));
      const lengthOverflow = Math.max(0, maxLen - 46) * 18;
      const orphanPenalty = words.length - i === 1 || i === 1 ? 80 : 0;
      const score = maxLen * 8 + balance + wordBalance * 12 + lengthOverflow + orphanPenalty;
      if (score < bestScore) {
        bestScore = score;
        bestBreak = i;
      }
    }

    const first = words.slice(0, bestBreak).join(' ');
    const second = words.slice(bestBreak).join(' ');
    return second ? [first, second] : [first];
  }

  /**
   * شبكة فرعية على lg+ حسب العدد: 4→2×2، 6→3+3، 5→صف 3 وصف 2 في النص، إلخ.
   */
  subcategoryGridClass(itemCount: number): string {
    const gaps =
      'gap-x-4 gap-y-10 px-1 pt-3 sm:gap-x-6 sm:gap-y-11 md:gap-x-8 md:gap-y-12 md:pt-4';
    const base = `flex flex-wrap justify-center ${gaps} max-w-3xl mx-auto`;
    if (itemCount <= 0) {
      return base;
    }
    const lg = this.subcategoryLargeGridClass(itemCount);
    return `${base} ${lg}`;
  }

  /** توزيع أعمدة lg فقط (يُضاف لـ base). */
  private subcategoryLargeGridClass(n: number): string {
    if (n === 1) {
      return 'lg:grid lg:grid-cols-1 lg:justify-items-center lg:max-w-sm lg:mx-auto lg:gap-x-8 lg:gap-y-12';
    }
    if (n === 2) {
      return 'lg:grid lg:grid-cols-2 lg:max-w-2xl lg:mx-auto lg:gap-x-8 lg:gap-y-12';
    }
    if (n === 3) {
      return 'lg:grid lg:grid-cols-3 lg:max-w-4xl lg:mx-auto lg:gap-x-8 lg:gap-y-12';
    }
    if (n === 4) {
      return 'lg:grid lg:grid-cols-2 lg:max-w-2xl lg:mx-auto lg:gap-x-8 lg:gap-y-12';
    }
    if (n === 5) {
      return 'lg:grid lg:grid-cols-6 lg:max-w-4xl lg:mx-auto lg:gap-x-6 lg:gap-y-12';
    }
    if (n === 6) {
      return 'lg:grid lg:grid-cols-3 lg:max-w-4xl lg:mx-auto lg:gap-x-8 lg:gap-y-12';
    }
    if (n === 7) {
      return 'lg:grid lg:grid-cols-3 lg:max-w-4xl lg:mx-auto lg:gap-x-8 lg:gap-y-12';
    }
    if (n === 8) {
      return 'lg:grid lg:grid-cols-4 lg:max-w-6xl lg:mx-auto lg:gap-x-6 lg:gap-y-12';
    }
    if (n === 9) {
      return 'lg:grid lg:grid-cols-3 lg:max-w-5xl lg:mx-auto lg:gap-x-8 lg:gap-y-12';
    }
    if (n === 10) {
      return 'lg:grid lg:grid-cols-5 lg:max-w-6xl lg:mx-auto lg:gap-x-6 lg:gap-y-12';
    }
    if (n === 11) {
      return 'lg:grid lg:grid-cols-4 lg:max-w-6xl lg:mx-auto lg:gap-x-6 lg:gap-y-12';
    }
    if (n === 12) {
      return 'lg:grid lg:grid-cols-4 lg:max-w-6xl lg:mx-auto lg:gap-x-6 lg:gap-y-12';
    }
    if (n % 4 === 0) {
      return 'lg:grid lg:grid-cols-4 lg:max-w-7xl lg:mx-auto lg:gap-x-6 lg:gap-y-12';
    }
    if (n % 3 === 0) {
      return 'lg:grid lg:grid-cols-3 lg:max-w-5xl lg:mx-auto lg:gap-x-8 lg:gap-y-12';
    }
    if (n % 2 === 0) {
      return 'lg:grid lg:grid-cols-2 lg:max-w-4xl lg:mx-auto lg:gap-x-8 lg:gap-y-12';
    }
    return 'lg:grid lg:grid-cols-3 lg:max-w-5xl lg:mx-auto lg:gap-x-8 lg:gap-y-12';
  }

  /** خلايا مخصصة (توسيط صف أخير غير مكتمل، إلخ) — lg فقط. */
  subcategoryItemGridClass(itemCount: number, index: number): string {
    const n = itemCount;
    const i = index;
    if (n === 5) {
      if (i <= 2) {
        return 'lg:col-span-2';
      }
      if (i === 3) {
        return 'lg:col-span-2 lg:col-start-2';
      }
      return 'lg:col-span-2 lg:col-start-4';
    }
    if (n === 7 && i === 6) {
      return 'lg:col-start-2';
    }
    if (n === 10 && (i === 8 || i === 9)) {
      return i === 8 ? 'lg:col-start-2' : 'lg:col-start-3';
    }
    return '';
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
