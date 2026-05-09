import { Component, ElementRef } from '@angular/core';

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss']
})
export class FeaturesComponent {
  activeCard = 1;

  features = [
    {
      id: 1,
      title: 'Fast & Fully Digital',
      desc: 'From Onboarding to Repayment, Everything Happens Through the App.',
      img: '../../../../assets/gif/why waseela-clear and transparent.gif'
    },
    {
      id: 2,
      title: 'Flexible by Design',
      desc: 'Installment Plans That Adapt to Your Income and Priorities.',
      img: '../../../../assets/gif/why waseela-flexible by design.gif'
    },
    {
      id: 3,
      title: 'Clear & Transparent',
      desc: 'No Hidden Fees, No Confusing Terms.',
      img: '../../../../assets/gif/why waseela-fully digital.gif'
    },
    {
      id: 4,
      title: 'Trusted & Regulated',
      desc: "Operating Under Egypt's Consumer Finance Regulations.",
      img: '../../../../assets/gif/why waseela-trusted.gif'
    },
    {
      id: 5,
      title: 'Human Centered',
      desc: 'Get your credit limit in minutes with our AI-driven engine.',
      img: '../../../../assets/gif/human centered screen.gif'
    }
  ];

  constructor(private host: ElementRef<HTMLElement>) {}

  get featureCount(): number {
    return this.features.length;
  }

  get activeIndex(): number {
    const i = this.features.findIndex((f) => f.id === this.activeCard);
    return i >= 0 ? i : 0;
  }

  setActive(id: number) {
    this.activeCard = id;
    requestAnimationFrame(() => {
      const card = this.host.nativeElement.querySelector(`[data-why-feature="${id}"]`);
      card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }
}
