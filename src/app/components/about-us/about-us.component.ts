import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { environment } from '../../../environments/environment';
import {
  CmsPage,
  CmsPageSection,
  CmsPageSectionItem,
  PagesService,
  resolveCmsAssetUrl
} from '../../services/pages.service';

gsap.registerPlugin(ScrollTrigger);

const SCROLL_ENTER = 'top bottom';

type SwiperContainerEl = HTMLElement & { initialize: () => void };

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss']
})
export class AboutUsComponent implements OnInit, OnDestroy {
  @ViewChild('teamLeadershipSwiper') teamLeadershipSwiperRef?: ElementRef<SwiperContainerEl>;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly pagesService: PagesService,
    private readonly title: Title,
    private readonly meta: Meta
  ) {}

  readonly aurCapitalLogoSrc = 'assets/images/Aur Capital Logo-Black 1.png';

  loading = true;
  loadError = false;
  /** Technical detail (HTTP status / message) for debugging failed loads. */
  loadErrorDetail: string | null = null;

  page: CmsPage | null = null;

  partnerItems: CmsPageSectionItem[] = [];
  complianceItems: CmsPageSectionItem[] = [];
  missionVisionItems: CmsPageSectionItem[] = [];
  leadershipItems: CmsPageSectionItem[] = [];

  private gsapCtx?: gsap.Context;
  private teamLeadershipSwiperInited = false;

  ngOnInit(): void {
    this.pagesService.getPageBySlug('about-us').subscribe({
      next: (page) => {
        this.page = page;
        this.applySeo(page);
        this.refreshDerivedLists();
        this.loading = false;
        queueMicrotask(() => {
          this.setupScrollAnimations();
          setTimeout(() => this.tryInitTeamLeadershipSwiper(), 0);
        });
      },
      error: (err: unknown) => {
        this.loading = false;
        this.loadError = true;
        this.loadErrorDetail = this.describeLoadError(err);
      }
    });
  }

  ngOnDestroy(): void {
    this.gsapCtx?.revert();
    const el = this.teamLeadershipSwiperRef?.nativeElement as unknown as {
      swiper?: { destroy: (deleteInstance?: boolean, cleanStyles?: boolean) => void };
    };
    el?.swiper?.destroy(true, true);
    this.teamLeadershipSwiperInited = false;
  }

  trackByTeamMemberId(_index: number, item: CmsPageSectionItem): number {
    return item.id;
  }

  private tryInitTeamLeadershipSwiper(): void {
    if (this.teamLeadershipSwiperInited) {
      return;
    }
    const el = this.teamLeadershipSwiperRef?.nativeElement;
    if (!el || this.leadershipItems.length === 0) {
      return;
    }
    const n = this.leadershipItems.length;
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const autoplayOn = n > 1 && !reduceMotion;

    Object.assign(el, {
      slidesPerView: 1,
      slidesPerGroup: 1,
      spaceBetween: 16,
      speed: 560,
      grabCursor: true,
      rewind: true,
      autoplay: autoplayOn
        ? {
            delay: 5200,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }
        : false,
      breakpoints: {
        768: {
          spaceBetween: 20
        },
        1024: {
          slidesPerView: 3,
          slidesPerGroup: 3,
          spaceBetween: 28
        }
      }
    });
    el.initialize();
    this.teamLeadershipSwiperInited = true;
  }

  private describeLoadError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'No response from server (is the API running? CORS / HTTPS certificate trusted in browser?)';
      }
      const body = err.error;
      const msg =
        typeof body === 'object' && body !== null && 'message' in body
          ? String((body as { message?: unknown }).message)
          : '';
      return [err.status ? `${err.status} ${err.statusText}` : err.message, msg]
        .filter(Boolean)
        .join(' — ');
    }
    if (err instanceof Error) {
      return err.message;
    }
    return String(err);
  }

  pickSection(key: string): CmsPageSection | null {
    const s = this.page?.sections?.find((x) => x.sectionKey === key);
    return s?.isActive ? s : null;
  }

  mediaUrl(path: string | null | undefined): string | null {
    return resolveCmsAssetUrl(environment.apiOrigin, path);
  }

  partnerLogoSrc(item: CmsPageSectionItem): string | null {
    return this.mediaUrl(item.imageMediaFileUrl || item.imageUrl);
  }

  teamPhotoSrc(item: CmsPageSectionItem): string | null {
    return this.mediaUrl(item.imageMediaFileUrl || item.imageUrl);
  }

  storyForegroundSrc(): string {
    const s = this.pickSection('our_story');
    return (
      this.mediaUrl(s?.imageMediaFileUrl || s?.imageUrl) ??
      'assets/images/leadership 1.png'
    );
  }

  storyBackgroundSrc(): string {
    const s = this.pickSection('our_story');
    return (
      this.mediaUrl(s?.backgroundImageMediaFileUrl || s?.backgroundImageUrl) ??
      'assets/images/Group (7).png'
    );
  }

  governanceForegroundSrc(): string {
    const s = this.pickSection('leadership_governance');
    return (
      this.mediaUrl(s?.imageMediaFileUrl || s?.imageUrl) ??
      'assets/images/leadership 2.png'
    );
  }

  governanceBackgroundSrc(): string {
    const s = this.pickSection('leadership_governance');
    return (
      this.mediaUrl(s?.backgroundImageMediaFileUrl || s?.backgroundImageUrl) ??
      'assets/images/Group (7).png'
    );
  }

  private applySeo(page: CmsPage): void {
    if (page.metaTitle) {
      this.title.setTitle(page.metaTitle);
    }
    if (page.metaDescription) {
      this.meta.updateTag({ name: 'description', content: page.metaDescription });
    }
  }

  private refreshDerivedLists(): void {
    this.partnerItems = this.itemsFor('our_partners');
    this.complianceItems = this.itemsFor('compliance_licensing');
    this.missionVisionItems = this.itemsFor('mission_vision');
    this.leadershipItems = this.itemsFor('leadership_team');
  }

  private itemsFor(sectionKey: string): CmsPageSectionItem[] {
    const s = this.pickSection(sectionKey);
    if (!s?.items?.length) {
      return [];
    }
    return [...s.items]
      .filter((i) => i.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private setupScrollAnimations(): void {
    this.gsapCtx?.revert();
    const root = this.host.nativeElement;

    this.gsapCtx = gsap.context(() => {
      const reveals = root.querySelectorAll<HTMLElement>('[data-about-reveal]');
      reveals.forEach((el) => {
        gsap.from(el, {
          y: 52,
          opacity: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: SCROLL_ENTER,
            once: true
          }
        });
      });

      const blobGroups = root.querySelectorAll<HTMLElement>('[data-about-blob-group]');
      blobGroups.forEach((group) => {
        const blobs = group.querySelectorAll<HTMLElement>('[data-about-blob]');
        gsap.fromTo(
          blobs,
          { opacity: 0, scale: 0.9 },
          {
            opacity: 0.1,
            scale: 1,
            duration: 1.2,
            ease: 'power2.out',
            stagger: 0.15,
            scrollTrigger: {
              trigger: group,
              start: SCROLL_ENTER,
              once: true
            }
          }
        );
      });

      const teamGrid = root.querySelector<HTMLElement>('[data-team-grid]');
      const teamCards = root.querySelectorAll<HTMLElement>('[data-team-card]');
      if (teamGrid && teamCards.length) {
        gsap.from(teamCards, {
          y: 48,
          opacity: 0,
          duration: 0.95,
          ease: 'power3.out',
          stagger: 0.2,
          scrollTrigger: {
            trigger: teamGrid,
            start: SCROLL_ENTER,
            once: true
          }
        });
      }

      const complianceGrid = root.querySelector<HTMLElement>('[data-compliance-grid]');
      const complianceCards =
        root.querySelectorAll<HTMLElement>('[data-compliance-card]');
      if (complianceGrid && complianceCards.length) {
        gsap.from(complianceCards, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.12,
          scrollTrigger: {
            trigger: complianceGrid,
            start: SCROLL_ENTER,
            once: true
          }
        });
      }

      ScrollTrigger.refresh();
    }, root);
  }
}
