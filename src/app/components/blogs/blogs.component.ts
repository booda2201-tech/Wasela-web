import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import gsap from 'gsap';
import { environment } from '../../../environments/environment';
import {
  CmsPage,
  CmsPageSection,
  CmsPageSectionItem,
  PagesService,
  resolveCmsAssetUrl
} from '../../services/pages.service';

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  tag: string;
  date: string;
  imageSrc: string;
}

@Component({
  selector: 'app-blogs',
  templateUrl: './blogs.component.html',
  styleUrls: ['./blogs.component.scss']
})
export class BlogsComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly pagesService: PagesService,
    private readonly title: Title,
    private readonly meta: Meta
  ) {}

  loading = true;
  loadError = false;
  page: CmsPage | null = null;

  readonly paginationPages: (number | 'ellipsis')[] = [
    1,
    2,
    3,
    'ellipsis',
    8,
    9,
    10
  ];

  readonly currentPage = 1;

  private ctx?: gsap.Context;
  private viewReady = false;

  ngOnInit(): void {
    this.pagesService.getPageBySlug('blogs').subscribe({
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

  pageTitle(): string {
    return this.pickSection('blogs_header')?.title || this.page?.name || 'Blogs';
  }

  pageSubtitle(): string {
    return this.pickSection('blogs_header')?.description || '';
  }

  featuredImageSrc(): string | null {
    const section = this.pickSection('featured_blog');
    return this.mediaUrl(section?.imageMediaFileUrl || section?.imageUrl);
  }

  featuredHeadline(): string {
    return this.pickSection('featured_blog')?.title || '';
  }

  featuredItem(): CmsPageSectionItem | null {
    const section = this.pickSection('featured_blog');
    if (!section?.items?.length) {
      return null;
    }
    return [...section.items]
      .filter((i) => i.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null;
  }

  posts(): BlogPost[] {
    const section = this.pickSection('blogs_header');
    if (!section?.items?.length) {
      return [];
    }
    return [...section.items]
      .filter((item) => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id: item.id,
        title: item.title || '',
        excerpt: item.description || '',
        tag: item.subTitle || '',
        date: item.extraDataJson || '',
        imageSrc: this.mediaUrl(item.imageMediaFileUrl || item.imageUrl) || ''
      }));
  }

  gridTitle(): string {
    return this.pickSection('blogs_grid')?.title || '';
  }

  private trySetupAnimations(): void {
    if (!this.viewReady || !this.page || this.loadError) {
      return;
    }
    const root = this.host.nativeElement;
    this.ctx?.revert();
    this.ctx = gsap.context(() => {
      const featured = root.querySelector<HTMLElement>('[data-blogs-featured]');
      if (featured) {
        gsap.from(featured, {
          y: 32,
          opacity: 0,
          duration: 0.85,
          ease: 'power2.out'
        });
      }
      const cards = root.querySelectorAll<HTMLElement>('[data-blog-card]');
      if (cards.length) {
        gsap.from(cards, {
          y: 28,
          opacity: 0,
          duration: 0.65,
          stagger: 0.12,
          delay: 0.15,
          ease: 'power2.out'
        });
      }
    }, root);
  }

  private mediaUrl(path: string | null | undefined): string | null {
    return resolveCmsAssetUrl(environment.apiOrigin, path);
  }

  private pickSection(key: string): CmsPageSection | null {
    const section = this.page?.sections?.find((s) => s.sectionKey === key);
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
