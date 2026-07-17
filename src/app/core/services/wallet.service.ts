import { Injectable } from '@angular/core';
import freighter from '@stellar/freighter-api';
import { BehaviorSubject } from 'rxjs';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private publicKeySubject = new BehaviorSubject<string | null>(null);
  public publicKey$ = this.publicKeySubject.asObservable();

  constructor(private loggingService: LoggingService) {}

  async checkConnection(): Promise<boolean> {
    try {
      const result = await freighter.isConnected();
      if (result.isConnected) {
        const addressResult = await freighter.getAddress();
        if (addressResult.address) {
          this.publicKeySubject.next(addressResult.address);
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
}
