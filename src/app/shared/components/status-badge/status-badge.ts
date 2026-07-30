import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span
      [ngClass]="colorClasses"
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
      role="status"
    >
      <span class="w-1.5 h-1.5 rounded-full mr-1.5" [ngClass]="dotColor" aria-hidden="true"></span>
      {{ label || status }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() label = '';

  private statusColorMap: Record<string, { bg: string; text: string; dot: string }> = {
    active: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      dot: 'bg-green-500',
    },
    baseline: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-300',
      dot: 'bg-blue-500',
    },
    completed: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-800 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    draft: {
      bg: 'bg-slate-100 dark:bg-slate-700',
      text: 'text-slate-600 dark:text-slate-300',
      dot: 'bg-slate-400',
    },
    registered: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-800 dark:text-purple-300',
      dot: 'bg-purple-500',
    },
    closed: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-300',
      dot: 'bg-red-500',
    },
    approved: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      dot: 'bg-green-500',
    },
    rejected: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-300',
      dot: 'bg-red-500',
    },
    pending: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-800 dark:text-yellow-300',
      dot: 'bg-yellow-500',
    },
    executed: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-300',
      dot: 'bg-blue-500',
    },
    expired: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-800 dark:text-orange-300',
      dot: 'bg-orange-500',
    },
    confirmed: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      dot: 'bg-green-500',
    },
    failed: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-300',
      dot: 'bg-red-500',
    },
  };

  get colorClasses(): string {
    const s = this.status?.toLowerCase() || 'draft';
    const colors = this.statusColorMap[s];
    return colors ? `${colors.bg} ${colors.text}` : 'bg-slate-100 text-slate-600';
  }

  get dotColor(): string {
    const s = this.status?.toLowerCase() || 'draft';
    return this.statusColorMap[s]?.dot || 'bg-slate-400';
  }
}
