import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy
} from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements AfterViewInit, OnDestroy {
  constructor(private readonly host: ElementRef<HTMLElement>) {}

  readonly headline = 'Contact Us';

  readonly subtitle =
    'Our team is committed to delivering responsive support and clear communication to help you move forward with confidence.';

  readonly emailHref = 'mailto:Customerservice@waseela.com';

  readonly emailLabel = 'Customerservice@waseela.com';

  readonly addressLine = 'Unit A 111, Arcadia Mall, Nile Corniche, Cairo';

  readonly phoneLabel = '15643';

  readonly phoneHref = 'tel:15643';

  form = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    message: ''
  };

  private ctx?: gsap.Context;

  ngAfterViewInit(): void {
    const root = this.host.nativeElement;
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
}
