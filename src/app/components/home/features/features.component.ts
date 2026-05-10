import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import { CmsPage, CmsPageSection, CmsPageSectionItem, PagesService } from '../../../services/pages.service';

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss'],
})
export class FeaturesComponent implements OnInit, OnChanges {
  @Input() homePage: CmsPage | null = null;

  activeCard = 0;

  private readonly whyOverlayGifs = [
    '../../../../assets/gif/why waseela-clear and transparent.gif',
    '../../../../assets/gif/why waseela-flexible by design.gif',
    '../../../../assets/gif/why waseela-fully digital.gif',
    '../../../../assets/gif/why waseela-trusted.gif',
  ];

  private readonly stepVisualGifs = [
    '../../../../assets/gif/iphone in light blue container.gif',
    '../../../../assets/gif/iphone in orange container.gif',
    '../../../../assets/gif/Iphone in Blue container.gif',
  ];

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly pagesService: PagesService
  ) {}

  ngOnInit(): void {
    if (!this.homePage) {
      this.pagesService.getPageBySlug('home').subscribe({
        next: (page) => {
          this.homePage = page;
          this.resetActiveWhyCard();
        },
      });
    } else {
      this.resetActiveWhyCard();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['homePage'] && this.homePage) {
      this.resetActiveWhyCard();
    }
  }

  howSection(): CmsPageSection | null {
    return this.pickSection('how_waseela_works');
  }

  whySection(): CmsPageSection | null {
    return this.pickSection('why_waseela');
  }

  howSteps(): CmsPageSectionItem[] {
    const section = this.howSection();
    if (!section?.items?.length) {
      return [];
    }
    return [...section.items]
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }

  whyItems(): CmsPageSectionItem[] {
    const section = this.whySection();
    if (!section?.items?.length) {
      return [];
    }
    return [...section.items]
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }

  whyOverlaySrc(index: number): string {
    return this.whyOverlayGifs[index % this.whyOverlayGifs.length];
  }

  stepVisualSrc(index: number): string {
    return this.stepVisualGifs[Math.min(index, this.stepVisualGifs.length - 1)];
  }

  get featureCount(): number {
    return this.whyItems().length;
  }

  get activeIndex(): number {
    const items = this.whyItems();
    const i = items.findIndex((f) => f.id === this.activeCard);
    return i >= 0 ? i : 0;
  }

  setActive(id: number): void {
    this.activeCard = id;
    requestAnimationFrame(() => {
      const card = this.host.nativeElement.querySelector(`[data-why-feature="${id}"]`);
      card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  private resetActiveWhyCard(): void {
    const first = this.whyItems()[0];
    this.activeCard = first?.id ?? 0;
  }

  private pickSection(key: string): CmsPageSection | null {
    const section = this.homePage?.sections?.find((s) => s.sectionKey === key);
    return section?.isActive ? section : null;
  }
}
