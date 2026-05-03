import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Enter line: section begins animating as soon as it enters the viewport from below */
const SCROLL_ENTER = 'top bottom';

export interface AboutPartner {
  name: string;
  logoSrc: string;
  alt: string;
}

export interface AboutComplianceCard {
  title: string;
}

export interface AboutTeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  photoSrc: string;
}

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss']
})
export class AboutUsComponent implements AfterViewInit, OnDestroy {
  constructor(private readonly host: ElementRef<HTMLElement>) {}

  /** Our Story — ملف من مجلد الصور المعروض (leadership_1.png) */
  readonly storyIllustrationSrc = 'assets/images/leadership_1.png';

  /** Leadership & Governance — leadership_1 (1).png */
  readonly governanceIllustrationSrc = 'assets/images/leadership_1 (1).png';

  readonly decorVectors: readonly string[] = [
    'assets/images/Group (7).png',
    'assets/images/Group (7).png',
    'assets/images/Group (7).png',
    'assets/images/Group (7).png',
    'assets/images/Group (7).png'
  ];

  /** Foundation — Aur Capital Logo-Black 1.png */
  readonly aurCapitalLogoSrc = 'assets/images/Aur Capital Logo-Black 1.png';

  readonly whoWeAreLead =
    'Waseela brings together technology, risk discipline, and customer empathy to make financing clear, fast, and accessible—so people can move forward with confidence.';

  readonly foundationCopy =
    'Built on strong governance and a commitment to transparency, we partner with merchants and institutions that share our standards for trust and compliance.';

  readonly purposeCopy =
    'We exist to simplify how people access responsible credit—digitally, securely, and with respect for every customer journey.';

  readonly storyCopy =
    'From first ideas to live journeys in market, our story is one of iteration: listening to customers, tightening controls, and shipping experiences that feel effortless in the moment yet rigorous underneath.';

  readonly governanceCopy =
    'Leadership and governance at Waseela align strategy with regulated consumer finance standards—ensuring decisions are explainable, documented, and aligned with customer outcomes.';

  readonly missionText =
    'Empower individuals and families with transparent installment experiences that are easy to understand, fair to use, and built to scale safely.';

  readonly visionText =
    'Become the region’s most trusted digital financing companion—where approval is intelligent, servicing is human, and growth never compromises integrity.';

  /** شعارات الشركاء — أسماء الملفات كما في صورة مجلد الأصول */
  partners: AboutPartner[] = [
    { name: 'e& money', logoSrc: 'assets/images/10 (1).png', alt: 'e& money' },
    { name: 'paymob', logoSrc: 'assets/images/45.png', alt: 'paymob' },
    { name: 'Synapse Analytics',logoSrc: 'assets/images/Asset 36@4x 1.png',alt: 'Synapse Analytics'},
    { name: 'AUR Capital', logoSrc: 'assets/images/44 (1).png', alt: 'AUR Capital' },
    { name: 'Dubai Phone', logoSrc: 'assets/images/Asset 30@4x 1.png', alt: 'Dubai Phone' },
    { name: 'ESLSCA University', logoSrc: 'assets/images/Asset 32@4x 1.png', alt: 'ESLSCA University' },
    { name: 'Dubai Phone', logoSrc: 'assets/images/Asset 29@4x 1.png', alt: 'Dubai Phone' },
    { name: 'ESLSCA University', logoSrc: 'assets/images/Asset 35@4x 1.png', alt: 'ESLSCA University' },

  ];

  complianceCards: AboutComplianceCard[] = [
    { title: 'Licensed Consumer Finance Entity' },
    { title: 'Regulatory Reporting & Audit Ready' },
    { title: 'Data Protection & Security Controls' },
    { title: 'Fair Practices & Transparent Pricing' }
  ];

  /**
   * Portraits are full composites (circle clip + brand geometry already in PNG).
   * Order: MD & Board Member, Risk Manager, Growth & Marketing.
   */
  leadershipTeam: AboutTeamMember[] = [
    {
        id: 2,
        name: 'Nimat El Zorkany',
        role: 'Risk Manager',
        bio: 'Leads credit policy and portfolio oversight with a focus on responsible growth and model governance.',
        photoSrc: 'assets/images/nima 1.png'
    },  
    {
       id: 1,
       name: 'Ahmed El-Ghandakly',
       role: 'MD & Board Member',
       bio: 'Steers strategy and governance across Waseela—aligning growth with regulated finance excellence.',
       photoSrc: 'assets/images/MR.ahmed 1.png'
     },
    {
      id: 3,
      name: 'Yara Afify',
      role: 'Growth & Marketing',
      bio: 'Drives brand growth and customer journeys—from acquisition through lasting engagement.',
      photoSrc: 'assets/images/yara 1.png'
    }
  ];

  private gsapCtx?: gsap.Context;

  ngAfterViewInit(): void {
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

    // في الـ ngAfterViewInit

    //  gsap.to('.about-media-panel__img--front', {
    //    y: -20,
    //    duration: 4,
    //    repeat: -1,
    //    yoyo: true,
    //    ease: "sine.inOut"
    //  });
     
    //  // الصورة الخلفية تتحرك لتحت خفيف
    //  gsap.to('.about-media-panel__img--back', {
    //    y: 15,
    //    duration: 5,
    //    repeat: -1,
    //    yoyo: true,
    //    ease: "sine.inOut",
    //    delay: 0.2
    //  });
  }

  ngOnDestroy(): void {
    this.gsapCtx?.revert();
  }
}
