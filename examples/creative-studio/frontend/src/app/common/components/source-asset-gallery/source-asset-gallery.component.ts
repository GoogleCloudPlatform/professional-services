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

import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  OnInit,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import {debounceTime, finalize, fromEvent, Subscription} from 'rxjs';
import {
  SourceAssetService,
  SourceAssetResponseDto,
  SourceAssetSearchDto,
} from '../../services/source-asset.service';
import {AssetTypeEnum} from '../../../admin/source-assets-management/source-asset.model';
import {UserService} from '../../services/user.service';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ConfirmationDialogComponent} from '../confirmation-dialog/confirmation-dialog.component';
import { handleErrorSnackbar, handleSuccessSnackbar } from '../../../utils/handleMessageSnackbar';

@Component({
  selector: 'app-source-asset-gallery',
  templateUrl: './source-asset-gallery.component.html',
  styleUrls: ['./source-asset-gallery.component.scss'],
})
export class SourceAssetGalleryComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Output() assetSelected = new EventEmitter<SourceAssetResponseDto>();
  @Input() filterByType: AssetTypeEnum | null = null;
  @Input() filterByMimeType:
    | 'image/*'
    | 'image/png'
    | 'video/mp4'
    | 'audio/mpeg'
    | null = null;
  @ViewChild('sentinel') private sentinel!: ElementRef<HTMLElement>;

  public assets: SourceAssetResponseDto[] = [];
  public isLoading = true;
  public allAssetsLoaded = false;
  public deletingAssetId: number | null = null;
  // --- Column Management Properties ---
  public columns: SourceAssetResponseDto[][] = [];
  private numColumns = 4;
  private resizeSubscription: Subscription | undefined;

  private assetsSubscription: Subscription | undefined;
  private loadingSubscription: Subscription | undefined;
  private allAssetsLoadedSubscription: Subscription | undefined;
  private scrollObserver!: IntersectionObserver;

  constructor(
    private sourceAssetService: SourceAssetService,
    private userService: UserService,
    private elementRef: ElementRef,
    private ngZone: NgZone,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadingSubscription = this.sourceAssetService.isLoading$.subscribe(
      loading => {
        this.isLoading = loading;
      },
    );

    this.allAssetsLoadedSubscription =
      this.sourceAssetService.allAssetsLoaded.subscribe(loaded => {
        this.allAssetsLoaded = loaded;
      });

    this.assetsSubscription = this.sourceAssetService.assets.subscribe(
      assets => {
        this.assets = assets;
        this.updateColumns(); // Trigger column update when assets change
      },
    );

    const userDetails = this.userService.getUserDetails();
    const filters: SourceAssetSearchDto = {};
    if (userDetails?.email) {
      filters.userEmail = userDetails.email;
    }
    if (this.filterByType) {
      filters.assetType = this.filterByType;
    }
    if (this.filterByMimeType) {
      filters.mimeType = this.filterByMimeType;
    }
    this.sourceAssetService.setFilters(filters);

    // --- Start: Add Resize Handling ---
    this.handleResize();
    this.resizeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => this.handleResize());
    // --- End: Add Resize Handling ---
  }

  ngAfterViewInit(): void {
    this.setupInfiniteScrollObserver();
  }

  ngOnDestroy(): void {
    this.assetsSubscription?.unsubscribe();
    this.loadingSubscription?.unsubscribe();
    this.allAssetsLoadedSubscription?.unsubscribe();
    this.scrollObserver?.disconnect();
    this.resizeSubscription?.unsubscribe();
  }

  private getScrollableContainer(): HTMLElement | null {
    const element = this.elementRef.nativeElement as HTMLElement;
    const overlayPane = element.closest('.cdk-overlay-pane');
    return (
      overlayPane?.querySelector<HTMLElement>('.mat-mdc-dialog-content') || null
    );
  }

  private setupInfiniteScrollObserver(): void {
    if (!this.sentinel) {
      return;
    }

    const scrollRoot = this.getScrollableContainer();

    this.scrollObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.isLoading && !this.allAssetsLoaded) {
          this.ngZone.run(() => {
            this.sourceAssetService.loadAssets();
          });
        }
      },
      {
        root: scrollRoot,
      },
    );

    this.scrollObserver.observe(this.sentinel.nativeElement);
  }

  selectAsset(asset: SourceAssetResponseDto): void {
    this.assetSelected.emit(asset);
  }

  trackByAssetId(index: number, asset: SourceAssetResponseDto): number {
    return asset.id;
  }

  private handleResize(): void {
    const width = window.innerWidth;
    let newNumColumns;
    if (width < 768) {
      // md breakpoint
      newNumColumns = 2;
    } else if (width < 1024) {
      // lg breakpoint
      newNumColumns = 3;
    } else {
      newNumColumns = 4;
    }

    if (newNumColumns !== this.numColumns) {
      this.numColumns = newNumColumns;
      this.updateColumns();
    }
  }

  private updateColumns(): void {
    this.columns = Array.from({length: this.numColumns}, () => []);
    this.assets.forEach((asset, index) => {
      this.columns[index % this.numColumns].push(asset);
    });
  }

  confirmDelete(asset: SourceAssetResponseDto, event: MouseEvent): void {
    event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete "${asset.originalFilename}"? This action cannot be undone.`,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // 3. Set the ID of the asset we are deleting
        this.deletingAssetId = asset.id;

        this.sourceAssetService
          .deleteAsset(asset.id)
          .pipe(
            // 4. Use finalize to clear the ID when the request is complete
            finalize(() => (this.deletingAssetId = null)),
          )
          .subscribe({
            next: () => {
              handleSuccessSnackbar(this.snackBar, 'Asset deleted successfully.');
            },
            error: err => {
              handleErrorSnackbar(this.snackBar, err, 'Delete asset');
              console.error(err);
            },
          });
      }
    });
  }
}
