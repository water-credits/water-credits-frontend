import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { NgIf } from '@angular/common';
import { StellarAddressPipe } from '../../pipes/stellar-address.pipe';
import { LucideAngularModule, Wallet, ChevronDown, LogOut, Copy, Check } from 'lucide-angular';

@Component({
  selector: 'app-wallet-connect',
  standalone: true,
  imports: [NgIf, StellarAddressPipe, LucideAngularModule],
  template: `
    <div class="relative">
      <ng-container *ngIf="!connected">
        <button (click)="connect.emit()" class="btn btn-primary text-sm flex items-center gap-2">
          <lucide-angular [img]="WalletIcon" class="w-4 h-4" aria-hidden="true"></lucide-angular>
          Connect Wallet
        </button>
      </ng-container>
      <ng-container *ngIf="connected">
        <button
          (click)="showMenu = !showMenu"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <span class="w-2 h-2 rounded-full bg-green-500"></span>
          <span class="text-sm font-mono">{{ address | stellarAddress }}</span>
          <lucide-angular [img]="ChevronDownIcon" class="w-3 h-3 text-slate-400" aria-hidden="true"></lucide-angular>
        </button>
        <div
          *ngIf="showMenu"
          class="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-bg-lighter rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50"
        >
          <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
            <p class="text-xs text-slate-500 dark:text-slate-400">Connected as</p>
            <p class="text-sm font-mono truncate">{{ address }}</p>
          </div>
          <button
            (click)="copyAddress()"
            class="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <lucide-angular [img]="copied ? CheckIcon : CopyIcon" class="w-4 h-4" aria-hidden="true"></lucide-angular>
            {{ copied ? 'Copied!' : 'Copy Address' }}
          </button>
          <button
            (click)="disconnect.emit(); showMenu = false"
            class="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <lucide-angular [img]="LogOutIcon" class="w-4 h-4" aria-hidden="true"></lucide-angular>
            Disconnect
          </button>
        </div>
      </ng-container>
    </div>
  `,
})
export class WalletConnectComponent {
  @Input() connected = false;
  @Input() address = '';
  @Input() network = 'testnet';
  @Output() connect = new EventEmitter<void>();
  @Output() disconnect = new EventEmitter<void>();

  protected showMenu = false;
  protected copied = false;
  protected readonly WalletIcon = Wallet;
  protected readonly ChevronDownIcon = ChevronDown;
  protected readonly LogOutIcon = LogOut;
  protected readonly CopyIcon = Copy;
  protected readonly CheckIcon = Check;

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showMenu = false;
  }

  copyAddress(): void {
    navigator.clipboard.writeText(this.address);
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }
}
