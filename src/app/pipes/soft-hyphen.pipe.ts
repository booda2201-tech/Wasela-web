import { Pipe, PipeTransform } from '@angular/core';
// @ts-ignore - the `hyphen` package ships no type declarations
import { hyphenateSync } from 'hyphen/en-us';

const ARABIC_RANGE = /[\u0600-\u06FF]/;

/**
 * Inserts invisible soft hyphens (U+00AD) into long English words so justified
 * paragraphs can break them at line ends instead of stretching word gaps.
 * Arabic (or any text containing Arabic) is returned untouched.
 */
@Pipe({ name: 'softHyphen' })
export class SoftHyphenPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    if (ARABIC_RANGE.test(value)) {
      return value;
    }
    return hyphenateSync(value, { minWordLength: 5 });
  }
}
