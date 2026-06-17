import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { CreditAmountPipe } from '../../../shared/pipes/credit-amount.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { LucideAngularModule, Wallet, TrendingUp, Clock, DollarSign, ArrowUpRight, CheckCircle, Ban } from 'lucide-angular';

interface Payout {
  date: string;
  amount: string;
  status: 'completed' | 'pending' | 'failed';
  txHash: string;
}

interface ProjectedEarning {
  month: string;
  amount: number;
}

@Component({
  selector: 'app-farmer-earnings',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, CreditAmountPipe, DateFormatPipe, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Earnings</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your credit earnings and payout history</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Earned</p>
            <div class="w-9 h-9 rounded-lg bg-environmental-green/10 flex items-center justify-center">
              <lucide-angular [img]="Wallet" class="w-4 h-4 text-environmental-green"></lucide-angular>
            </div>
          </div>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ totalEarned | creditAmount }}</p>
          <p class="text-xs text-slate-400 mt-1">lifetime credits</p>
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending</p>
            <div class="w-9 h-9 rounded-lg bg-credit-gold/10 flex items-center justify-center">
              <lucide-angular [img]="Clock" class="w-4 h-4 text-credit-gold"></lucide-angular>
            </div>
          </div>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ pendingAmount | creditAmount }}</p>
          <p class="text-xs text-slate-400 mt-1">awaiting verification</p>
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Projected</p>
            <div class="w-9 h-9 rounded-lg bg-stellar-blue/10 flex items-center justify-center">
              <lucide-angular [img]="TrendingUp" class="w-4 h-4 text-stellar-blue"></lucide-angular>
            </div>
          </div>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ projectedAmount | creditAmount }}</p>
          <p class="text-xs text-slate-400 mt-1">next 12 months</p>
        </div>
      </div>

      <div class="card p-5">
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Projected Earnings</h3>
        <div class="flex items-end gap-2 h-48">
          <div *ngFor="let item of projectedEarnings" class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full bg-stellar-blue/10 rounded-t relative" [style.height.px]="getBarHeight(item.amount)">
              <div class="w-full bg-stellar-blue/60 rounded-t absolute bottom-0 transition-all duration-500" [style.height.pct]="getBarPercent(item.amount)"></div>
            </div>
            <span class="text-[10px] text-slate-400 text-center">{{ item.month }}</span>
            <span class="text-[10px] font-medium text-slate-600 dark:text-slate-300">{{ item.amount | creditAmount }}</span>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Payout History</h3>
          <span class="text-xs text-slate-400">{{ payouts.length }} transactions</span>
        </div>

        <div *ngIf="payouts.length === 0" class="text-center py-8 text-sm text-slate-400">
          No payouts yet
        </div>

        <div *ngIf="payouts.length > 0" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700">
                <th class="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Date</th>
                <th class="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Amount</th>
                <th class="text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Status</th>
                <th class="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Transaction</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let payout of payouts" class="border-b border-slate-100 dark:border-slate-700 last:border-0">
                <td class="py-3 text-slate-700 dark:text-slate-300">{{ payout.date | dateFormat:'short' }}</td>
                <td class="py-3 text-right font-medium text-slate-900 dark:text-white">{{ payout.amount | creditAmount }}</td>
                <td class="py-3 text-center">
                  <span *ngIf="payout.status === 'completed'" class="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                    <lucide-angular [img]="CheckCircle" class="w-3 h-3"></lucide-angular>
                    Completed
                  </span>
                  <span *ngIf="payout.status === 'pending'" class="inline-flex items-center gap-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                    <lucide-angular [img]="Clock" class="w-3 h-3"></lucide-angular>
                    Pending
                  </span>
                  <span *ngIf="payout.status === 'failed'" class="inline-flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
                    <lucide-angular [img]="Ban" class="w-3 h-3"></lucide-angular>
                    Failed
                  </span>
                </td>
                <td class="py-3 text-right">
                  <span class="text-xs font-mono text-slate-400">{{ payout.txHash.slice(0, 10) }}...</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class FarmerEarningsComponent implements OnInit {
  protected totalEarned: string = '12500';
  protected pendingAmount: string = '3200';
  protected projectedAmount: string = '18000';
  protected projectedEarnings: ProjectedEarning[] = [];
  protected payouts: Payout[] = [];
  private maxProjectedAmount = 0;

  protected readonly Wallet = Wallet;
  protected readonly TrendingUp = TrendingUp;
  protected readonly Clock = Clock;
  protected readonly DollarSign = DollarSign;
  protected readonly ArrowUpRight = ArrowUpRight;
  protected readonly CheckCircle = CheckCircle;
  protected readonly Ban = Ban;

  constructor(
    private analyticsService: AnalyticsService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.projectedEarnings = [
      { month: 'Jan', amount: 1200 },
      { month: 'Feb', amount: 1200 },
      { month: 'Mar', amount: 1350 },
      { month: 'Apr', amount: 1500 },
      { month: 'May', amount: 1800 },
      { month: 'Jun', amount: 2000 },
      { month: 'Jul', amount: 2000 },
      { month: 'Aug', amount: 1800 },
      { month: 'Sep', amount: 1600 },
      { month: 'Oct', amount: 1400 },
      { month: 'Nov', amount: 1200 },
      { month: 'Dec', amount: 1150 },
    ];
    this.maxProjectedAmount = Math.max(...this.projectedEarnings.map(e => e.amount), 1);

    this.payouts = [
      { date: '2026-05-15T00:00:00Z', amount: '2500', status: 'completed', txHash: 'GB1234ABCD5678EFGH9012IJKL3456MNOP7890QRST' },
      { date: '2026-04-01T00:00:00Z', amount: '2500', status: 'completed', txHash: 'AB9876ZYXV5432UTSR1098QPON7654LKJH3210GFED' },
      { date: '2026-02-15T00:00:00Z', amount: '2000', status: 'completed', txHash: 'XY5678ABCD1234EFGH9012IJKL3456MNOP7890QRST' },
      { date: '2026-01-10T00:00:00Z', amount: '3200', status: 'pending', txHash: 'CD3456EFGH7890IJKL1234MNOP5678QRST9012UVWX' },
      { date: '2025-12-01T00:00:00Z', amount: '1800', status: 'completed', txHash: 'EF9012GHIJ3456KLMN7890OPQR1234STUV5678WXYZ' },
      { date: '2025-11-15T00:00:00Z', amount: '1500', status: 'failed', txHash: 'GH7890IJKL1234MNOP5678QRST9012UVWX3456YZAB' },
    ];

    try {
      const overview = await this.analyticsService.getOverview();
      if (overview) {
        this.totalEarned = overview.totalCreditsMinted || this.totalEarned;
      }
    } catch {
      // Use defaults if analytics fail
    }
  }

  getBarHeight(amount: number): number {
    return (amount / this.maxProjectedAmount) * 160;
  }

  getBarPercent(amount: number): number {
    return (amount / this.maxProjectedAmount) * 100;
  }
}
