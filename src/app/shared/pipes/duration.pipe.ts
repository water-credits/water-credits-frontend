import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'duration', standalone: true })
export class DurationPipe implements PipeTransform {
  transform(value: string | Date, mode: 'relative' | 'countdown' = 'relative'): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';
    
    const diff = date.getTime() - Date.now();
    const isFuture = diff >= 0;
    const abs = Math.abs(diff);
    
    const days = Math.floor(abs / 86_400_000);
    const hours = Math.floor((abs % 86_400_000) / 3_600_000);
    const minutes = Math.floor((abs % 3_600_000) / 60_000);
    
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    let result = parts.length === 0 ? '<1m' : parts.join(' ');
    
    if (mode === 'relative') {
      if (parts.length === 0) {
        return isFuture ? 'in <1m' : '<1m ago';
      }
      return isFuture ? `in ${result}` : `${result} ago`;
    }
    
    return result;
  }
}
