import { Injectable } from '@angular/core';
import freighter, { WatchWalletChanges } from '@stellar/freighter-api';
import { BehaviorSubject, Observable, EMPTY } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private publicKeySubject = new BehaviorSubject<string | null>(null);
  public publicKey$ = this.publicKeySubject.asObservable();

  private networkSubject = new BehaviorSubject<'testnet' | 'public' | null>(null);
  public network$ = this.networkSubject.asObservable();

  /**
   * Emits the new public key whenever the user switches Stellar accounts in
   * Freighter mid-session. Only emits distinct values (no duplicate fires if
   * the user switches back to the same account).
   *
   * Implemented using Freighter v6's `WatchWalletChanges` class, which polls
   * for changes and delivers `{ address, network, networkPassphrase }` to its
   * callback. We wrap it in an Observable for a teardown-safe, RxJS-idiomatic
   * interface consistent with WebsocketService.on<T>().
   *
   * Falls back to EMPTY when not running in a browser environment.
   */
  public readonly addressChange$: Observable<string> = this.buildAddressChangeObservable();

  /**
   * Emits the new network name whenever the user switches networks in
   * Freighter mid-session. Shares the same WatchWalletChanges poll underneath
   * — only distinct values are emitted.
   */
  public readonly networkChange$: Observable<string> = this.buildNetworkChangeObservable();

  constructor(private loggingService: LoggingService) {}

  onAddressChange(): Observable<string> {
    return this.addressChange$;
  }

  onNetworkChange(): Observable<string> {
    return this.networkChange$;
  }

  normalizeNetwork(network: string): 'testnet' | 'public' | null {
    if (!network) return null;
    const lower = network.toLowerCase();
    if (lower.includes('test') || lower === 'testnet') return 'testnet';
    if (lower.includes('public') || lower === 'public') return 'public';
    return null;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const result = await freighter.isConnected();
      if (result.isConnected) {
        const addressResult = await freighter.getAddress();
        if (addressResult.address) {
          this.publicKeySubject.next(addressResult.address);
          try {
            const netResult = await freighter.getNetwork();
            if (netResult.network) {
              const net = this.normalizeNetwork(netResult.network);
              this.networkSubject.next(net);
            }
          } catch {
            // Ignore network fetch error if extension is slow
          }
          return true;
        }
      }
    } catch (e) {
      this.loggingService.error('Check connection failed', e);
    }
    return false;
  }

  async connect(): Promise<string | null> {
    try {
      const result = await freighter.getAddress();
      if (result.address) {
        this.publicKeySubject.next(result.address);
        try {
          const netResult = await freighter.getNetwork();
          if (netResult.network) {
            const net = this.normalizeNetwork(netResult.network);
            this.networkSubject.next(net);
          }
        } catch {
          // Ignore network fetch error
        }
        return result.address;
      }
      return null;
    } catch (error) {
      this.loggingService.error('Failed to connect to Freighter:', error);
      return null;
    }
  }

  async disconnect(): Promise<void> {
    this.publicKeySubject.next(null);
    this.networkSubject.next(null);
  }

  async getNetwork(): Promise<'testnet' | 'public' | null> {
    try {
      const netResult = await freighter.getNetwork();
      if (netResult.network) {
        const net = this.normalizeNetwork(netResult.network);
        this.networkSubject.next(net);
        return net;
      }
    } catch (e) {
      this.loggingService.error('Failed to get network from Freighter:', e);
    }
    return this.networkSubject.value;
  }

  async signChallenge(challenge: string): Promise<string | null> {
    try {
      // signMessage is the replacement for signBlob/signMessage in v6
      const result = await freighter.signMessage(challenge);
      if ('signedMessage' in result && result.signedMessage) {
        if (typeof result.signedMessage === 'string') {
          return result.signedMessage;
        }
        // Uint8Array to base64
        const binary = String.fromCharCode(...result.signedMessage);
        return window.btoa(binary);
      }
      return null;
    } catch (error) {
      this.loggingService.error('Failed to sign challenge:', error);
      return null;
    }
  }

  /**
   * Sign a Stellar transaction XDR using the Freighter wallet extension.
   *
   * Returns the signed XDR string on success, or `null` when Freighter
   * resolves but returns no XDR (edge case treated as implicit cancellation).
   *
   * **Re-throws** any error thrown by Freighter so callers can distinguish
   * user-declined rejections (error message contains "declined"/"rejected"/
   * "cancelled") from genuine extension/network errors.  The prior
   * catch-and-return-null pattern silently swallowed all failure modes,
   * preventing the NgRx effect from routing to the correct failure action.
   */
  async signTx(xdr: string, network: string, networkPassphrase?: string): Promise<string | null> {
    const result = await freighter.signTransaction(xdr, { networkPassphrase });
    if (result.signedTxXdr) {
      return result.signedTxXdr;
    }
    return null;
  }

  getStoredPublicKey(): string | null {
    return this.publicKeySubject.value;
  }

  getStoredNetwork(): 'testnet' | 'public' | null {
    return this.networkSubject.value;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Wraps `WatchWalletChanges` (Freighter v6's polling watcher) in a
   * teardown-safe Observable that emits the address whenever the active
   * Stellar account changes mid-session.
   *
   * WatchWalletChanges.watch(cb) starts a poll (default 3-second interval)
   * and calls `cb` with `{ address, network, networkPassphrase }` on every
   * detected change. WatchWalletChanges.stop() halts the poll. We wire the
   * stop() call into the Observable's teardown so the watcher is cleaned up
   * when the last subscriber unsubscribes.
   *
   * Pattern mirrors WebsocketService.on<T>() — the handler reference is
   * kept locally so only this subscriber's watcher is stopped on teardown.
   *
   * Falls back to EMPTY when WatchWalletChanges is unavailable (non-browser
   * environments, future SDK changes).
   */
  private buildAddressChangeObservable(): Observable<string> {
    if (typeof WatchWalletChanges === 'undefined') {
      return EMPTY;
    }

    return new Observable<string>((observer) => {
      const watcher = new WatchWalletChanges();
      watcher.watch(({ address }) => {
        if (address) {
          this.publicKeySubject.next(address);
          observer.next(address);
        }
      });

      // Teardown: stop polling when the subscriber unsubscribes.
      return () => watcher.stop();
    }).pipe(
      filter((address): address is string => typeof address === 'string' && address.length > 0),
      distinctUntilChanged(),
    );
  }

  /**
   * Wraps `WatchWalletChanges` to emit the network name on mid-session
   * network switches. Uses a separate watcher instance from addressChange$
   * so each Observable's teardown is independent.
   */
  private buildNetworkChangeObservable(): Observable<string> {
    if (typeof WatchWalletChanges === 'undefined') {
      return EMPTY;
    }

    return new Observable<string>((observer) => {
      const watcher = new WatchWalletChanges();
      watcher.watch(({ network }) => {
        if (network) {
          const normalized = this.normalizeNetwork(network);
          if (normalized) {
            this.networkSubject.next(normalized);
          }
          observer.next(network);
        }
      });

      return () => watcher.stop();
    }).pipe(
      filter((network): network is string => typeof network === 'string' && network.length > 0),
      distinctUntilChanged(),
    );
  }
}
