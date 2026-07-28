import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { joinApiPath, readApiEnvelope } from './pages.service';

export interface ContactMessageRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
}

export interface ContactMessageResult {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactMessagesService {
  constructor(private readonly http: HttpClient) {}

  submit(payload: ContactMessageRequest): Observable<ContactMessageResult> {
    const url = joinApiPath(environment.apiBaseUrl, '/contact-messages');
    return this.http.post<unknown>(url, payload).pipe(
      map((raw) => {
        const envelope = readApiEnvelope<unknown>(raw);
        if (!envelope.success) {
          throw new Error(envelope.message || 'Failed to send message');
        }
        return {
          success: true,
          message: envelope.message || 'Your message was sent successfully.'
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
        const e = new Error('CONTACT_API_UNAVAILABLE');
        (e as Error & { code?: string }).code = 'CONTACT_API_UNAVAILABLE';
        return e;
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
    return new Error('Failed to send message');
  }
}
