import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  QueryList,
  ViewChildren
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import gsap from 'gsap';
import { Subscription } from 'rxjs';
import { CmsPage, PagesService } from '../../services/pages.service';

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('faqCard') private faqCardEls!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('faqPanel') private faqPanels!: QueryList<ElementRef<HTMLElement>>;

  loading = true;
  loadError = false;
  page: CmsPage | null = null;
  faqs: FaqItem[] = [];

  private expandedIds = new Set<number>();

  private listSub?: Subscription;
  private entranceDone = false;

  constructor(
    private readonly pagesService: PagesService,
    private readonly title: Title,
    private readonly meta: Meta
  ) {}

  ngOnInit(): void {
    this.pagesService.getPageBySlug('faqs').subscribe({
      next: (page) => {
        this.page = page;
        this.applySeo(page);
        this.faqs = this.contentFaqs(page);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  heroTitle(): string {
    return this.pickSection('FAQs')?.title || this.page?.name || 'FAQs';
  }

  heroDescription(): string {
    return this.pickSection('FAQs')?.description || '';
  }

  isExpanded(id: number): boolean {
    return this.expandedIds.has(id);
  }

  toggle(id: number): void {
    const panel = this.getPanel(id);
    if (!panel) {
      return;
    }
    const inner = panel.firstElementChild as HTMLElement | null;
    if (!inner) {
      return;
    }

    gsap.killTweensOf(panel);

    if (!this.isExpanded(id)) {
      const next = new Set(this.expandedIds);
      next.add(id);
      this.expandedIds = next;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const target = inner.scrollHeight;
          gsap.fromTo(
            panel,
            { height: 0 },
            {
              height: target,
              duration: 0.5,
              ease: 'power2.out',
              onComplete: () => gsap.set(panel, { height: 'auto' })
            }
          );
        });
      });
      return;
    }

    const h = inner.offsetHeight;
    gsap.set(panel, { height: h });
    gsap.to(panel, {
      height: 0,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: () => {
        const closed = new Set(this.expandedIds);
        closed.delete(id);
        this.expandedIds = closed;
      }
    });
  }

  ngAfterViewInit(): void {
    this.runEntrance();
    this.listSub = this.faqCardEls.changes.subscribe(() => this.runEntrance());
  }

  ngOnDestroy(): void {
    this.listSub?.unsubscribe();
    this.faqPanels?.forEach((r) => gsap.killTweensOf(r.nativeElement));
  }

  private getPanel(id: number): HTMLElement | null {
    const i = this.faqs.findIndex((f) => f.id === id);
    if (i < 0) {
      return null;
    }
    return this.faqPanels?.toArray()?.[i]?.nativeElement ?? null;
  }

  private runEntrance(): void {
    if (this.entranceDone || this.loading || this.loadError) {
      return;
    }
    requestAnimationFrame(() => {
      const nodes = this.faqCardEls?.map((r) => r.nativeElement) ?? [];
      if (!nodes.length) {
        return;
      }
      this.entranceDone = true;
      gsap.from(nodes, {
        opacity: 0,
        y: 24,
        duration: 0.8,
        stagger: 0.09,
        ease: 'power2.out'
      });
    });
  }

  private pickSection(key: string) {
    const section = this.page?.sections?.find((s) => s.sectionKey === key);
    return section?.isActive ? section : null;
  }

  private contentFaqs(page: CmsPage): FaqItem[] {
    const contentSection = page.sections
      .filter((s) => s.isActive && s.sectionKey.toLowerCase() === 'content')
      .sort((a, b) => a.sortOrder - b.sortOrder)[0];

    if (!contentSection?.items?.length) {
      return [];
    }

    return [...contentSection.items]
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id: item.id,
        question: item.title || '',
        answer: item.description || ''
      }));
  }

  private applySeo(page: CmsPage): void {
    if (page.metaTitle) {
      this.title.setTitle(page.metaTitle);
    }
    if (page.metaDescription) {
      this.meta.updateTag({ name: 'description', content: page.metaDescription });
    }
  }
}
