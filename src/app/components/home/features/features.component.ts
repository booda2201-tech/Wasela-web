import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';



import { AppStoreLinkService } from '../../../services/app-store-link.service';
import { LanguageService } from '../../../services/language.service';
import { CmsPage, CmsPageSection, CmsPageSectionItem, PagesService } from '../../../services/pages.service';



const WHY_STATIC_DEFAULTS: ReadonlyArray<{ title: string; description: string }> = [

  {

    title: 'Fast & Fully Digital',

    description: 'From Onboarding to Repayment, Everything Happens Through the App.',

  },

  {

    title: 'Flexible by Design',

    description: 'Installment Plans That Adapt to Your Income and Priorities.',

  },

  {

    title: 'Clear & Transparent',

    description: 'No Hidden Fees, No Confusing Terms.',

  },

  {

    title: 'Trusted & Regulated',

    description: "Operating Under Egypt's Consumer Finance Regulations.",

  },

  {

    title: 'Human Centered',

    description: 'Get your credit limit in minutes with our AI-driven engine.',

  },

];



@Component({

  selector: 'app-features',

  templateUrl: './features.component.html',

  styleUrls: ['./features.component.scss'],

})

export class FeaturesComponent implements OnInit, OnChanges, OnDestroy {
  @Input() homePage: CmsPage | null = null;

  activeCard = 0;

  private whyCards: CmsPageSectionItem[] = [];

  /** GIF is bound to the card itself, so hiding or reordering cards keeps each text with its own visual. */
  private readonly whyGifIndexByItemId = new Map<number, number>();

  private whyAutoSwitchTimer: ReturnType<typeof setInterval> | null = null;
  private readonly whyAutoSwitchMs = 10_000;



  readonly phoneFrameSrc = '../../../../assets/images/Slide 16_9 - 5 3.png';



  private readonly whyOverlayGifs = [
    'assets/gif/why waseela-fully digital.gif',
    'assets/gif/why waseela-flexible by design.gif',
    'assets/gif/why waseela-clear and transparent.gif',
    'assets/gif/why waseela-trusted.gif',
    'assets/gif/human centered screen.gif',
  ];

  /** Only load Why-Waseela GIFs after the user (or autoplay) reaches that card. */
  private readonly loadedWhyOverlayIndexes = new Set<number>([0]);



  /** محاذاة منفصلة لكل GIF — shiftX يمين/شمال، objectX تركيز المحتوى، width حجم العرض */
  private readonly whyOverlayLayouts: ReadonlyArray<{
    shiftX: string;
    objectX: string;
    width: string;
  }> = [

    { shiftX: '4%', objectX: '57%', width: '176%' },

    { shiftX: '2%', objectX: '53%', width: '185%' },

    { shiftX: '5%', objectX: '59%', width: '185%' },

    { shiftX: '1%', objectX: '51%', width: '185%' },

    { shiftX: '2.5%', objectX: '54%', width: '185%' },

  ];



  private readonly stepVisualGifs = [
    'assets/gif/iphone in light blue container.gif',
    'assets/gif/iphone in orange container.gif',
    'assets/gif/Iphone in Blue container.gif',
  ];

  readonly howItWorksGifSrc = 'assets/gif/how waseela works.gif';



  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly pagesService: PagesService,
    readonly language: LanguageService,
    readonly stores: AppStoreLinkService
  ) {}



  ngOnInit(): void {
    if (!this.homePage) {
      this.pagesService.getPageBySlug('home').subscribe({
        next: (page) => {
          this.homePage = page;
          this.resetActiveWhyCard();
          this.startWhyAutoSwitch();
        },
      });
    } else {
      this.resetActiveWhyCard();
      this.startWhyAutoSwitch();
    }
  }

  ngOnDestroy(): void {
    this.stopWhyAutoSwitch();
  }



  ngOnChanges(changes: SimpleChanges): void {
    if (changes['homePage'] && this.homePage) {
      this.resetActiveWhyCard();
      this.startWhyAutoSwitch();
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
    return this.whyCards;
  }

  /**
   * The CMS owns this section: as soon as it has items we show exactly the active
   * ones, in their saved order. The static list is only a placeholder for an empty section.
   */
  private rebuildWhyCards(): void {
    const section = this.whySection();
    const allItems = section?.items ?? [];

    this.whyGifIndexByItemId.clear();

    if (!allItems.length) {
      this.whyCards = WHY_STATIC_DEFAULTS.map((_, index) =>
        this.makeFallbackWhyItem(index, section?.id ?? 0)
      );
      this.whyCards.forEach((item, index) => this.whyGifIndexByItemId.set(item.id, index));
      return;
    }

    // Creation order is the one thing hiding and reordering cannot shift.
    [...allItems]
      .sort((a, b) => a.id - b.id)
      .forEach((item, index) =>
        this.whyGifIndexByItemId.set(item.id, index % this.whyOverlayGifs.length)
      );

    this.whyCards = allItems
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }

  private whyGifIndex(index: number): number {
    const item = this.whyCards[index];
    const mapped = item ? this.whyGifIndexByItemId.get(item.id) : undefined;
    return (mapped ?? index) % this.whyOverlayGifs.length;
  }

  whyOverlayIndex(index: number): number {
    return this.whyGifIndex(index);
  }

  whyOverlaySrc(index: number): string {
    return this.whyOverlayGifs[this.whyGifIndex(index)];
  }

  isWhyOverlayLoaded(index: number): boolean {
    return this.loadedWhyOverlayIndexes.has(index);
  }



  whyOverlayStyle(index: number): Record<string, string> {

    const gifIndex = this.whyGifIndex(index);

    const layout = this.whyOverlayLayouts[gifIndex % this.whyOverlayLayouts.length];

    if (gifIndex === 2) {
      return {
        '--why-overlay-shift': '14%',
        '--why-overlay-object-x': layout.objectX,
        '--why-overlay-width': layout.width,
      };
    }

    return {

      '--why-overlay-shift': layout.shiftX,

      '--why-overlay-object-x': layout.objectX,

      '--why-overlay-width': layout.width,

    };

  }



  stepVisualSrc(index: number): string {

    return this.stepVisualGifs[Math.min(index, this.stepVisualGifs.length - 1)];

  }

  formatStepTitle(title: string | null | undefined): string {
    if (!title) {
      return '';
    }

    const normalized = title.trim();
    if (normalized.includes('\n')) {
      return normalized;
    }

    const instantMatch = normalized.match(
      /^(\d+\.\s*Instant,)\s+(AI-Driven\s+Approval)$/i
    );
    if (instantMatch) {
      return `${instantMatch[1]}\n${instantMatch[2]}`;
    }

    const limitMatch = normalized.match(
      /^(\d+\.\s*Use Your Limit)\s+(Where It Matters)$/i
    );
    if (limitMatch) {
      return `${limitMatch[1]}\n${limitMatch[2]}`;
    }

    const commaMatch = normalized.match(/^(\d+\.\s*[^,]+,)\s+(.+)$/i);
    if (commaMatch) {
      return `${commaMatch[1]}\n${commaMatch[2]}`;
    }

    return normalized;
  }



  get featureCount(): number {

    return this.whyItems().length;

  }



  get activeIndex(): number {

    const items = this.whyItems();

    const i = items.findIndex((f) => f.id === this.activeCard);

    return i >= 0 ? i : 0;

  }



  setActive(id: number, userInitiated = true): void {
    this.activeCard = id;
    this.loadedWhyOverlayIndexes.add(this.activeIndex);

    if (userInitiated) {
      this.startWhyAutoSwitch();
      requestAnimationFrame(() => {
        const card = this.host.nativeElement.querySelector(`[data-why-feature="${id}"]`);
        card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
  }

  onWhyTabClick(id: number): void {
    this.setActive(id, true);
  }

  onWhyTabKeydown(event: Event, index: number, delta: number): void {
    const keyboardEvent = event as KeyboardEvent;
    const items = this.whyItems();
    if (!items.length) {
      return;
    }

    keyboardEvent.preventDefault();
    const nextIndex = Math.max(0, Math.min(items.length - 1, index + delta));
    this.onWhyTabClick(items[nextIndex].id);
  }

  private startWhyAutoSwitch(): void {
    this.stopWhyAutoSwitch();
    this.whyAutoSwitchTimer = setInterval(() => this.advanceWhyCard(), this.whyAutoSwitchMs);
  }

  private stopWhyAutoSwitch(): void {
    if (this.whyAutoSwitchTimer) {
      clearInterval(this.whyAutoSwitchTimer);
      this.whyAutoSwitchTimer = null;
    }
  }

  private advanceWhyCard(): void {
    const items = this.whyItems();
    if (items.length < 2) {
      return;
    }

    const nextIndex = (this.activeIndex + 1) % items.length;
    this.setActive(items[nextIndex].id, false);
  }



  private resetActiveWhyCard(): void {
    this.rebuildWhyCards();
    this.activeCard = this.whyCards[0]?.id ?? 0;
    this.loadedWhyOverlayIndexes.clear();
    this.loadedWhyOverlayIndexes.add(0);
  }



  private pickSection(key: string): CmsPageSection | null {

    const section = this.homePage?.sections?.find((s) => s.sectionKey === key);

    return section?.isActive ? section : null;

  }



  private makeFallbackWhyItem(index: number, pageSectionId: number): CmsPageSectionItem {

    const fallback = WHY_STATIC_DEFAULTS[index] ?? WHY_STATIC_DEFAULTS[WHY_STATIC_DEFAULTS.length - 1];



    return {
      id: -(index + 1),
      pageSectionId,
      titleEn: fallback.title,
      titleAr: null,
      title: fallback.title,
      subTitleEn: null,
      subTitleAr: null,
      subTitle: null,
      descriptionEn: fallback.description,
      descriptionAr: null,
      description: fallback.description,
      buttonTextEn: null,
      buttonTextAr: null,
      imageUrl: null,
      imageMediaFileUrl: null,
      backgroundImageUrl: null,
      backgroundImageMediaFileUrl: null,
      extraDataJson: null,
      buttonText: null,
      buttonUrl: null,
      galleryMedia: [],
      sortOrder: index,
      isActive: true,
    };

  }

}


