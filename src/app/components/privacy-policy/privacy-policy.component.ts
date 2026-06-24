import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import gsap from 'gsap';
import { CmsPage, CmsPageSection, CmsPageSectionItem, PagesService } from '../../services/pages.service';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss']
})

export class PrivacyPolicyComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly pagesService: PagesService,
    private readonly title: Title,
    private readonly meta: Meta
  ) {}

  loading = true;
  loadError = false;
  page: CmsPage | null = null;

  private ctx?: gsap.Context;
  private viewReady = false;

  ngOnInit(): void {
    this.pagesService.getPageBySlug('privacy_policy').subscribe({
      next: (page) => {
        this.page = page;
        this.applySeo(page);
        this.loading = false;
        this.trySetupAnimations();
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.trySetupAnimations();
  }

  private trySetupAnimations(): void {
    if (!this.viewReady || !this.page || this.loadError) {
      return;
    }
    const root = this.host.nativeElement;
    this.ctx?.revert();
    this.ctx = gsap.context(() => {
      const card = root.querySelector<HTMLElement>('[data-terms-card]');
      if (card) {
        gsap.from(card, {
          y: 36,
          opacity: 0,
          duration: 0.85,
          ease: 'power2.out'
        });
      }
      const head = root.querySelector<HTMLElement>('[data-terms-heading-block]');
      if (head) {
        gsap.from(head, {
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out'
        });
      }
    }, root);
  }

  introSection(): CmsPageSection | null {
    return this.pickSection('Privacy_Policy');
  }

  /** يقسّم الوصف لسطرين متساويين — زي Terms وباقي الصفحات */
  introSubtitleLines(description: string | null | undefined): string[] {
    const text = (description ?? '').trim();
    if (!text) {
      return [];
    }

    if (text.length < 55) {
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

    const wordSplit = this.balanceIntroByWords(text);
    if (wordSplit.length === 2) {
      candidates.push([wordSplit[0], wordSplit[1]]);
    }

    const valid = candidates.filter(([first, second]) => first.length > 0 && second.length > 0);
    if (!valid.length) {
      return [text];
    }

    valid.sort((a, b) => {
      const maxA = Math.max(a[0].length, a[1].length);
      const maxB = Math.max(b[0].length, b[1].length);
      if (maxA !== maxB) {
        return maxA - maxB;
      }
      return Math.abs(a[0].length - a[1].length) - Math.abs(b[0].length - b[1].length);
    });

    return valid[0];
  }

  private balanceIntroByWords(text: string): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 4) {
      return [text];
    }

    let bestBreak = 1;
    let bestDiff = Infinity;

    for (let i = 1; i < words.length; i++) {
      const first = words.slice(0, i).join(' ');
      const second = words.slice(i).join(' ');
      const diff = Math.abs(first.length - second.length);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestBreak = i;
      }
    }

    const first = words.slice(0, bestBreak).join(' ');
    const second = words.slice(bestBreak).join(' ');
    return second ? [first, second] : [first];
  }

  headerSection(): CmsPageSection | null {
    return this.pickSection('Header');
  }

  contentItems(): CmsPageSectionItem[] {
    const section = this.pickSection('content') || this.pickSection('Content');
    if (!section?.items?.length) {
      return [];
    }
    return [...section.items]
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private pickSection(key: string): CmsPageSection | null {
    const section = this.page?.sections?.find((x) => x.sectionKey === key);
    return section?.isActive ? section : null;
  }

  private applySeo(page: CmsPage): void {
    if (page.metaTitle) {
      this.title.setTitle(page.metaTitle);
    }
    if (page.metaDescription) {
      this.meta.updateTag({ name: 'description', content: page.metaDescription });
    }
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
