import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import gsap from 'gsap';
import { forkJoin } from 'rxjs';

import { CmsPage, CmsPageSection, PagesService } from '../../services/pages.service';
import { SiteSettingsService } from '../../services/site-settings.service';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly pagesService: PagesService,
    private readonly siteSettingsService: SiteSettingsService,
    private readonly title: Title,
    private readonly meta: Meta
  ) {}

  loading = true;
  loadError = false;
  page: CmsPage | null = null;

  contactEmail = '';
  contactPhone = '';
  contactAddress = '';

  form = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    message: ''
  };

  private ctx?: gsap.Context;
  private viewReady = false;

  ngOnInit(): void {
    forkJoin({
      page: this.pagesService.getPageBySlug('contact-us'),
      contactSettings: this.siteSettingsService.getSettingsMapByGroup(3)
    }).subscribe({
      next: ({ page, contactSettings }) => {
        this.page = page;
        this.contactEmail = contactSettings['contact.email'] || '';
        this.contactPhone = contactSettings['contact.phone'] || '';
        this.contactAddress = contactSettings['contact.address'] || '';
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

  private trySetupAnimations(): void {
    if (!this.viewReady || this.loading || this.loadError) {
      return;
    }
    const root = this.host.nativeElement;
    this.ctx?.revert();
    this.ctx = gsap.context(() => {
      const card = root.querySelector<HTMLElement>('[data-contact-form-card]');
      if (card) {
        gsap.from(card, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: 'power2.out'
        });
      }
      const pills = root.querySelectorAll<HTMLElement>('[data-contact-pill]');
      if (pills.length) {
        gsap.from(pills, {
          y: 24,
          opacity: 0,
          duration: 0.55,
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

  onSubmit(event: Event): void {
    event.preventDefault();
  }

  headline(): string {
    return this.contactSection()?.title || this.page?.name || 'Contact Us';
  }

  subtitle(): string {
    return this.contactSection()?.description || '';
  }

  submitLabel(): string {
    return this.contactSection()?.buttonText || 'Submit';
  }

  emailHref(): string {
    return this.contactEmail ? `mailto:${this.contactEmail}` : 'javascript:void(0)';
  }

  phoneHref(): string {
    return this.contactPhone ? `tel:${this.contactPhone}` : 'javascript:void(0)';
  }

  private contactSection(): CmsPageSection | null {
    const section = this.page?.sections?.find((s) => s.sectionKey === 'contact_us');
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
}
