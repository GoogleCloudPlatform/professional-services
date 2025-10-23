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

import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {firstValueFrom} from 'rxjs';
import {SourceAssetsService as SourceAssetAdminService} from './source-assets.service';
import {AssetScopeEnum, AssetTypeEnum} from './source-asset.model';
import {SourceAssetFormComponent} from './source-asset-form/source-asset-form.component';
import {ToastMessageComponent} from '../../common/components/toast-message/toast-message.component';
import {SourceAssetResponseDto} from '../../common/services/source-asset.service';
import {SourceAssetUploadFormComponent} from './source-asset-upload-form/source-asset-upload-form.component';

@Component({
  selector: 'app-source-assets-management',
  templateUrl: './source-assets-management.component.html',
  styleUrls: ['./source-assets-management.component.scss'],
})
export class SourceAssetsManagementComponent implements OnInit {
  displayedColumns: string[] = [
    'thumbnail',
    'originalFilename',
    'assetType',
    'createdAt',
    'actions',
  ];
  dataSource: MatTableDataSource<SourceAssetResponseDto>;
  isLoading = true;
  errorLoading: string | null = null;

  // Filter properties
  filterName = '';
  filterScope: AssetScopeEnum | null = null;
  filterAssetType: AssetTypeEnum | null = null;
  assetScopes = Object.values(AssetScopeEnum);
  assetTypes = Object.values(AssetTypeEnum);

  // Pagination properties
  totalAssets = 0;
  limit = 10;
  currentPageIndex = 0;
  // Stores the cursor for the START of each page.
  // pageCursors[0] is null
  // pageCursors[i] is the last document of page i-1
  private pageCursors: Array<string | null | undefined> = [null];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private sourceAssetService: SourceAssetAdminService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    this.dataSource = new MatTableDataSource<SourceAssetResponseDto>([]);
  }

  ngOnInit(): void {
    this.fetchAssets();
  }

  async fetchPage(targetPageIndex: number) {
    this.isLoading = true;

    // Find the most recent page we have a cursor for that is before our target.
    let startPageIndex = 0;
    for (let i = targetPageIndex; i >= 0; i--) {
      if (this.pageCursors[i] !== undefined) {
        startPageIndex = i;
        break;
      }
    }

    // Get the cursor for our starting point.
    let cursor: string | null | undefined = this.pageCursors[startPageIndex];

    const filters = {
      originalFilename: this.filterName.trim() || undefined,
      scope: this.filterScope || undefined,
      assetType: this.filterAssetType || undefined,
    };

    try {
      // Walk from the known page to the target page, fetching and discarding pages
      for (let i = startPageIndex; i < targetPageIndex; i++) {
        const response = await firstValueFrom(
          this.sourceAssetService.searchSourceAssets(
            filters,
            this.limit,
            cursor ?? undefined,
          ),
        );

        if (!response || response.data.length === 0) {
          this.isLoading = false;
          this.dataSource.data = []; // Show empty table
          return;
        }
        cursor = response.nextPageCursor ?? null;
        this.pageCursors[i + 1] = cursor; // Cache the new cursor
      }

      // Now we have the correct cursor to fetch the target page
      const finalResponse = await firstValueFrom(
        this.sourceAssetService.searchSourceAssets(
          filters,
          this.limit,
          cursor ?? undefined,
        ),
      );

      this.dataSource.data = finalResponse.data;
      this.totalAssets = finalResponse.count;
      this.currentPageIndex = targetPageIndex;

      // Cache the cursor for the *next* page if it exists and we don't have it
      if (
        finalResponse.nextPageCursor &&
        this.pageCursors[targetPageIndex + 1] === undefined
      ) {
        this.pageCursors[targetPageIndex + 1] = finalResponse.nextPageCursor;
      }
    } catch (err) {
      this.errorLoading = 'Failed to load assets.';
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  fetchAssets() {
    this.resetPaginationAndFetch();
  }

  private resetPaginationAndFetch() {
    this.currentPageIndex = 0;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.pageCursors = [null];
    this.fetchPage(0);
  }

  createAsset(): void {
    const dialogRef = this.dialog.open(SourceAssetUploadFormComponent, {
      width: '500px',
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .subscribe((result: SourceAssetResponseDto | null) => {
        if (result) {
          this.fetchAssets();
          this.snackBar.openFromComponent(ToastMessageComponent, {
            panelClass: ['green-toast'],
            duration: 3000,
            data: {
              text: `Asset "${result.originalFilename}" uploaded successfully`,
              matIcon: 'check_circle',
            },
          });
        }
      });
  }

  editAsset(asset: SourceAssetResponseDto): void {
    const dialogRef = this.dialog.open(SourceAssetFormComponent, {
      width: '800px',
      data: {asset: {...asset}},
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sourceAssetService.updateSourceAsset(result).subscribe({
          next: () => {
            this.fetchAssets();
            this.snackBar.openFromComponent(ToastMessageComponent, {
              panelClass: ['green-toast'],
              duration: 3000,
              data: {
                text: 'Asset updated successfully',
                matIcon: 'check_circle',
              },
            });
          },
          error: (err: Error) => {
            this.snackBar.openFromComponent(ToastMessageComponent, {
              panelClass: ['red-toast'],
              duration: 5000,
              data: {text: 'Error updating asset', matIcon: 'error'},
            });
          },
        });
      }
    });
  }

  deleteAsset(asset: SourceAssetResponseDto): void {
    if (
      asset.id &&
      confirm(
        `Are you sure you want to delete asset "${asset.originalFilename}"?`,
      )
    ) {
      this.sourceAssetService.deleteSourceAsset(asset.id).subscribe({
        next: () => {
          this.fetchAssets();
          this.snackBar.openFromComponent(ToastMessageComponent, {
            panelClass: ['green-toast'],
            duration: 3000,
            data: {text: 'Asset deleted successfully', matIcon: 'check_circle'},
          });
        },
        error: (err: Error) => {
          this.snackBar.openFromComponent(ToastMessageComponent, {
            panelClass: ['red-toast'],
            duration: 5000,
            data: {text: 'Error deleting asset', matIcon: 'error'},
          });
        },
      });
    }
  }

  handlePageEvent(event: PageEvent) {
    // If page size changes, we must reset everything.
    if (this.limit !== event.pageSize) {
      this.limit = event.pageSize;
      this.resetPaginationAndFetch();
      return;
    }
    this.fetchPage(event.pageIndex);
  }
}
