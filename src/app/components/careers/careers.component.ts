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

export interface CareerJob {
  id: number;
  roleLabel: string;
  title: string;
  metaLine: string;
  applyButtonText: string;
  descriptionHeading: string;
  descriptionParagraphs: string[];
}

@Component({
  selector: 'app-careers',
  templateUrl: './careers.component.html',
  styleUrls: ['./careers.component.scss']
})
export class CareersComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('jobCard') private jobCardEls!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('jobDescPanel') private jobDescPanels!: QueryList<ElementRef<HTMLElement>>;

  loading = true;
  loadError = false;
  page: CmsPage | null = null;
  jobs: CareerJob[] = [];

  private expandedJobIds = new Set<number>();

  private listSub?: Subscription;
  private cardsAnimated = false;

  constructor(
    private readonly pagesService: PagesService,
    private readonly title: Title,
    private readonly meta: Meta
  ) {}

  ngOnInit(): void {
    this.pagesService.getPageBySlug('careers').subscribe({
      next: (page) => {
        this.page = page;
        this.applySeo(page);
        this.jobs = this.mapJobs(page);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  pageTitle(): string {
    return this.page?.name || 'Careers';
  }

  pageSubtitle(): string {
    return 'Join a team of innovators, designers, and engineers working together to shape the future of digital financial experiences.';
  }

  isExpanded(jobId: number): boolean {
    return this.expandedJobIds.has(jobId);
  }

  toggle(jobId: number): void {
    const panel = this.getDescPanel(jobId);
    if (!panel) {
      return;
    }
    const inner = panel.firstElementChild as HTMLElement | null;
    if (!inner) {
      return;
    }

    gsap.killTweensOf(panel);

    if (!this.isExpanded(jobId)) {
      const next = new Set(this.expandedJobIds);
      next.add(jobId);
      this.expandedJobIds = next;

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
              onComplete: () => {
                gsap.set(panel, { height: 'auto' });
              }
            }
          );
        });
      });
      return;
    }

    const currentHeight = inner.offsetHeight;
    gsap.set(panel, { height: currentHeight });
    gsap.to(panel, {
      height: 0,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: () => {
        const closed = new Set(this.expandedJobIds);
        closed.delete(jobId);
        this.expandedJobIds = closed;
      }
    });
  }

  ngAfterViewInit(): void {
    this.tryAnimateCards();
    this.listSub = this.jobCardEls.changes.subscribe(() => this.tryAnimateCards());
  }

  ngOnDestroy(): void {
    this.listSub?.unsubscribe();
    this.jobDescPanels?.forEach((r) => gsap.killTweensOf(r.nativeElement));
  }

  private getDescPanel(jobId: number): HTMLElement | null {
    const i = this.jobs.findIndex((j) => j.id === jobId);
    if (i < 0) {
      return null;
    }
    const arr = this.jobDescPanels?.toArray();
    return arr?.[i]?.nativeElement ?? null;
  }

  private tryAnimateCards(): void {
    if (this.cardsAnimated || this.loading || this.loadError) {
      return;
    }
    requestAnimationFrame(() => {
      const nodes = this.jobCardEls?.map((r) => r.nativeElement) ?? [];
      if (!nodes.length) {
        return;
      }
      this.cardsAnimated = true;
      gsap.from(nodes, {
        opacity: 0,
        y: 28,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out'
      });
    });
  }

  private mapJobs(page: CmsPage): CareerJob[] {
    return [...page.sections]
      .filter((section) => section.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((section) => {
        const firstDetail = [...(section.items ?? [])]
          .filter((item) => item.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)[0];

        const rawDesc = firstDetail?.description || '';
        const descriptionParagraphs = rawDesc
          .split(/\r?\n+/)
          .map((x) => x.trim())
          .filter(Boolean);

        return {
          id: section.id,
          roleLabel: section.subTitle || 'Open Roles',
          title: section.title || '',
          metaLine: (section.description || '').replace(/\s*\.\s*/g, ' • ').trim(),
          applyButtonText: section.buttonText || 'Submit Application',
          descriptionHeading: firstDetail?.title || 'Job Description',
          descriptionParagraphs
        };
      });
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
