import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-loader',
  templateUrl: './page-loader.component.html',
  styleUrls: ['./page-loader.component.scss']
})
export class PageLoaderComponent {
  @Input() compact = false;

  readonly gifSrc = 'assets/gif/waseela loading gif v5 transparent.gif';
}
