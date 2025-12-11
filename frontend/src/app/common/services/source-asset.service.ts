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
import {BehaviorSubject, Observable, of} from 'rxjs';
import {tap, catchError, finalize, shareReplay} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {WorkspaceStateService} from '../../services/workspace/workspace-state.service';
import {
  AssetScopeEnum,
  AssetTypeEnum,
} from '../../admin/source-assets-management/source-asset.model';

export interface SourceAssetResponseDto {
  id: number;
  userId: string;
  gcsUri: string;
  originalFilename: string;
  mimeType: string;
  aspectRatio: string;
  fileHash: string;
  createdAt: string;
  updatedAt: string;
  presignedUrl: string;
  presignedThumbnailUrl?: string;
}

export interface SourceAssetSearchDto {
  limit?: number;
  offset?: number;
  mimeType?: string;
  assetType?: string;
  userEmail?: string;
}

export interface PaginationResponseDto<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class SourceAssetService {
  private assets$ = new BehaviorSubject<SourceAssetResponseDto[]>([]);
  public isLoading$ = new BehaviorSubject<boolean>(false);
  private allAssetsLoaded$ = new BehaviorSubject<boolean>(false);
  private currentPage = 0;
  private pageSize = 20;
  private allFetchedAssets: SourceAssetResponseDto[] = [];
  private filters$ = new BehaviorSubject<SourceAssetSearchDto>({});

  // Cache the request observable to prevent multiple API calls for the same filters.
  private assetsRequest$: Observable<
    PaginationResponseDto<SourceAssetResponseDto>
  > | null = null;

  constructor(
    private http: HttpClient,
    private workspaceStateService: WorkspaceStateService,
  ) {}

  get assets(): Observable<SourceAssetResponseDto[]> {
    return this.assets$.asObservable();
  }

  get allAssetsLoaded(): Observable<boolean> {
    return this.allAssetsLoaded$.asObservable();
  }

  setFilters(filters: SourceAssetSearchDto) {
    const currentFilters = this.filters$.value;
    // Do not re-fetch if the filters are the same and we've already loaded data.
    // This prevents re-fetching every time the gallery is opened.
    if (
      JSON.stringify(currentFilters) === JSON.stringify(filters) &&
      (this.allFetchedAssets.length > 0 || this.allAssetsLoaded$.value)
    ) {
      return;
    }

    this.filters$.next(filters);
    // When filters change, clear the cache and reset.
    this.assetsRequest$ = null;
    this.loadAssets(true);
  }

  uploadAsset(
    file: File,
    options: {
      aspectRatio?: string;
      assetType?: AssetTypeEnum;
      scope?: AssetScopeEnum; // 1. Add scope to the options
    } = {},
  ): Observable<SourceAssetResponseDto> {
    const formData = new FormData();
    formData.append('file', file);

    const activeWorkspaceId = this.workspaceStateService.getActiveWorkspaceId();
    if (activeWorkspaceId) {
      formData.append('workspaceId', activeWorkspaceId);
    }

    if (options.aspectRatio) {
      formData.append('aspectRatio', options.aspectRatio);
    }
    if (options.assetType) {
      formData.append('assetType', options.assetType);
    }
    // 2. Add scope to the form data if it exists
    if (options.scope) {
      formData.append('scope', options.scope);
    }

    return this.http
      .post<SourceAssetResponseDto>(
        `${environment.backendURL}/source_assets/upload`,
        formData,
      )
      .pipe(tap(() => this.refreshAssets()));
  }

  refreshAssets(): void {
    this.currentPage = 0;
    this.allAssetsLoaded$.next(false);
    this.assets$.next([]);
    this.loadAssets();
  }

  loadAssets(reset = false): void {
    if (this.isLoading$.value) {
      return;
    }

    if (reset) {
      this.allFetchedAssets = [];
      this.currentPage = 0;
      this.allAssetsLoaded$.next(false);
      this.assetsRequest$ = null; // Invalidate cache on reset
    }

    // If a request is already cached and we are not resetting, do nothing.
    // This prevents re-fetching when a component re-initializes.
    if (this.assetsRequest$ && !reset) {
      return;
    }

    if (this.allAssetsLoaded$.value) {
      return;
    }

    this.isLoading$.next(true);
    this.assetsRequest$ = this.fetchAssets().pipe(
      tap(response => {
        this.currentPage++;
        this.allFetchedAssets.push(...response.data);
        this.assets$.next(this.allFetchedAssets);

        if (this.currentPage >= response.totalPages) {
          this.allAssetsLoaded$.next(true);
        } else {
          // If there are more pages, clear the cache so infinite scroll can fetch the next page.
          this.assetsRequest$ = null;
        }
      }),
      catchError(() => {
        this.assetsRequest$ = null; // Allow retry on error
        return of({data: [], count: 0, page: 0, pageSize: 0, totalPages: 0});
      }),
      finalize(() => {
        this.isLoading$.next(false);
      }),
      shareReplay(1), // Cache the response for concurrent subscribers.
    );

    this.assetsRequest$.subscribe();
  }

  private fetchAssets(): Observable<
    PaginationResponseDto<SourceAssetResponseDto>
  > {
    const assetsUrl = `${environment.backendURL}/source_assets/search`;
    const currentFilters = this.filters$.value;

    const body: SourceAssetSearchDto = {
      limit: this.pageSize,
      ...currentFilters,
      offset: this.currentPage * this.pageSize,
    };
    return this.http.post<PaginationResponseDto<SourceAssetResponseDto>>(
      assetsUrl,
      body,
    );
  }

  addAsset(asset: SourceAssetResponseDto) {
    // Prepend the new asset to our local cache and notify subscribers.
    this.allFetchedAssets.unshift(asset);
    this.assets$.next(this.allFetchedAssets);
  }

  deleteAsset(assetId: number) {
    return this.http
      .delete(`${environment.backendURL}/source_assets/${assetId}`)
      .pipe(
        tap(() => {
          // Remove the asset from the local BehaviorSubject to update the UI instantly
          const currentAssets = this.assets$.getValue();
          const updatedAssets = currentAssets.filter(
            asset => asset.id.toString() !== assetId.toString(),
          );
          this.assets$.next(updatedAssets);
        }),
      );
  }
}
