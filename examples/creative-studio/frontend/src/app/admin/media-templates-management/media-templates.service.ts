/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {PaginatedResponse} from '../../common/models/paginated-response.model';
import {MediaTemplate} from '../../fun-templates/media-template.model';

@Injectable({
  providedIn: 'root',
})
export class MediaTemplatesService {
  private apiUrl = `${environment.backendURL}/media-templates`;

  constructor(private http: HttpClient) {}

  getMediaTemplates(): Observable<PaginatedResponse<MediaTemplate>> {
    return this.http
      .get<PaginatedResponse<MediaTemplate>>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  createMediaTemplate(template: MediaTemplate): Observable<MediaTemplate> {
    return this.http
      .post<MediaTemplate>(this.apiUrl, template)
      .pipe(catchError(this.handleError));
  }

  updateMediaTemplate(id: number, payload: Omit<MediaTemplate, 'id' | 'mimeType'>): Observable<MediaTemplate> {
    const url = `${this.apiUrl}/${id}`;
    return this.http
      .put<MediaTemplate>(url, payload)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (
        error.error &&
        typeof error.error === 'object' &&
        error.error.detail
      ) {
        // FastAPI validation errors often come in this format
        errorMessage += `\nDetails: ${JSON.stringify(error.error.detail)}`;
      } else if (error.error) {
        errorMessage += `\nBackend Error: ${JSON.stringify(error.error)}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  deleteMediaTemplate(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(catchError(this.handleError));
  }
}
