import { Component } from '@angular/core';

import { GIFS } from '../../gif-assets';

@Component({
  selector: 'app-page-loader',
  templateUrl: './page-loader.component.html',
  styleUrls: ['./page-loader.component.scss']
})
export class PageLoaderComponent {
  readonly gifSrc = GIFS.loader;
}
