import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'numberAbbreviate', standalone: true })
export class NumberAbbreviatePipe implements PipeTransform {
  transform(value: number | string, decimals: number = 2): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    if (num === 0) return '0';
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(decimals)}B`;
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(decimals)}M`;
    if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(decimals)}K`;
    return `${sign}${abs.toFixed(decimals)}`;
  }
}
