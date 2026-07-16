import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';
import { LucideAngularModule, Inbox } from 'lucide-angular';
import { LucideIconData } from '../../../core/models/shared-interfaces.model';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [NgIf, LucideAngularModule],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
      <lucide-angular
        [img]="icon"
        class="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4"
      ></lucide-angular>
      <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{{ title }}</h3>
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">{{ message }}</p>
      <button *ngIf="actionLabel" (click)="action.emit()" class="btn btn-primary">
        {{ actionLabel }}
      </button>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() message = '';
  @Input() actionLabel = '';
  @Input() icon: LucideIconData = Inbox;
  @Output() action = new EventEmitter<void>();
}
