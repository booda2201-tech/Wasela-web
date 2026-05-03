import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy
} from '@angular/core';
import gsap from 'gsap';

export interface BlogPost {
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
export class BlogsComponent implements AfterViewInit, OnDestroy {
  constructor(private readonly host: ElementRef<HTMLElement>) {}

  readonly pageTitle = 'Blogs';

  readonly pageSubtitle =
    'Explore in-depth insights, company updates, and industry perspectives that highlight where financial technology is headed next.';

  /**
   * مسارات من مجلد assets/images كما هي على القرص:
   * image.png، Link.png، business-UN3RHBL.jpg.png، business-UN3RHBL.jpg (1).png
   */
  readonly featured = {
    tag: 'Marketing',
    date: 'September 28, 2024',
    kicker: 'Waseela Updates',
    headline: 'FINTECH VS. TECHFIN',
    /** إخفاء العنوان فوق الصورة لأن image.png يحتوي النص بالفعل */
    showHeadline: false,
    excerpt:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate ',
    imageSrc: 'assets/images/image.png',
    decorSrc: 'assets/images/Group (7).png',
    href: '#'
  };

  readonly posts: BlogPost[] = [
    {
      title: 'How to Increase Sales…',
      excerpt:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      tag: 'Marketing',
      date: 'September 28, 2024',
      imageSrc: 'assets/images/business-UN3RHBL.jpg.png'
    },
    {
      title: 'How to Increase Sales…',
      excerpt:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      tag: 'Marketing',
      date: 'September 28, 2024',
      imageSrc: 'assets/images/business-UN3RHBL.jpg (1).png'
    },
    {
      title: 'How to Increase Sales…',
      excerpt:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      tag: 'Marketing',
      date: 'September 28, 2024',
      imageSrc: 'assets/images/Link.png'
    }
  ];

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

  ngAfterViewInit(): void {
    const root = this.host.nativeElement;
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

  ngOnDestroy(): void {
    this.ctx?.revert();
  }
}
