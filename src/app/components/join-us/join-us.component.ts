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
  EGYPT_GOVERNORATES,
  LanguageService
} from '../../services/language.service';
import {
  MerchantApplicationRequest,
  MerchantApplicationsService,
} from '../../services/merchant-applications.service';
import { CmsPage, CmsPageSection, PagesService } from '../../services/pages.service';
import {
  ContactWaysPublicConfig,
  EMPTY_CONTACT_WAYS,
  SiteSettingsService
} from '../../services/site-settings.service';

interface SelectOption {
  value: string;
  label: string;
}

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
    private readonly meta: Meta,
    private readonly cdr: ChangeDetectorRef,
    readonly language: LanguageService
  ) {}

  /** Page chrome loads in background — don't block form/pills on slow CMS. */
  loading = false;
  loadError = false;
  page: CmsPage | null = null;

  /** Same dashboard Contact block as Contact Us */
  ways: ContactWaysPublicConfig = { ...EMPTY_CONTACT_WAYS };

  commercialRegisterOptions: SelectOption[] = [];

  /** المحافظات المصرية (27) — قيم ثابتة والاسم المعروض فقط بيتترجم */
  governorateOptions: SelectOption[] = [];

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
    this.title.setTitle(this.language.label('joinUs'));

    this.subs.add(
      this.language.lang$.subscribe(() => {
        this.rebuildOptions();
        this.cdr.detectChanges();
      })
    );

    // Form/SEO from join-us page only — contact pills come from the SAME source as Contact Us
    this.subs.add(
      this.pagesService
        .getPageBySlugFresh('join-us')
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

    // Identical pills on Contact Us & Join Us (Site Settings → 02 Contact)
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

  /** Same apply path as Contact Us — never keep stale pills. */
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
    this.merchantApplicationsService.submit(payload).subscribe({
      next: (result) => {
        this.submitting = false;
        this.submitSuccess = result.message || this.language.label('joinSuccess');
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
        ?.label ?? this.language.label('selectAnOption')
    );
  }

  governorateLabel(): string {
    return (
      this.governorateOptions.find((o) => o.value === this.form.governorate)?.label ??
        this.language.label('selectGovernorate')
    );
  }

  headline(): string {
    return this.joinSection()?.title || this.page?.name || this.language.label('joinUs');
  }

  subtitle(): string {
    return this.joinSection()?.description || this.language.label('joinSubtitle');
  }

  submitLabel(): string {
    return this.joinSection()?.buttonText || this.language.label('submit');
  }

  /** Rebuilt on language change so the open dropdown swaps labels in place. */
  private rebuildOptions(): void {
    this.commercialRegisterOptions = [
      { value: '', label: this.language.label('selectAnOption') },
      { value: 'yes', label: this.language.label('optionYes') },
      { value: 'no', label: this.language.label('optionNo') }
    ];

    this.governorateOptions = [
      { value: '', label: this.language.label('selectGovernorate') },
      ...EGYPT_GOVERNORATES.map((g) => ({
        value: g.value,
        label: this.language.pick(g.en, g.ar) ?? g.en
      }))
    ];
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
      this.formError = this.language.label('errCommercialRegister');
      return null;
    }
    if (!this.form.companyName.trim()) {
      this.formError = this.language.label('errCompanyName');
      return null;
    }
    if (!this.form.contactPersonName.trim()) {
      this.formError = this.language.label('errContactPersonName');
      return null;
    }
    if (!this.form.contactPersonPhone.trim()) {
      this.formError = this.language.label('errContactPersonPhone');
      return null;
    }
    if (!this.form.category.trim()) {
      this.formError = this.language.label('errCategory');
      return null;
    }
    if (!this.form.governorate) {
      this.formError = this.language.label('errGovernorate');
      return null;
    }

    const branches = this.parsePositiveNumber(this.form.numberOfBranches);
    if (branches === null) {
      this.formError = this.language.label('errBranches');
      return null;
    }

    const sales = this.parsePositiveNumber(this.form.averageMonthlySales);
    if (sales === null) {
      this.formError = this.language.label('errSales');
      return null;
    }

    // Dashboard stores one canonical name — send English regardless of UI language.
    const governorateLabel =
      EGYPT_GOVERNORATES.find((g) => g.value === this.form.governorate)?.en ??
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
    return this.language.label('joinError');
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
}
