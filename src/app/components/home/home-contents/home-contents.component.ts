import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-home-contents',
  templateUrl: './home-contents.component.html',
  styleUrls: ['./home-contents.component.scss']
})
export class HomeContentsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('testimonialSwiper') testimonialSwiperRef?: ElementRef<HTMLElement & { initialize: () => void }>;
  @ViewChild('partnersSwiperMobile') partnersSwiperMobileRef?: ElementRef<HTMLElement & { initialize: () => void }>;

  private testimonialSwiperInited = false;
  private partnersMobileSwiperInited = false;


  categories = [
    { title: 'Health Care', img: 'assets/images/Group h.png', imgId: 'category-img-health-care' },
    { title: 'Family Events', img: 'assets/images/Group f.png', imgId: 'category-img-family-events' },
    { title: 'Education', img: 'assets/images/Group FF.png', imgId: 'category-img-education' },
    { title: 'Mobility', img: 'assets/images/Group m.png', imgId: 'category-img-mobility' },
    { title: 'Home Finishing', img: 'assets/images/Group hf.png', imgId: 'category-img-home-finishing' },
    { title: 'Sports & Clubs', img: 'assets/images/Group s.png', imgId: 'category-img-sports-clubs' },
    { title: 'Everyday Essentials', img: 'assets/images/Group ee.png', imgId: 'category-img-everyday-essentials' },
    { title: 'Green Limits', img: 'assets/images/Group g.png', imgId: 'category-img-green-limits' }
  ];

  bankingPartners = [
    { name: 'NBK', logo: '../../../../assets/images/Asset 19@4x 1.png' },
    { name: 'EG BANK', logo: '../../../../assets/images/Asset 23@4x 1.png' },
    { name: 'Suez Canal Bank', logo: '../../../../assets/images/Asset 22@4x 1.png' },
    { name: 'Arab African', logo: '../../../../assets/images/Asset 26@4x 1.png' }
  ];

  techPartners = [
    { name: 'Raya', logo: '../../../../assets/images/Asset 30@4x 1.png' },
    { name: 'Kaspersky', logo: '../../../../assets/images/Asset 33@4x 1.png' },
    { name: 'ArkLeap', logo: '../../../../assets/images/Asset 32@4x 1.png' },
    { name: 'Lens', logo: '../../../../assets/images/Asset 29@4x 1.png' }
  ];

  keyPartners = [
    { name: 'InstaPay', logo: '../../../../assets/images/Asset 41@4x 1.png' },
    { name: 'Fawry', logo: '../../../../assets/images/Asset 34@4x 1.png' },
    { name: 'e& money', logo: '../../../../assets/images/Asset 35@4x 1.png' },
    { name: 'Khales', logo: '../../../../assets/images/Asset 36@4x 1.png' }
  ];

  /** Banking / Technology / Key Partners — شبكة الديسكتوب + سلايد واحد في الموبايل */
  partnerColumns: Array<{
    title: string;
    partners: Array<{ name: string; logo: string }>;
    styleBase: number;
  }> = [
    { title: 'Banking', partners: this.bankingPartners, styleBase: 0 },
    { title: 'Technology', partners: this.techPartners, styleBase: 2 },
    { title: 'Key Partners', partners: this.keyPartners, styleBase: 4 }
  ];

// تأكد إنك مقسمهم col1, col2.. إلخ عشان الـ Loop في الـ HTML بتاعك يشتغل صح
col1 = [
  { bg: '../../../../assets/images/Rectangle 41508.png', logo: '../../../../assets/images/Ellipse 6795 (1).png', classes: 'h-[380px] hover:h-[500px]' },
  { bg: '../../../../assets/images/Rectangle 41509.png', logo: '../../../../assets/images/Ellipse 6795 (2).png', classes: 'h-[300px] hover:h-[420px]' },
  { bg: '../../../../assets/images/Rectangle 41511.png', logo: '../../../../assets/images/Ellipse 6795 (3).png', classes: 'h-[220px] hover:h-[340px]' }
];

col2 = [
  { bg: '../../../../assets/images/Rectangle 41512.png', logo: '../../../../assets/images/Ellipse 6795 (4).png', classes: 'h-[400px] hover:h-[520px]' },
  { bg: '../../../../assets/images/Rectangle 41510.png', logo: '../../../../assets/images/Ellipse 6795 (7).png', classes: 'h-[280px] hover:h-[400px]' },
  { bg: '../../../../assets/images/Rectangle 41513.png', logo: '../../../../assets/images/Ellipse 6795 (5).png', classes: 'h-[220px] hover:h-[340px]' }
];

col3 = [
  { bg: '../../../../assets/images/Rectangle 41514.png', logo: '../../../../assets/images/Ellipse 6795 (8).png', classes: 'h-[240px] hover:h-[360px]' },
  { bg: '../../../../assets/images/Rectangle 41515.png', logo: '../../../../assets/images/Ellipse 6795 (6).png', classes: 'h-[320px] hover:h-[440px]' },
  { bg: '../../../../assets/images/Rectangle 41516.png', logo: '../../../../assets/images/Ellipse 6795 (10).png', classes: 'h-[340px] hover:h-[460px]' }
];

col4 = [
  { bg: '../../../../assets/images/Rectangle 41517.png', logo: '../../../../assets/images/Ellipse 6795 (12).png', classes: 'h-[300px] hover:h-[420px]' },
  { bg: '../../../../assets/images/Rectangle 41518.png', logo: '../../../../assets/images/Ellipse 6795 (11).png', classes: 'h-[350px] hover:h-[470px]' },
  { bg: '../../../../assets/images/Rectangle 41519.png', logo: '../../../../assets/images/Ellipse 6795 (9).png', classes: 'h-[250px] hover:h-[370px]' }
];

columns = [this.col1, this.col2, this.col3, this.col4];

private partnersRotationTimer?: ReturnType<typeof setInterval>;
private partnersSwapTimeout?: ReturnType<typeof setTimeout>;
partnersSwapping = false;

  // ngOnInit() {
  //   // بنقسم المصفوفة الكبيرة لـ 4 أعمدة (كل عمود فيه 3 كروت)
  //   for (let i = 0; i < this.merchants.length; i += 3) {
  //     this.columns.push(this.merchants.slice(i, i + 3));
  //   }
  // }

  /**
   * cardImage = صورة الكارت الفارغة من Figma (الإطار الأزرق والشكل).
   * الباقي يتعبّى فوق الصورة ويتغيّر من API/CMS.
   */
  testimonials: Array<{
    cardImage: string;
    type: string;
    name: string;
    content: string;
    avatar: string;
    featured?: boolean;
    /** مساحة بيضاء أقل في الصورة أو نص أطول — هامش أوضح للنص */
    compactOverlay?: boolean;
  }> = [
    {
      cardImage: 'assets/images/Group 7 (2).png',
      type: 'Merchant Partner',
      name: 'Merchant name',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas.',
      avatar: 'assets/images/Ellipse 6795 (1).png'
    },
    {
      cardImage: 'assets/images/Group 10.png',
      type: 'Waseela Customer',
      name: 'Customer Name',
      content:
        'Waseela helped me pay my children’s school fees without stress. Everything was clear, and the app made it easy to track installments.',
      avatar: 'assets/images/Ellipse 6795 (2).png',
      featured: true
    },
    {
      cardImage: 'assets/images/Group 9.png',
      type: 'Merchant Partner',
      name: 'Merchant name',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas.',
      avatar: 'assets/images/Ellipse 6795 (3).png'
    },
    {
      cardImage: 'assets/images/Group 7 (2).png',
      type: 'Waseela Customer',
      name: 'Customer Name',
      content:
        'Simple onboarding and clear installment schedule. We recommend Waseela to our customers every day.',
      avatar: 'assets/images/Ellipse 6795 (4).png',
      compactOverlay: true
    },
    {
      cardImage: 'assets/images/Group 10.png',
      type: 'Merchant Partner',
      name: 'Merchant name',
      content:
        'Partnering with Waseela increased conversion at checkout. Support team is responsive and professional.',
      avatar: 'assets/images/Ellipse 6795 (5).png',
      featured: true
    },
    {
      cardImage: 'assets/images/Group 9.png',
      type: 'Waseela Customer',
      name: 'Customer Name',
      content:
        'Transparent fees and an app that actually explains what you owe. Exactly what we needed.',
      avatar: 'assets/images/Ellipse 6795 (6).png'
    }
  ];

  /** Group 10: منطقة النص في الصورة أضيق من Group 7 / 9 */
  testimonialUsesCompactOverlay(item: (typeof this.testimonials)[number]): boolean {
    return !!item.compactOverlay || item.cardImage.includes('Group 10');
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.initTestimonialSwiper();
      this.initPartnersMobileSwiper();
    });
  }

  private initTestimonialSwiper(): void {
    if (this.testimonialSwiperInited) {
      return;
    }
    const el = this.testimonialSwiperRef?.nativeElement;
    if (!el) {
      return;
    }
    Object.assign(el, {
      slidesPerView: 1,
      slidesPerGroup: 1,
      spaceBetween: 10,
      speed: 450,
      centeredSlides: true,
      // navigation: true,
      // pagination: { clickable: true },
      // watchOverflow: true,
      breakpoints: {
        640: {
          slidesPerView: 2,
          slidesPerGroup: 2,
          spaceBetween: 20,
          centeredSlides: false
        },
        1200: {
          slidesPerView: 3,
          slidesPerGroup: 3,
          spaceBetween: 24,
          centeredSlides: false
        }
      }
    });
    el.initialize();
    this.testimonialSwiperInited = true;
  }

  private initPartnersMobileSwiper(): void {
    if (this.partnersMobileSwiperInited) {
      return;
    }
    const el = this.partnersSwiperMobileRef?.nativeElement;
    if (!el) {
      return;
    }
    Object.assign(el, {
      slidesPerView: 1,
      slidesPerGroup: 1,
      spaceBetween: 20,
      speed: 450,
      // loop: true,
      // pagination: {
      //   clickable: true
      // }
    });
    el.initialize();
    this.partnersMobileSwiperInited = true;
  }

  ngOnInit(): void {
    // تبديل اللوجوهات بنفس نمط الفيديو: خروج/دخول مع تبديل فعلي
    this.partnersRotationTimer = setInterval(() => {
      this.partnersSwapping = true;

      this.partnersSwapTimeout = setTimeout(() => {
        this.rotatePartners(this.bankingPartners);
        this.rotatePartners(this.techPartners);
        this.rotatePartners(this.keyPartners);
        this.partnersSwapping = false;
      }, 280);
    }, 2600);
  }

  ngOnDestroy(): void {
    if (this.partnersRotationTimer) {
      clearInterval(this.partnersRotationTimer);
    }
    if (this.partnersSwapTimeout) {
      clearTimeout(this.partnersSwapTimeout);
    }
  }

  private rotatePartners(partners: Array<{ name: string; logo: string }>): void {
    if (partners.length < 2) {
      return;
    }
    const first = partners.shift();
    if (first) {
      partners.push(first);
    }
  }
}
