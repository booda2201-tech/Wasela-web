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
import {
  CmsPage,
  CmsPageSection,
  CmsPageSectionItem,
  PagesService
} from '../../services/pages.service';
import { LanguageService } from '../../services/language.service';

export interface CareerJobBlock {
  heading: string;
  paragraphs: string[];
}

export interface CareerJob {
  id: number;
  roleLabel: string;
  title: string;
  /** أجزاء سطر الميتا؛ النقاط البرتقالية ثابتة في القالب بين العناصر */
  metaSegments: string[];
  applyButtonText: string;
  applyButtonUrl: string;
  /** Expanded panels from dashboard section items (e.g. Job Description) */
  descriptionBlocks: CareerJobBlock[];
}

function asRecord(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

function str(v: unknown): string {
  return v == null ? '' : String(v).trim();
}

/**
 * Dashboard "Edit job" → Job details:
 * - tag = orange meta line
 * - contentHeader / contentHeading = title inside expanded job
 */
function parseCareerExtra(extraDataJson: string | null | undefined): {
  tag: string;
  contentHeaderEn: string;
  contentHeaderAr: string;
} {
  const empty = { tag: '', contentHeaderEn: '', contentHeaderAr: '' };
  const raw = (extraDataJson ?? '').trim();
  if (!raw) {
    return empty;
  }
  try {
    const obj = asRecord(JSON.parse(raw));
    let contentHeaderEn = str(
      obj['contentHeaderEn'] ??
        obj['ContentHeaderEn'] ??
        obj['contentHeadingEn'] ??
        obj['ContentHeadingEn']
    );
    let contentHeaderAr = str(
      obj['contentHeaderAr'] ??
        obj['ContentHeaderAr'] ??
        obj['contentHeadingAr'] ??
        obj['ContentHeadingAr']
    );

    const header =
      obj['contentHeader'] ??
      obj['ContentHeader'] ??
      obj['contentHeading'] ??
      obj['ContentHeading'];
    if (!contentHeaderEn && !contentHeaderAr && header != null) {
      if (typeof header === 'string') {
        contentHeaderEn = header.trim();
      } else if (typeof header === 'object') {
        const h = asRecord(header);
        contentHeaderEn = str(h['en'] ?? h['En']);
        contentHeaderAr = str(h['ar'] ?? h['Ar']);
      }
    }

    return {
      tag: str(obj['tag'] ?? obj['Tag'] ?? obj['meta'] ?? obj['metaLine']),
      contentHeaderEn,
      contentHeaderAr
    };
  } catch {
    return empty;
  }
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
  private langSub?: Subscription;
  private cardsAnimated = false;

  constructor(
    private readonly pagesService: PagesService,
    private readonly title: Title,
    private readonly meta: Meta,
    readonly language: LanguageService
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

    this.langSub = this.language.lang$.subscribe(() => {
      if (this.page) {
        this.jobs = this.mapJobs(this.page);
      }
    });
  }

  /** Dashboard page header → title */
  pageTitle(): string {
    return this.introSection()?.title || this.page?.name || 'Careers';
  }

  /** Dashboard page header → description */
  pageSubtitle(): string {
    return (
      this.introSection()?.description ||
      'Join a team of innovators, designers, and engineers working together to shape the future of digital financial experiences.'
    );
  }

  isExpanded(jobId: number): boolean {
    return this.expandedJobIds.has(jobId);
  }

  metaSegmentsFor(job: CareerJob): string[] {
    if (!this.language.isArabic) {
      return job.metaSegments;
    }
    return [...job.metaSegments].reverse();
  }

  applyHref(job: CareerJob): string {
    const url = (job.applyButtonUrl || '').trim();
    return url || 'javascript:void(0)';
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
    this.langSub?.unsubscribe();
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

  /** Dashboard: Careers page header block */
  private introSection(): CmsPageSection | null {
    const sections = this.page?.sections ?? [];
    const intro = sections.find((s) => this.isIntroSection(s));
    return intro?.isActive ? intro : null;
  }

  private isIntroSection(section: CmsPageSection): boolean {
    const key = (section.sectionKey || '').toLowerCase();
    return (
      key === 'careers_section' ||
      key === 'careers' ||
      key.includes('careers_intro') ||
      key.includes('careers_header') ||
      key.includes('careers_title') ||
      key.includes('page_header')
    );
  }

  /**
   * Each active non-header section = one job card from dashboard "+ Add job".
   * Section items = expanded content blocks ("Job Description", etc.).
   */
  private mapJobs(page: CmsPage): CareerJob[] {
    return [...page.sections]
      .filter((section) => section.isActive && !this.isIntroSection(section))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((section) => this.mapJobSection(section));
  }

  private mapJobSection(section: CmsPageSection): CareerJob {
    const extra = parseCareerExtra(section.extraDataJson);
    const detailItems = [...(section.items ?? [])]
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Tag (job meta line) → orange dots. Fallback: section.description when items hold body.
    const metaRaw =
      extra.tag ||
      (detailItems.length ? section.description || '' : '');
    const metaSegments = this.parseMetaSegments(metaRaw);

    const sharedHeading = this.pickLocalized(
      extra.contentHeaderEn,
      extra.contentHeaderAr
    );

    const descriptionBlocks: CareerJobBlock[] =
      detailItems.length > 0
        ? detailItems
            .map((item) => this.mapDetailItem(item, sharedHeading))
            .filter((b) => b.heading || b.paragraphs.length)
        : this.fallbackBlocksFromSection(section, sharedHeading, !!extra.tag);

    return {
      id: section.id,
      roleLabel: section.subTitle || 'Open Roles',
      title: section.title || '',
      metaSegments,
      applyButtonText: section.buttonText || 'Submit Application',
      applyButtonUrl: (section.buttonUrl || '').trim(),
      descriptionBlocks
    };
  }

  private mapDetailItem(
    item: CmsPageSectionItem,
    sharedHeading: string
  ): CareerJobBlock {
    return {
      heading: item.title || sharedHeading || 'Job Description',
      paragraphs: this.splitParagraphs(item.description || '')
    };
  }

  /** When a job has no items yet, use section.description as body (not as meta). */
  private fallbackBlocksFromSection(
    section: CmsPageSection,
    sharedHeading: string,
    hasTagMeta: boolean
  ): CareerJobBlock[] {
    if (!hasTagMeta) {
      return [];
    }
    const paragraphs = this.splitParagraphs(section.description || '');
    if (!paragraphs.length) {
      return [];
    }
    return [
      {
        heading: sharedHeading || 'Job Description',
        paragraphs
      }
    ];
  }

  private pickLocalized(en: string, ar: string): string {
    if (this.language.isArabic) {
      return ar || en;
    }
    return en || ar;
  }

  private splitParagraphs(raw: string): string[] {
    return raw
      .split(/\r?\n+/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  private applySeo(page: CmsPage): void {
    if (page.metaTitle) {
      this.title.setTitle(page.metaTitle);
    }
    if (page.metaDescription) {
      this.meta.updateTag({ name: 'description', content: page.metaDescription });
    }
  }

  /** يفصل وصف الميتا إلى أجزاء؛ يدعم . أو • أو | أو - من الـ CMS */
  private parseMetaSegments(raw: string): string[] {
    const t = raw.trim();
    if (!t) {
      return [];
    }
    const normalized = t
      .replace(/\s*\.\s*/g, ' • ')
      .replace(/\s*\|\s*/g, ' • ')
      .replace(/\s+-\s+/g, ' • ');
    return normalized
      .split(/\s*•\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
}
