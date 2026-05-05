import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-home-contents',
  templateUrl: './home-contents.component.html',
  styleUrls: ['./home-contents.component.scss']
})
export class HomeContentsComponent implements OnInit, OnDestroy {


categories = [
  { title: 'Health Care', img: 'assets/images/Vector 9.png', mask: 'assets/masks/shape1.svg' },
  { title: 'Family Events', img: 'assets/images/Vector 5.png', mask: 'assets/masks/shape2.svg' },
  { title: 'Education', img: 'assets/images/Vector 11.png', mask: 'assets/masks/shape3.svg' },
  { title: 'Mobility', img: 'assets/images/Vector 1.png', mask: 'assets/masks/shape4.svg' },
  { title: 'Home Finishing', img: 'assets/images/Vector 2.png', mask: 'assets/masks/shape5.svg' },
  { title: 'Sports & Clubs', img: 'assets/images/Vector 8.png', mask: 'assets/masks/shape6.svg' },
  { title: 'Everyday Essentials', img: 'assets/images/Vector 10.png', mask: 'assets/masks/shape7.svg' },
  { title: 'Green Limits', img: 'assets/images/Vector 12.png', mask: 'assets/masks/shape8.svg' }
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

testimonials = [
  {
    type: 'Merchant Partner',
    name: 'Merchant name',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas.',
    avatar: 'assets/images/merchant-icon.png'
  },
  {
    type: 'Waseela Customer',
    name: 'Customer Name',
    content: '“Waseela helped me pay my children’s school fees without stress. Everything was clear, and the app made it easy to track installments.”',
    avatar: 'assets/images/customer-icon.png',
    featured: true // الكارت اللي في النص أكبر شوية
  },
  {
    type: 'Merchant Partner',
    name: 'Merchant name',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas.',
    avatar: 'assets/images/merchant-icon.png'
  }
];

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
