import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import gsap from 'gsap';
import { catchError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import {
  ContactMessageRequest,
  ContactMessagesService
} from '../../services/contact-messages.service';
import {
  CmsPage,
  CmsPageSection,
  PagesService
} from '../../services/pages.service';
import { SiteSettingsService } from '../../services/site-settings.service';

interface ContactWaysView {
  email: string;
  phone: string;
  address: string;
  emailHref: string;
  phoneHref: string;
  addressHref: string;
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

function str(v: unknown): string {
  return v == null ? '' : String(v).trim();
}

function flag(v: unknown, fallback: boolean): boolean {
  if (v === false || v === 'false' || v === 0 || v === '0') {
    return false;
  }
  if (v === true || v === 'true' || v === 1 || v === '1') {
    return true;
  }
  return fallback;
}

/** Dashboard `contact_ways` extraDataJson (+ aliases). */
function parseWays(extraDataJson: string | null | undefined): {
  email: string;
  phone: string;
  address: string;
  emailLink: string;
  phoneLink: string;
  addressLink: string;
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
} {
  const empty = {
    email: '',
    phone: '',
    address: '',
    emailLink: '',
    phoneLink: '',
    addressLink: '',
    showEmail: true,
    showPhone: true,
    showAddress: true
  };

  const raw = (extraDataJson ?? '').trim();
  if (!raw || raw === '{}') {
    return empty;
  }

  try {
    const obj = asRecord(JSON.parse(raw));
    return {
      email: str(obj['email'] ?? obj['Email'] ?? obj['contactEmail']),
      phone: str(obj['phone'] ?? obj['Phone'] ?? obj['contactPhone']),
      address: str(obj['address'] ?? obj['Address'] ?? obj['contactAddress']),
      emailLink: str(
        obj['emailLink'] ?? obj['EmailLink'] ?? obj['mailto'] ?? obj['email_link']
      ),
      phoneLink: str(
        obj['phoneLink'] ?? obj['PhoneLink'] ?? obj['tel'] ?? obj['phone_link']
      ),
      addressLink: str(
        obj['addressLink'] ??
          obj['AddressLink'] ??
          obj['mapsUrl'] ??
          obj['maps'] ??
          obj['address_link']
      ),
      showEmail: flag(obj['showEmail'] ?? obj['ShowEmail'] ?? obj['show_email'], true),
      showPhone: flag(obj['showPhone'] ?? obj['ShowPhone'] ?? obj['show_phone'], true),
      showAddress: flag(
        obj['showAddress'] ?? obj['ShowAddress'] ?? obj['show_address'],
        true
      )
    };
  } catch {
    return empty;
  }
}

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
    private readonly meta: Meta
  ) {}

  loading = true;
  loadError = false;
  page: CmsPage | null = null;

  /** Class-level flag used by the template while the form is sending */
  submitting = false;
  submitSuccess = '';
  submitError = '';
  formError = '';

  ways: ContactWaysView = {
    email: '',
    phone: '',
    address: '',
    emailHref: 'javascript:void(0)',
    phoneHref: 'javascript:void(0)',
    addressHref: 'javascript:void(0)',
    showEmail: true,
    showPhone: true,
    showAddress: true
  };

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
    this.pagesService
      .getPageBySlug('contact-us')
      .pipe(
        switchMap((page) =>
          this.siteSettingsService.getPublicSettingsMap().pipe(
            catchError(() => of({} as Record<string, string>)),
            switchMap((settings) => of({ page, settings }))
          )
        )
      )
      .subscribe({
        next: ({ page, settings }) => {
          this.page = page;
          this.applyContactWays(page, settings);
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

  ngOnDestroy(): void {
    this.ctx?.revert();
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

  private applyContactWays(
    page: CmsPage,
    contactSettings: Record<string, string>
  ): void {
    const fromSection = parseWays(this.contactWaysSection(page)?.extraDataJson);

    const email =
      fromSection.email ||
      contactSettings['contact.email'] ||
      '';
    const phone =
      fromSection.phone ||
      contactSettings['contact.phone'] ||
      '';
    const address =
      fromSection.address ||
      contactSettings['contact.address'] ||
      '';

    this.ways = {
      email,
      phone,
      address,
      emailHref:
        fromSection.emailLink ||
        (email ? `mailto:${email}` : 'javascript:void(0)'),
      phoneHref:
        fromSection.phoneLink ||
        (phone ? `tel:${phone.replace(/\s+/g, '')}` : 'javascript:void(0)'),
      addressHref: fromSection.addressLink || 'javascript:void(0)',
      showEmail: fromSection.showEmail,
      showPhone: fromSection.showPhone,
      showAddress: fromSection.showAddress
    };
  }

  /** Dashboard: Contact - Title (`contact_us`) */
  private contactSection(): CmsPageSection | null {
    return this.activeSection('contact_us', 'contact_title');
  }

  /** Dashboard: Contact - Contact Ways (`contact_ways`) */
  private contactWaysSection(page: CmsPage | null = this.page): CmsPageSection | null {
    const sections = page?.sections ?? [];
    const ways = sections.find((s) => {
      const key = (s.sectionKey || '').toLowerCase();
      return (
        key === 'contact_ways' ||
        key.includes('contact_ways') ||
        key.includes('ways_to_contact')
      );
    });
    return ways?.isActive ? ways : null;
  }

  private activeSection(...keys: string[]): CmsPageSection | null {
    const sections = this.page?.sections ?? [];
    for (const want of keys) {
      const found = sections.find((s) => {
        const key = (s.sectionKey || '').toLowerCase();
        return key === want || key.includes(want);
      });
      if (found?.isActive) {
        return found;
      }
    }
    return null;
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
