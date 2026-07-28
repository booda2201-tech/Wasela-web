import {
  AfterViewInit,
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
  MerchantApplicationRequest,
  MerchantApplicationsService,
} from '../../services/merchant-applications.service';
import { CmsPage, CmsPageSection, PagesService } from '../../services/pages.service';
import {
  ContactWaysPublicConfig,
  SiteSettingsService
} from '../../services/site-settings.service';

@Component({
  selector: 'app-join-us',
  templateUrl: './join-us.component.html',
  styleUrls: [
    '../contact-us/contact-us.component.scss',
    './join-us.component.scss'
  ]
})
export class JoinUsComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly pagesService: PagesService,
    private readonly siteSettingsService: SiteSettingsService,
    private readonly merchantApplicationsService: MerchantApplicationsService,
    private readonly title: Title,
    private readonly meta: Meta
  ) {}

  loading = true;
  loadError = false;
  page: CmsPage | null = null;

  ways: ContactWaysPublicConfig = {
    email: '',
    phone: '',
    address: '',
    emailHref: 'javascript:void(0)',
    phoneHref: 'javascript:void(0)',
    addressHref: 'javascript:void(0)',
    showEmail: true,
    showPhone: true,
    showAddress: true,
  };

  readonly commercialRegisterOptions = [
    { value: '', label: 'Select an option' },
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ];

  /** المحافظات المصرية (27) — قيم ثابتة */
  readonly governorateOptions = [
    { value: '', label: 'Select governorate' },
    { value: 'alexandria', label: 'Alexandria' },
    { value: 'aswan', label: 'Aswan' },
    { value: 'assiut', label: 'Assiut' },
    { value: 'beheira', label: 'Beheira' },
    { value: 'beni-suef', label: 'Beni Suef' },
    { value: 'cairo', label: 'Cairo' },
    { value: 'dakahlia', label: 'Dakahlia' },
    { value: 'damietta', label: 'Damietta' },
    { value: 'fayoum', label: 'Fayoum' },
    { value: 'gharbia', label: 'Gharbia' },
    { value: 'giza', label: 'Giza' },
    { value: 'ismailia', label: 'Ismailia' },
    { value: 'kafr-el-sheikh', label: 'Kafr El Sheikh' },
    { value: 'luxor', label: 'Luxor' },
    { value: 'matrouh', label: 'Matrouh' },
    { value: 'menofia', label: 'Menofia' },
    { value: 'minya', label: 'Minya' },
    { value: 'new-valley', label: 'New Valley' },
    { value: 'north-sinai', label: 'North Sinai' },
    { value: 'port-said', label: 'Port Said' },
    { value: 'qalyubia', label: 'Qalyubia' },
    { value: 'qena', label: 'Qena' },
    { value: 'red-sea', label: 'Red Sea' },
    { value: 'sharqia', label: 'Sharqia' },
    { value: 'sohag', label: 'Sohag' },
    { value: 'south-sinai', label: 'South Sinai' },
    { value: 'suez', label: 'Suez' }
  ];

  openDropdown: 'commercial' | 'governorate' | null = null;

  submitting = false;
  submitSuccess = '';
  submitError = '';
  formError = '';

  form = {
    hasCommercialRegister: '',
    companyName: '',
    contactPersonName: '',
    contactPersonPhone: '',
    category: '',
    websiteLink: '',
    governorate: '',
    numberOfBranches: '',
    averageMonthlySales: ''
  };

  private ctx?: gsap.Context;
  private viewReady = false;
  private subs = new Subscription();

  ngOnInit(): void {
    // Don't block the page on contact-ways/settings — hung settings left Join Us on the loader forever.
    this.subs.add(
      this.pagesService
        .getPageBySlug('join-us')
        .pipe(catchError(() => of(null as CmsPage | null)))
        .subscribe({
          next: (page) => {
            this.page = page;
            if (page) {
              this.applySeo(page);
            } else {
              this.title.setTitle('Join Us');
            }
            this.loading = false;
            this.loadError = false;
            queueMicrotask(() => this.trySetupAnimations());
          },
          error: () => {
            this.loading = false;
            this.loadError = true;
          }
        })
    );

    this.subs.add(
      this.siteSettingsService.getContactWaysConfig('join-us').subscribe({
        next: (ways) => {
          this.ways = ways;
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
    this.merchantApplicationsService.submit(payload).subscribe({
      next: (result) => {
        this.submitting = false;
        this.submitSuccess =
          result.message || 'Your application was submitted successfully. We will contact you soon.';
        this.resetForm();
      },
      error: (err: unknown) => {
        this.submitting = false;
        this.submitError = this.resolveSubmitErrorMessage(err);
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.contact-custom-select')) {
      this.openDropdown = null;
    }
  }

  toggleDropdown(key: 'commercial' | 'governorate'): void {
    this.openDropdown = this.openDropdown === key ? null : key;
  }

  selectCommercialRegister(value: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.form.hasCommercialRegister = value;
    this.openDropdown = null;
  }

  selectGovernorate(value: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.form.governorate = value;
    this.openDropdown = null;
  }

  commercialRegisterLabel(): string {
    return (
      this.commercialRegisterOptions.find((o) => o.value === this.form.hasCommercialRegister)
        ?.label ?? 'Select an option'
    );
  }

  governorateLabel(): string {
    return (
      this.governorateOptions.find((o) => o.value === this.form.governorate)?.label ??
        'Select governorate'
    );
  }

  headline(): string {
    return this.joinSection()?.title || this.page?.name || 'Join Us';
  }

  subtitle(): string {
    return (
      this.joinSection()?.description ||
      'Join us as a merchant partner with our consumer finance company, seamless communication, and helping your business grow with confidence.'
    );
  }

  submitLabel(): string {
    return this.joinSection()?.buttonText || 'Submit';
  }

  get showAnyContactWay(): boolean {
    return (
      (this.ways.showEmail && !!this.ways.email) ||
      (this.ways.showAddress && !!this.ways.address) ||
      (this.ways.showPhone && !!this.ways.phone)
    );
  }

  private buildPayload(): MerchantApplicationRequest | null {
    if (!this.form.hasCommercialRegister) {
      this.formError = 'Please select whether you have a Commercial Register and Tax Card ID.';
      return null;
    }
    if (!this.form.companyName.trim()) {
      this.formError = 'Please enter your company or organization name.';
      return null;
    }
    if (!this.form.contactPersonName.trim()) {
      this.formError = 'Please enter the contact person name.';
      return null;
    }
    if (!this.form.contactPersonPhone.trim()) {
      this.formError = 'Please enter the contact person phone number.';
      return null;
    }
    if (!this.form.category.trim()) {
      this.formError = 'Please enter a category.';
      return null;
    }
    if (!this.form.governorate) {
      this.formError = 'Please select a governorate.';
      return null;
    }

    const branches = this.parsePositiveNumber(this.form.numberOfBranches);
    if (branches === null) {
      this.formError = 'Please enter a valid number of branches.';
      return null;
    }

    const sales = this.parsePositiveNumber(this.form.averageMonthlySales);
    if (sales === null) {
      this.formError = 'Please enter a valid average monthly sales amount.';
      return null;
    }

    const governorateLabel =
      this.governorateOptions.find((o) => o.value === this.form.governorate)?.label ??
      this.form.governorate;

    return {
      hasCommercialRegisterAndTaxCard:
        this.form.hasCommercialRegister === 'yes' ? 'Yes' : 'No',
      companyName: this.form.companyName.trim(),
      contactPersonName: this.form.contactPersonName.trim(),
      contactPersonPhoneNumber: this.form.contactPersonPhone.trim(),
      category: this.form.category.trim(),
      websiteOrFacebookLink: this.form.websiteLink.trim(),
      governorate: governorateLabel,
      numberOfBranches: branches,
      averageMonthlySales: sales,
    };
  }

  private parsePositiveNumber(value: string): number | null {
    const cleaned = value.replace(/,/g, '').trim();
    if (!cleaned) {
      return null;
    }
    const n = Number(cleaned);
    if (!Number.isFinite(n) || n < 0) {
      return null;
    }
    return n;
  }

  private resolveSubmitErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message) {
      return err.message;
    }
    if (err && typeof err === 'object') {
      const body = (err as { error?: unknown }).error;
      if (body && typeof body === 'object') {
        const r = body as Record<string, unknown>;
        const msg = r['message'] ?? r['Message'];
        if (typeof msg === 'string' && msg.trim()) {
          return msg;
        }
      }
    }
    return 'Could not submit your application. Please try again.';
  }

  private resetForm(): void {
    this.form = {
      hasCommercialRegister: '',
      companyName: '',
      contactPersonName: '',
      contactPersonPhone: '',
      category: '',
      websiteLink: '',
      governorate: '',
      numberOfBranches: '',
      averageMonthlySales: '',
    };
    this.openDropdown = null;
  }

  private joinSection(): CmsPageSection | null {
    const sections = this.page?.sections ?? [];
    const section =
      sections.find((s) => (s.sectionKey || '').toLowerCase() === 'join_us') ||
      sections.find((s) => {
        const key = (s.sectionKey || '').toLowerCase();
        return key.includes('join') && !key.includes('ways') && !key.includes('contact_ways');
      });
    return section && section.isActive !== false ? section : null;
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

  private applySeo(page: CmsPage): void {
    if (page.metaTitle) {
      this.title.setTitle(page.metaTitle);
    }
    if (page.metaDescription) {
      this.meta.updateTag({ name: 'description', content: page.metaDescription });
    }
  }
}
