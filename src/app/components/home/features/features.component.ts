import {

  Component,

  ElementRef,

  Input,

  OnChanges,

  OnInit,

  SimpleChanges,

} from '@angular/core';



import { CmsPage, CmsPageSection, CmsPageSectionItem, PagesService } from '../../../services/pages.service';



const WHY_ITEM_COUNT = 5;



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

export class FeaturesComponent implements OnInit, OnChanges {

  @Input() homePage: CmsPage | null = null;



  activeCard = 0;



  readonly phoneFrameSrc = '../../../../assets/images/Slide 16_9 - 5 3.png';



  private readonly whyOverlayGifs = [

    '../../../../assets/gif/why waseela-fully digital.gif',

    '../../../../assets/gif/why waseela-flexible by design.gif',

    '../../../../assets/gif/why waseela-clear and transparent.gif',

    '../../../../assets/gif/why waseela-trusted.gif',

    '../../../../assets/gif/human centered screen.gif',

  ];



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

    const cmsItems = section?.items?.length

      ? [...section.items]

          .filter((item) => item.isActive)

          .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)

      : [];



    if (cmsItems.length >= WHY_ITEM_COUNT) {

      return cmsItems.slice(0, WHY_ITEM_COUNT);

    }



    const merged = [...cmsItems];

    const sectionId = section?.id ?? 0;



    while (merged.length < WHY_ITEM_COUNT) {

      const index = merged.length;

      merged.push(this.makeFallbackWhyItem(index, sectionId));

    }



    return merged;

  }



  whyOverlaySrc(index: number): string {

    return this.whyOverlayGifs[index % this.whyOverlayGifs.length];

  }



  whyOverlayStyle(index: number): Record<string, string> {

    const layout = this.whyOverlayLayouts[index % this.whyOverlayLayouts.length];

    return {

      '--why-overlay-shift': layout.shiftX,

      '--why-overlay-object-x': layout.objectX,

      '--why-overlay-width': layout.width,

    };

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



  private makeFallbackWhyItem(index: number, pageSectionId: number): CmsPageSectionItem {

    const fallback = WHY_STATIC_DEFAULTS[index] ?? WHY_STATIC_DEFAULTS[WHY_STATIC_DEFAULTS.length - 1];



    return {

      id: -(index + 1),

      pageSectionId,

      title: fallback.title,

      subTitle: null,

      description: fallback.description,

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


