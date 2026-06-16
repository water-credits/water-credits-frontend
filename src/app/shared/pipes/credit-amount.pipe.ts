import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'creditAmount', standalone: true })
export class CreditAmountPipe implements PipeTransform {
  transform(value: string | number, decimals: number = 7): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    if (num === 0) return '0';
    if (num >= 1) return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (num >= 0.001) return num.toFixed(4);
    return num.toFixed(decimals);
  }
}
