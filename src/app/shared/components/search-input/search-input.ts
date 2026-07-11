import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { LucideAngularModule, Search, X } from 'lucide-angular';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [FormsModule, NgIf, LucideAngularModule],
  template: `
    <div class="relative">
      <lucide-angular
        [img]="SearchIcon"
        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
      ></lucide-angular>
      <input
        [ngModel]="value"
        (ngModelChange)="onInput($event)"
        type="text"
        [placeholder]="placeholder"
        class="input pl-10 pr-10"
      />
      <button
        *ngIf="value"
        (click)="clear()"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        <lucide-angular [img]="XIcon" class="w-4 h-4"></lucide-angular>
      </button>
    </div>
  `,
})
export class SearchInputComponent implements OnInit, OnDestroy {
  @Input() value = '';
  @Input() placeholder = 'Search...';
  @Input() debounceMs = 300;
  @Output() valueChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();

  protected readonly SearchIcon = Search;
  protected readonly XIcon = X;

  private searchSubject = new Subject<string>();
  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.searchSubject
      .pipe(debounceTime(this.debounceMs), distinctUntilChanged())
      .subscribe({
        next: (value) => {
          this.search.emit(value);
        },
        error: () => {},
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onInput(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
    this.searchSubject.next(value);
  }

  clear(): void {
    this.value = '';
    this.valueChange.emit('');
    this.search.emit('');
  }
}
