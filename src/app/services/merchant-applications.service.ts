import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { joinApiPath, readApiEnvelope } from './pages.service';

export interface MerchantApplicationRequest {
  hasCommercialRegisterAndTaxCard: string;
  companyName: string;
  contactPersonName: string;
  contactPersonPhoneNumber: string;
  category: string;
  websiteOrFacebookLink: string;
  governorate: string;
  numberOfBranches: number;
  averageMonthlySales: number;
}

export interface MerchantApplicationResult {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class MerchantApplicationsService {
  constructor(private readonly http: HttpClient) {}

  submit(payload: MerchantApplicationRequest): Observable<MerchantApplicationResult> {
    const url = joinApiPath(environment.apiBaseUrl, '/merchant-applications');
    return this.http.post<unknown>(url, payload).pipe(
      map((raw) => {
        const envelope = readApiEnvelope<unknown>(raw);
        if (!envelope.success) {
          throw new Error(envelope.message || 'Failed to submit application');
        }
        return {
          success: true,
          message: envelope.message || 'Request completed successfully.',
        };
      }),
      catchError((err: unknown) => throwError(() => this.toSubmitError(err)))
    );
  }

  private toSubmitError(err: unknown): Error {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (body && typeof body === 'object') {
        const r = body as Record<string, unknown>;
        const msg = r['message'] ?? r['Message'];
        if (typeof msg === 'string' && msg.trim()) {
          return new Error(msg);
        }
      }
      if (err.status === 404) {
        return new Error(
          'Merchant applications API is not available on this server (404). Start the backend locally or deploy POST /api/merchant-applications.'
        );
      }
      if (err.status === 0) {
        return new Error(
          'Cannot reach the API. Check that the backend is running and that CORS allows requests from this site.'
        );
      }
      return new Error(err.message || `Request failed (${err.status})`);
    }
    if (err instanceof Error) {
      return err;
    }
    return new Error('Failed to submit application');
  }
}
