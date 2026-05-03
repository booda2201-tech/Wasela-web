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
export class FaqComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('faqCard') private faqCardEls!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('faqPanel') private faqPanels!: QueryList<ElementRef<HTMLElement>>;

  faqs: FaqItem[] = [
    {
      id: 1,
      question: 'What is Waseela?',
      answer:
        'Waseela is a digital financing platform that lets you apply, get approved, and pay in installments across everyday purchases—with clear terms and in-app control.'
    },
    {
      id: 2,
      question: 'How do I apply for financing?',
      answer:
        'Download the Waseela app, complete a short digital application, and receive an instant decision powered by our smart credit logic where eligible.'
    },
    {
      id: 3,
      question: 'Where can I use my limit?',
      answer:
        'You can use your approved limit at partner merchants and categories listed in the app, so you always know where your financing is accepted.'
    },
    {
      id: 4,
      question: 'Are there fees or hidden charges?',
      answer:
        'Fees and instalment plans are shown clearly before you confirm any transaction. You can review summaries anytime inside the app.'
    },
    {
      id: 5,
      question: 'How do I contact support?',
      answer:
        'Reach our team through in-app support or the official channels listed on our website—we’re here to help with applications, repayments, or merchant questions.'
    }
  ];

  private expandedIds = new Set<number>();

  private listSub?: Subscription;
  private entranceDone = false;

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
    if (this.entranceDone) {
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
}
