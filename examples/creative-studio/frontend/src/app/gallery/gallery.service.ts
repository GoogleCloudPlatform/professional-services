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

import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  Subscription,
} from 'rxjs';
import {
  tap,
  catchError,
  shareReplay,
  switchMap,
  debounceTime,
} from 'rxjs/operators';
import {
  MediaItem,
  PaginatedGalleryResponse,
  JobStatus,
} from '../common/models/media-item.model';
import {environment} from '../../environments/environment';
import {GallerySearchDto} from '../common/models/search.model';
import {WorkspaceStateService} from '../services/workspace/workspace-state.service';

@Injectable({
  providedIn: 'root',
})
export class GalleryService implements OnDestroy {
  private imagesCache$ = new BehaviorSubject<MediaItem[]>([]);
  public isLoading$ = new BehaviorSubject<boolean>(false);
  private allImagesLoaded$ = new BehaviorSubject<boolean>(false);
  private currentPage = 0;
  private pageSize = 20;
  private allFetchedImages: MediaItem[] = [];
  private filters$ = new BehaviorSubject<GallerySearchDto>({limit: 20});
  private dataLoadingSubscription: Subscription;

  constructor(
    private http: HttpClient,
    private workspaceStateService: WorkspaceStateService,
  ) {
    this.dataLoadingSubscription = combineLatest([
      this.workspaceStateService.activeWorkspaceId$,
      this.filters$,
    ])
      .pipe(
        // Use debounceTime to wait for filters to be set and prevent rapid reloads
        debounceTime(50),
        switchMap(([workspaceId, filters]) => {
          this.isLoading$.next(true);
          this.resetCache();

          const body: GallerySearchDto = {
            ...filters,
            workspaceId: workspaceId ?? undefined,
          };

          return this.fetchImages(body).pipe(
            catchError(err => {
              console.error('Failed to fetch gallery images', err);
              this.isLoading$.next(false);
              this.allImagesLoaded$.next(true); // prevent loading more
              return of(null); // Return null or an empty response to prevent breaking the stream
            }),
          );
        }),
      )
      .subscribe(response => {
        if (response) {
          this.processFetchResponse(response);
        }
      });
  }

  get images$(): Observable<MediaItem[]> {
    return this.imagesCache$.asObservable();
  }

  get allImagesLoaded(): Observable<boolean> {
    return this.allImagesLoaded$.asObservable();
  }

  ngOnDestroy() {
    this.dataLoadingSubscription.unsubscribe();
  }

  setFilters(filters: GallerySearchDto) {
    this.filters$.next(filters);
    // No need to call loadGallery here, the stream will automatically react.
  }

  loadGallery(reset = false): void {
    if (this.isLoading$.value) {
      return;
    }

    if (reset) {
      this.resetCache();
    }

    if (this.allImagesLoaded$.value) {
      return;
    }

    const body: GallerySearchDto = {
      ...this.filters$.value,
      workspaceId:
        this.workspaceStateService.getActiveWorkspaceId() ?? undefined,
      offset: this.currentPage * this.pageSize,
      limit: this.pageSize,
    };

    this.fetchImages(body)
      .pipe(
        catchError(err => {
          console.error('Failed to fetch gallery images', err);
          this.isLoading$.next(false);
          this.allImagesLoaded$.next(true); // prevent loading more
          return of(null);
        }),
      )
      .subscribe(response => {
        if (response) {
          this.processFetchResponse(response, /* append= */ true);
        }
      });
  }

  private fetchImages(
    body: GallerySearchDto,
  ): Observable<PaginatedGalleryResponse> {
    this.isLoading$.next(true);
    const galleryUrl = `${environment.backendURL}/gallery/search`;
    return this.http
      .post<PaginatedGalleryResponse>(galleryUrl, body)
      .pipe(shareReplay(1));
  }

  private resetCache() {
    this.allFetchedImages = [];
    this.currentPage = 0;
    this.allImagesLoaded$.next(false);
    this.imagesCache$.next([]);
  }

  private processFetchResponse(
    response: PaginatedGalleryResponse,
    append = false,
  ) {
    this.currentPage++;
    this.allFetchedImages = append
      ? [...this.allFetchedImages, ...response.data]
      : response.data;
    this.imagesCache$.next(this.allFetchedImages);

    if (this.currentPage >= response.totalPages) {
      this.allImagesLoaded$.next(true);
    }
    this.isLoading$.next(false);
  }

  getMedia(id: string): Observable<MediaItem> {
    const detailUrl = `${environment.backendURL}/gallery/item/${id}`;
    return this.http.get<MediaItem>(detailUrl);
  }

  /**
   * Creates a new template based on a media item.
   * @param mediaItemId The ID of the media item to base the template on.
   */
  createTemplateFromMediaItem(mediaItemId: string): Observable<{id: string}> {
    return this.http.post<{id: string}>(
      `${environment.backendURL}/media-templates/from-media-item/${mediaItemId}`,
      {},
    );
  }
}
