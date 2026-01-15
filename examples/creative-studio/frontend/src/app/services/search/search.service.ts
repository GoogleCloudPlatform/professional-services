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
import {HttpClient} from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  finalize,
  interval,
  map,
  Observable,
  startWith,
  Subscription,
  switchMap,
  takeWhile,
  tap,
  timer,
} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ImagenRequest, VeoRequest} from '../../common/models/search.model';
import {JobStatus, MediaItem} from '../../common/models/media-item.model';
import {MatSnackBar} from '@angular/material/snack-bar';
import {
  handleErrorSnackbar,
  handleSuccessSnackbar,
} from '../../utils/handleMessageSnackbar';

export interface RewritePromptRequest {
  targetType: 'image' | 'video';
  userPrompt: string;
}
export interface ConcatenationInput {
  id: number;
  type: 'media_item' | 'source_asset';
}
export interface ConcatenateVideosDto {
  workspaceId: string;
  name: string;
  inputs: ConcatenationInput[];
  aspectRatio: string;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private activeVideoJob = new BehaviorSubject<MediaItem | null>(null);
  public activeVideoJob$ = this.activeVideoJob.asObservable();
  private videoPollingSubscription: Subscription | null = null;

  private activeImageJob = new BehaviorSubject<MediaItem | null>(null);
  public activeImageJob$ = this.activeImageJob.asObservable();
  private imagePollingSubscription: Subscription | null = null;

  // Persisted prompts
  imagePrompt = '';
  videoPrompt = '';

  private activeVtoJob = new BehaviorSubject<MediaItem | null>(null);
  public activeVtoJob$ = this.activeVtoJob.asObservable();
  private vtoPollingSubscription: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private _snackBar: MatSnackBar,
  ) {}

  searchImagen(searchRequest: ImagenRequest) {
    const searchURL = `${environment.backendURL}/images/generate-images`;
    return this.http
      .post(searchURL, searchRequest)
      .pipe(map(response => response as MediaItem));
  }

  /**
   * Starts the image generation job by POSTing to the backend.
   */
  startImagenGeneration(searchRequest: ImagenRequest): Observable<MediaItem> {
    const searchURL = `${environment.backendURL}/images/generate-images`;
    return this.http.post<MediaItem>(searchURL, searchRequest).pipe(
      tap(initialItem => {
        this.activeImageJob.next(initialItem);
        this.startImagenPolling(initialItem.id);
      }),
    );
  }

  clearActiveImageJob() {
    this.activeImageJob.next(null);
  }

  private startImagenPolling(mediaId: number): void {
    this.stopImagenPolling();
    this.imagePollingSubscription = timer(2000, 5000) // Start after 2s, then every 5s
      .pipe(
        switchMap(() => this.getImagenMediaItem(mediaId)),
        tap(latestItem => {
          this.activeImageJob.next(latestItem);
          if (
            latestItem.status === JobStatus.COMPLETED ||
            latestItem.status === JobStatus.FAILED
          ) {
            this.stopImagenPolling();
            if (latestItem.status === JobStatus.COMPLETED) {
              handleSuccessSnackbar(this._snackBar, 'Your images are ready!');
            } else {
              handleErrorSnackbar(
                this._snackBar,
                {message: latestItem.errorMessage || latestItem.error_message},
                `Image generation failed: ${latestItem.errorMessage || latestItem.error_message}`,
              );
            }
          }
        }),
        catchError(err => {
          console.error('Polling failed', err);
          this.stopImagenPolling();
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private stopImagenPolling(): void {
    this.imagePollingSubscription?.unsubscribe();
    this.imagePollingSubscription = null;
  }

  getImagenMediaItem(mediaId: number): Observable<MediaItem> {
    // Note: We need to add this endpoint to the backend or use a generic one.
    // For now, assuming we'll add /images/{mediaId} or use a common gallery endpoint.
    // Given the current backend structure, we might need to add this.
    // Let's assume we'll add it.
    const getURL = `${environment.backendURL}/gallery/item/${mediaId}`;
    return this.http.get<MediaItem>(getURL);
  }

  /**
   * Starts the video generation job by POSTing to the backend.
   * It returns an Observable of the initial MediaItem.
   */
  startVeoGeneration(searchRequest: VeoRequest): Observable<MediaItem> {
    const searchURL = `${environment.backendURL}/videos/generate-videos`;

    return this.http.post<MediaItem>(searchURL, searchRequest).pipe(
      // The 'tap' operator lets us perform a side-effect (like starting polling)
      // without affecting the value passed to the component's subscription.
      tap(initialItem => {
        // 1. Push the initial "processing" item into the BehaviorSubject
        this.activeVideoJob.next(initialItem);
        // 2. Start polling in the background
        this.startVeoPolling(initialItem.id);
      }),
    );
  }

  concatenateVideos(payload: ConcatenateVideosDto): Observable<MediaItem> {
    const url = `${environment.backendURL}/videos/concatenate`;
    return this.http.post<MediaItem>(url, payload).pipe(
      tap(initialResponse => {
        this.activeVideoJob.next(initialResponse);
        this.startVeoPolling(initialResponse.id);
      }),
    );
  }

  clearActiveVideoJob() {
    this.activeVideoJob.next(null);
  }

  /**
   * Private method to poll the status of a media item.
   * @param mediaId The ID of the job to poll.
   */
  private startVeoPolling(mediaId: number): void {
    this.stopVeoPolling(); // Ensure no other polls are running

    this.videoPollingSubscription = timer(5000, 15000) // Start after 5s, then every 15s
      .pipe(
        switchMap(() => this.getVeoMediaItem(mediaId)),
        tap(latestItem => {
          // Push the latest status to all subscribers
          this.activeVideoJob.next(latestItem);

          // If the job is finished, stop polling
          if (
            latestItem.status === JobStatus.COMPLETED ||
            latestItem.status === JobStatus.FAILED
          ) {
            this.stopVeoPolling();
            if (latestItem.status === JobStatus.COMPLETED) {
              handleSuccessSnackbar(this._snackBar, 'Your video is ready!');
            } else {
              handleErrorSnackbar(
                this._snackBar,
                {message: latestItem.errorMessage || latestItem.error_message},
                `Video generation failed: ${latestItem.errorMessage || latestItem.error_message}`,
              );
            }
          }
        }),
        catchError(err => {
          console.error('Polling failed', err);
          this.stopVeoPolling();
          // You could update the item with an error status here
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private stopVeoPolling(): void {
    this.videoPollingSubscription?.unsubscribe();
    this.videoPollingSubscription = null;
  }

  /**
   * Fetches the current state of a media item by its ID.
   * @param mediaId The unique ID of the media item to check.
   * @returns An Observable of the MediaItem.
   */
  getVeoMediaItem(mediaId: number): Observable<MediaItem> {
    const getURL = `${environment.backendURL}/gallery/item/${mediaId}`;
    return this.http.get<MediaItem>(getURL);
  }

  rewritePrompt(payload: {
    targetType: 'image' | 'video';
    userPrompt: string;
  }): Observable<{prompt: string}> {
    return this.http.post<{prompt: string}>(
      `${environment.backendURL}/gemini/rewrite-prompt`,
      payload,
    );
  }

  getRandomPrompt(payload: {
    target_type: 'image' | 'video';
  }): Observable<{prompt: string}> {
    return this.http.post<{prompt: string}>(
      `${environment.backendURL}/gemini/random-prompt`,
      payload,
    );
  }

  /**
   * Starts the VTO generation job by POSTing to the backend.
   * Returns an Observable of the initial MediaItem.
   */
  startVtoGeneration(vtoRequest: any): Observable<MediaItem> {
    const url = `${environment.backendURL}/images/generate-images-for-vto`;

    return this.http.post<MediaItem>(url, vtoRequest).pipe(
      tap(initialItem => {
        this.activeVtoJob.next(initialItem);
        this.startVtoPolling(initialItem.id);
      })
    );
  }

  /**
   * Private method to poll the status of a VTO job.
   * @param mediaId The ID of the job to poll.
   */
  private startVtoPolling(mediaId: number): void {
    this.stopVtoPolling();

    this.vtoPollingSubscription = timer(5000, 15000) // Start after 5s, then every 15s
      .pipe(
        switchMap(() => this.getVtoMediaItem(mediaId)),
        tap(latestItem => {
          this.activeVtoJob.next(latestItem);

          if (
            latestItem.status === JobStatus.COMPLETED ||
            latestItem.status === JobStatus.FAILED
          ) {
            this.stopVtoPolling();
            if (latestItem.status === JobStatus.COMPLETED) {
              handleSuccessSnackbar(this._snackBar, 'Your VTO result is ready!');
            } else {
              handleErrorSnackbar(
                this._snackBar,
                {message: latestItem.errorMessage || latestItem.error_message},
                `VTO generation failed: ${latestItem.errorMessage || latestItem.error_message}`,
              );
            }
          }
        }),
        catchError(err => {
          console.error('VTO polling failed', err);
          this.stopVtoPolling();
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private stopVtoPolling(): void {
    this.vtoPollingSubscription?.unsubscribe();
    this.vtoPollingSubscription = null;
  }

  /**
   * Fetches the current state of a VTO media item by its ID.
   * @param mediaId The unique ID of the media item to check.
   * @returns An Observable of the MediaItem.
   */
  getVtoMediaItem(mediaId: number): Observable<MediaItem> {
    const url = `${environment.backendURL}/gallery/item/${mediaId}`;
    return this.http.get<MediaItem>(url);
  }

  clearActiveVtoJob() {
    this.activeVtoJob.next(null);
    this.stopVtoPolling();
  }
}
