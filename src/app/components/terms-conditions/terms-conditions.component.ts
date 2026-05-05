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
  selector: 'app-terms-conditions',
  templateUrl: './terms-conditions.component.html',
  styleUrls: ['./terms-conditions.component.scss']
})
export class TermsConditionsComponent implements OnInit, AfterViewInit, OnDestroy {
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
    this.pagesService.getPageBySlug('terms_and_conditions').subscribe({
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
    const sections = this.activeSections();
    return sections.length ? sections[0] : null;
  }

  headerSection(): CmsPageSection | null {
    return this.pickSection('Header');
  }

  contentItems(): CmsPageSectionItem[] {
    const section = this.pickSection('content');
    if (!section?.items?.length) {
      return [];
    }
    return [...section.items]
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private activeSections(): CmsPageSection[] {
    if (!this.page?.sections?.length) {
      return [];
    }
    return [...this.page.sections]
      .filter((section) => section.isActive)
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
