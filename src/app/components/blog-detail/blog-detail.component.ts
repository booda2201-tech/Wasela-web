import { Component } from '@angular/core';
import { Router } from '@angular/router';

/**
 * واجهة ثابتة (دمو) لمطابقة Figma node 8-1731 — بدون ربط بـ CMS أو API.
 * لاحقًا يمكن استبدال `demo` ببيانات حقيقية.
 */
@Component({
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.scss']
})
export class BlogDetailComponent {
  constructor(private readonly router: Router) {}

  /** نفس أسماء الأصول المستخدمة في باقي الموقع */
  readonly heroImage = 'assets/images/image.png';

  readonly demo = {
    // heroTitle: 'FINTECH VS. TECHFIN',
    quote:
      '“Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation labor”',
    quoteBy: '— Lorem ipsum dolor sit amet',
    introParagraphs: [
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architectoSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto',
      'Elit nisi in eleifend sed nisi. Pulvinar at orci, proin imperdiet commodo consectetur convallis risus. Sed condimentum enim dignissim adipiscing faucibus consequat, urna. Viverra purus et erat auctor aliquam. Risus, volutpat vulputate posuere purus sit congue convallis aliquet. Arcu id augue ut feugiat donec porttitor neque. Mauris, neque ultricies eu vestibulum, bibendum quam lorem id. Dolor lacus, eget nunc lectus in tellus, pharetra, porttitor.',
      'Ipsum sit mattis nulla quam nulla. Gravida id gravida ac enim mauris id. Non pellentesque congue eget consectetur turpis. Sapien, dictum molestie sem tempor. Diam elit, orci, tincidunt aenean tempus. Quis velit eget ut tortor tellus. Sed vel, congue felis elit.'
    ],
    section1: {
      title: 'Lorem ipsum',
      body:
        'Pharetra morbi libero id aliquam elit massa integer tellus. Quis felis aliquam ullamcorper porttitor. Pulvinar ullamcorper sit dictumst ut eget a, elementum eu. Maecenas est morbi mattis id in ac pellentesque ac.'
    },
    section2: {
      title: 'Lorem ipsum',
      lead:
        'Sagittis et eu at elementum, quis in. Proin praesent volutpat egestas sociis sit lorem nunc nunc sit. Eget diam curabitur mi ac. Auctor rutrum lacus malesuada massa ornare et. Vulputate consectetur ac ultrices at diam dui eget fringilla tincidunt. Arcu sit dignissim massa erat cursus vulputate gravida id. Sed quis auctor vulputate hac elementum gravida cursus dis.',
      listItems: [
        'Lectus id duis vitae porttitor enim gravida morbi.',
        'Eu turpis posuere semper feugiat volutpat elit, ultrices suspendisse. Auctor vel in vitae placerat.',
        'Suspendisse maecenas ac donec scelerisque diam sed est duis purus.',
        'Eu turpis posuere semper feugiat volutpat elit, ultrices suspendisse. Auctor '
      ]
    }
  } as const;

  goBack(): void {
    void this.router.navigate(['/blogs']);
  }
}
