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
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  Observable,
  of,
  Subscription,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {
  BrandGuidelineModel,
  GenerateUploadUrlResponse,
} from '../../models/brand-guideline.model';
import {JobStatus} from '../../models/media-item.model';

@Injectable({
  providedIn: 'root',
})
export class BrandGuidelineService {
  private apiUrl = `${environment.backendURL}/brand-guidelines`;
  private pollingSubscription?: Subscription;

  private readonly activeBrandGuidelineJobSubject =
    new BehaviorSubject<BrandGuidelineModel | null>(null);
  readonly activeBrandGuidelineJob$ =
    this.activeBrandGuidelineJobSubject.asObservable();

  private readonly cachedBrandGuidelineSubject =
    new BehaviorSubject<BrandGuidelineModel | null>(null);

  constructor(private http: HttpClient) {}

  private initiateUpload(
    workspaceId: number,
    filename: string,
    contentType: string,
    size: number,
  ): Observable<GenerateUploadUrlResponse> {
    return this.http.post<GenerateUploadUrlResponse>(
      `${this.apiUrl}/generate-upload-url`,
      {workspaceId, filename, contentType, size}, // 'filename' matches backend DTO
    );
  }

  private uploadFileToGCS(signedUrl: string, file: File): Observable<unknown> {
    const headers = new HttpHeaders({'Content-Type': file.type});
    return this.http.put(signedUrl, file, {headers, observe: 'response'});
  }

  private finalizeUpload(
    workspaceId: number,
    gcsUri: string,
    name: string,
    original_filename: string,
  ): Observable<BrandGuidelineModel> {
    return this.http.post<BrandGuidelineModel>(
      `${this.apiUrl}/finalize-upload`,
      {
        workspace_id: workspaceId,
        gcs_uri: gcsUri,
        name,
        original_filename,
      },
    );
  }

  createBrandGuideline(
    workspaceId: number,
    file: File,
    name: string,
  ): Observable<BrandGuidelineModel> {
    this.clearCache();
    return this.initiateUpload(
      workspaceId,
      file.name,
      file.type,
      file.size,
    ).pipe(
      switchMap(({ uploadUrl, gcsUri }) => {
        return this.uploadFileToGCS(uploadUrl, file).pipe(
          switchMap(() =>
            this.finalizeUpload(workspaceId, gcsUri, name, file.name),
          ),
        );
      }),
      tap(initialJob => {
        this.activeBrandGuidelineJobSubject.next(initialJob);
        if (initialJob.status === JobStatus.PROCESSING) {
          this.pollBrandGuidelineJob(initialJob.id.toString());
        }
      }),
    );
  }

  /**
   * Fetches the brand guideline for a specific workspace.
   * @param workspaceId The ID of the workspace.
   * @returns An observable of the brand guideline or null if not found.
   */
  getBrandGuidelineForWorkspace(
    workspaceId: number,
  ): Observable<BrandGuidelineModel | null> {
    const cachedGuideline = this.cachedBrandGuidelineSubject.getValue();
    if (cachedGuideline && cachedGuideline.workspaceId === workspaceId) {
      return of(cachedGuideline);
    }

    return this.http
      .get<BrandGuidelineModel>(`${this.apiUrl}/workspace/${workspaceId}`)
      .pipe(
        tap(guideline => this.cachedBrandGuidelineSubject.next(guideline)),
        catchError(() => of(null)),
      );
  }

  /**
   * Deletes a brand guideline by its ID.
   * @param id The ID of the brand guideline to delete.
   */
  deleteBrandGuideline(id: number): Observable<void> {
    // Invalidate cache on deletion.
    this.clearCache();
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private pollBrandGuidelineJob(jobId: string) {
    const pollInterval = 30000; // Poll every 30 seconds
    const maxAttempts = 120; // Poll for up to 10 minutes

    this.stopPolling();

    this.pollingSubscription = timer(0, pollInterval)
      .pipe(
        take(maxAttempts),
        switchMap(() =>
          this.http.get<BrandGuidelineModel>(
            `${environment.backendURL}/brand-guidelines/${jobId}`,
          ),
        ),
        tap(job => {
          this.activeBrandGuidelineJobSubject.next(job);
          if (
            job.status === JobStatus.COMPLETED ||
            job.status === JobStatus.FAILED
          ) {
            // When the job is done, cache the final result.
            this.cachedBrandGuidelineSubject.next(job);
            this.stopPolling();
          }
        }),
        catchError((error: HttpErrorResponse) => {
          const currentJob = this.activeBrandGuidelineJobSubject.getValue();
          if (currentJob) {
            this.activeBrandGuidelineJobSubject.next({
              ...currentJob,
              status: JobStatus.FAILED,
              errorMessage:
                error.error?.detail || 'Polling failed unexpectedly.',
            });
          }
          this.stopPolling();
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private stopPolling() {
    this.pollingSubscription?.unsubscribe();
  }

  clearActiveJob() {
    this.activeBrandGuidelineJobSubject.next(null);
  }

  /**
   * Manually pushes a temporary "processing" state to the job subject.
   * This is used to provide immediate UI feedback before the backend responds.
   */
  setProcessingState() {
    this.activeBrandGuidelineJobSubject.next({
      status: JobStatus.PROCESSING,
      // Cast to BrandGuidelineModel to satisfy the type checker for the temporary state
    } as BrandGuidelineModel);
  }

  /**
   * Clears the in-memory cache for the brand guideline.
   */
  clearCache() {
    this.cachedBrandGuidelineSubject.next(null);
  }
}
