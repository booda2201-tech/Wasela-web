import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren
} from '@angular/core';
import gsap from 'gsap';
import { Subscription } from 'rxjs';

export interface CareerJob {
  id: number;
  title: string;
  metaLine: string;
  descriptionParagraphs: string[];
}

@Component({
  selector: 'app-careers',
  templateUrl: './careers.component.html',
  styleUrls: ['./careers.component.scss']
})
export class CareersComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('jobCard') private jobCardEls!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('jobDescPanel') private jobDescPanels!: QueryList<ElementRef<HTMLElement>>;

  jobs: CareerJob[] = [
    {
      id: 1,
      title: 'Senior Flutter Developer',
      metaLine: 'Full Time • On Site • Cairo, Egypt',
      descriptionParagraphs: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
      ]
    },
    {
      id: 2,
      title: 'Senior Flutter Developer',
      metaLine: 'Full Time • On Site • Cairo, Egypt',
      descriptionParagraphs: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
      ]
    },
    {
      id: 3,
      title: 'Senior Flutter Developer',
      metaLine: 'Full Time • On Site • Cairo, Egypt',
      descriptionParagraphs: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
      ]
    },
    {
      id: 4,
      title: 'Senior Flutter Developer',
      metaLine: 'Full Time • On Site • Cairo, Egypt',
      descriptionParagraphs: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
      ]
    },
    {
      id: 5,
      title: 'Senior Flutter Developer',
      metaLine: 'Full Time • On Site • Cairo, Egypt',
      descriptionParagraphs: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
      ]
    }
  ];

  private expandedJobIds = new Set<number>();

  private listSub?: Subscription;
  private cardsAnimated = false;

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
    if (this.cardsAnimated) {
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
}
