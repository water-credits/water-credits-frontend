import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'stellarAddress', standalone: true })
export class StellarAddressPipe implements PipeTransform {
  transform(value: string, chars: number = 4): string {
    if (!value) return '';
    if (value.length <= chars * 2 + 3) return value;
    return `${value.substring(0, chars)}...${value.substring(value.length - chars)}`;
  }
}
