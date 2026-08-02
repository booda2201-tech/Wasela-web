import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import gsap from 'gsap';
import { Subscription, catchError, of } from 'rxjs';

import {
  ContactMessageRequest,
  ContactMessagesService
} from '../../services/contact-messages.service';
import {
  CmsPage,
  CmsPageSection,
  PagesService
} from '../../services/pages.service';
import {
  ContactWaysPublicConfig,
  EMPTY_CONTACT_WAYS,
  SiteSettingsService
} from '../../services/site-settings.service';

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
    private readonly contactMessages: ContactMessagesService,
    private readonly title: Title,
    private readonly meta: Meta,
    private readonly cdr: ChangeDetectorRef
  ) {}

  /** Page chrome loads in background — don't block form/pills on slow CMS. */
  loading = false;
  loadError = false;
  page: CmsPage | null = null;

  submitting = false;
  submitSuccess = '';
  submitError = '';
  formError = '';

  /** Dashboard Site Settings → Contact (email / address / phone pills) */
  ways: ContactWaysPublicConfig = { ...EMPTY_CONTACT_WAYS };

  form = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    message: ''
  };

  private ctx?: gsap.Context;
  private viewReady = false;
  private subs = new Subscription();

  ngOnInit(): void {
    this.title.setTitle('Contact Us');

    // Page content (title / form labels) from contact-us CMS page — non-blocking
    this.subs.add(
      this.pagesService
        .getPageBySlugFresh('contact-us')
        .pipe(catchError(() => of(null as CmsPage | null)))
        .subscribe({
          next: (page) => {
            this.page = page;
            if (page) {
              this.applySeo(page);
            }
            this.loadError = false;
            this.cdr.detectChanges();
            queueMicrotask(() => this.trySetupAnimations());
          },
          error: () => {
            // Keep defaults + contact pills visible even if CMS page times out.
            this.cdr.detectChanges();
          }
        })
    );

    // Same shared Site Settings Contact block used on Join Us
    this.subs.add(
      this.siteSettingsService.watchContactWaysConfig().subscribe({
        next: (ways) => {
          this.applyWays(ways);
          this.cdr.detectChanges();
          queueMicrotask(() => this.trySetupAnimations());
        }
      })
    );
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.trySetupAnimations();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.ctx?.revert();
  }

  /** Dashboard Save → switch back to this tab → pills refresh. */
  @HostListener('window:focus')
  onWindowFocus(): void {
    this.siteSettingsService.invalidate();
  }

  /** Apply dashboard contact block as-is (including cleared / hidden pills). */
  private applyWays(ways: ContactWaysPublicConfig): void {
    this.ways = { ...ways };
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitSuccess = '';
    this.submitError = '';
    this.formError = '';

    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.submitting = true;
    this.contactMessages.submit(payload).subscribe({
      next: (result) => {
        this.submitting = false;
        this.submitSuccess =
          result.message || 'Your message was sent successfully. We will get back to you soon.';
        this.resetForm();
      },
      error: (err: unknown) => {
        this.submitting = false;
        if (this.isApiUnavailable(err) && this.openMailtoFallback(payload)) {
          this.submitSuccess =
            'Opening your email app to send the message. If nothing opens, email us directly.';
          this.resetForm();
          return;
        }
        this.submitError = this.resolveSubmitErrorMessage(err);
      }
    });
  }

  /** Dashboard section `contact_us` → title */
  headline(): string {
    return this.contactSection()?.title || this.page?.name || 'Contact Us';
  }

  /** Dashboard section `contact_us` → description */
  subtitle(): string {
    return this.contactSection()?.description || '';
  }

  /** Dashboard section `contact_us` → submit button text */
  submitLabel(): string {
    return this.contactSection()?.buttonText || 'Submit';
  }

  get showAnyContactWay(): boolean {
    return (
      (this.ways.showEmail && !!this.ways.email) ||
      (this.ways.showAddress && !!this.ways.address) ||
      (this.ways.showPhone && !!this.ways.phone)
    );
  }

  private buildPayload(): ContactMessageRequest | null {
    const firstName = this.form.firstName.trim();
    const lastName = this.form.lastName.trim();
    const phone = this.form.phone.trim();
    const email = this.form.email.trim();
    const message = this.form.message.trim();

    if (!firstName) {
      this.formError = 'Please enter your first name.';
      return null;
    }
    if (!lastName) {
      this.formError = 'Please enter your last name.';
      return null;
    }
    if (!phone) {
      this.formError = 'Please enter your phone number.';
      return null;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.formError = 'Please enter a valid email address.';
      return null;
    }
    if (!message) {
      this.formError = 'Please write your message.';
      return null;
    }

    return { firstName, lastName, phone, email, message };
  }

  private resetForm(): void {
    this.form = {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      message: ''
    };
  }

  private isApiUnavailable(err: unknown): boolean {
    return err instanceof Error && err.message === 'CONTACT_API_UNAVAILABLE';
  }

  /** Temporary fallback until POST /api/contact-messages is deployed. */
  private openMailtoFallback(payload: ContactMessageRequest): boolean {
    const to = (this.ways.email || '').trim();
    if (!to || !to.includes('@')) {
      return false;
    }

    const subject = encodeURIComponent(
      `Contact form — ${payload.firstName} ${payload.lastName}`
    );
    const body = encodeURIComponent(
      [
        `Name: ${payload.firstName} ${payload.lastName}`,
        `Phone: ${payload.phone}`,
        `Email: ${payload.email}`,
        '',
        payload.message
      ].join('\n')
    );

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    return true;
  }

  private resolveSubmitErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message && err.message !== 'CONTACT_API_UNAVAILABLE') {
      return err.message;
    }
    return 'Could not send your message. Please try again or email us directly.';
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
        gsap.fromTo(
          pills,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            stagger: 0.12,
            delay: 0.15,
            ease: 'power2.out',
            clearProps: 'opacity,transform'
          }
        );
      }
    }, root);
  }

  private applySeo(page: CmsPage): void {
    if (page.metaTitle) {
      this.title.setTitle(page.metaTitle);
    }
    if (page.metaDescription) {
      this.meta.updateTag({ name: 'description', content: page.metaDescription });
    }
  }

  /** Dashboard section `contact_us` → title */
  private contactSection(): CmsPageSection | null {
    return this.activeSection('contact_us', 'contact_title');
  }

  private activeSection(...keys: string[]): CmsPageSection | null {
    const sections = this.page?.sections ?? [];
    for (const want of keys) {
      const found = sections.find((s) => {
        const key = (s.sectionKey || '').toLowerCase();
        return key === want || key.includes(want);
      });
      if (found && found.isActive !== false) {
        return found;
      }
    }
    return null;
  }
}
