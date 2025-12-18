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

import {Component, OnDestroy} from '@angular/core';
import {ActivatedRoute, NavigationExtras, Router} from '@angular/router';
import {first, Subscription} from 'rxjs';
import {
  MediaItem,
} from '../../common/models/media-item.model';
import {GalleryService} from '../gallery.service';
import {LoadingService} from '../../common/services/loading.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CreatePromptMediaDto} from '../../common/models/prompt.model';
import {AuthService} from '../../common/services/auth.service';
import {SourceMediaItemLink} from '../../common/models/search.model';
import {MimeTypeEnum} from '../../fun-templates/media-template.model';
import {EnrichedSourceAsset} from '../../common/models/media-item.model';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import { handleErrorSnackbar, handleSuccessSnackbar } from '../../utils/handleMessageSnackbar';

@Component({
  selector: 'app-media-detail',
  templateUrl: './media-detail.component.html',
  styleUrls: ['./media-detail.component.scss'],
})
export class MediaDetailComponent implements OnDestroy {
  private routeSub?: Subscription;
  private mediaSub?: Subscription;

  public isLoading = true;
  public mediaItem: MediaItem | undefined;
  public isAdmin = false;
  public initialSlideIndex = 0;
  promptJson: CreatePromptMediaDto | undefined;
  isPromptExpanded = false;
  public selectedAssetForLightbox: MediaItem | null = null;
  public lightboxInitialIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private galleryService: GalleryService,
    private loadingService: LoadingService,
    private _snackBar: MatSnackBar,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
  ) {
    // Check if user is admin
    this.isAdmin = this.authService.isUserAdmin() ?? false;

    // Get the media item from the router state
    this.mediaItem =
      this.router.getCurrentNavigation()?.extras.state?.['mediaItem'];

    if (this.mediaItem) {
      // If we have the media item, we don't need to load it
      this.loadingService.hide();
      this.isLoading = false;
      this.readInitialIndexFromUrl();
      this.parsePrompt();
    } else {
      // If not, fetch the media item using the ID from the route params
      this.fetchMediaItem();
    }
  }

  fetchMediaItem() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchMediaDetails(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.mediaSub?.unsubscribe();
  }

  fetchMediaDetails(id: string): void {
    this.mediaSub = this.galleryService.getMedia(id).subscribe({
      next: data => {
        this.mediaItem = data;
        this.isLoading = false;
        this.loadingService.hide();
        this.readInitialIndexFromUrl();
        this.parsePrompt();
        console.log('fetchMediaDetails - mediaItem', this.mediaItem);
      },
      error: err => {
        console.error('Failed to fetch media details', err);
        this.isLoading = false;
        this.loadingService.hide();
      },
    });
  }

  private parsePrompt(): void {
    if (!this.mediaItem?.prompt) {
      this.promptJson = undefined;
      return;
    }
    try {
      if (typeof this.mediaItem.prompt === 'string') {
        const parsed = JSON.parse(this.mediaItem.prompt);
        if (parsed && typeof parsed === 'object') {
          this.promptJson = parsed;
        }
      } else if (typeof this.mediaItem.prompt === 'object') {
        // It's already an object, just cast it.
        this.promptJson = this.mediaItem.prompt as CreatePromptMediaDto;
      }
    } catch (e) {
      // Not a valid JSON string.
      this.promptJson = undefined;
    }
  }

  private readInitialIndexFromUrl(): void {
    const indexStr = this.route.snapshot.queryParamMap.get('img_index');
    if (indexStr) {
      const index = parseInt(indexStr, 10);
      if (
        !isNaN(index) &&
        index >= 0 &&
        index < (this.mediaItem?.presignedUrls?.length || 0)
      ) {
        this.initialSlideIndex = index;
      }
    }
  }

  /**
   * Gets the prompt, formatted as a beautified JSON string if it's a
   * valid JSON object or stringified JSON. Otherwise, returns the original prompt.
   */
  get formattedPrompt(): string {
    if (!this.mediaItem?.prompt) {
      return 'N/A';
    }

    if (this.promptJson) {
      return JSON.stringify(this.promptJson, null, 2);
    }

    // Return the original string if it's not an object or valid stringified JSON.
    return this.mediaItem.prompt;
  }

  /**
   * Converts a GCS URI (gs://...) to a clickable console URL.
   * @param uri The GCS URI.
   * @returns A URL to the GCS object in the Google Cloud Console.
   */
  public getGcsLink(uri: string): string {
    if (!uri || !uri.startsWith('gs://')) {
      return '#';
    }
    return `https://console.cloud.google.com/storage/browser/${uri.substring(5)}`;
  }

  /**
   * Creates a new template from the current media item.
   * This is intended for admin users.
   */
  createTemplateFromMediaItem(): void {
    if (!this.mediaItem?.id) {
      return;
    }

    this.loadingService.show();

    // Note: The 'createTemplateFromMediaItem' method should be implemented in a relevant service (e.g., TemplateService or GalleryService).
    // It should perform a POST request to the `/from-media-item/{media_item_id}` endpoint.
    this.galleryService
      .createTemplateFromMediaItem(this.mediaItem.id.toString())
      .pipe(first())
      .subscribe({
        next: (newTemplate: {id: string}) => {
          this.loadingService.hide();
          handleSuccessSnackbar(this._snackBar, 'Template created successfully!');
          this.router.navigate(['/templates/edit', newTemplate.id]);
        },
        error: err => {
          this.loadingService.hide();
          console.error('Failed to create template from media item', err);
          handleErrorSnackbar(this._snackBar, err, 'Create template');
        },
      });
  }

  togglePromptExpansion(): void {
    this.isPromptExpanded = !this.isPromptExpanded;
  }

  generateWithThisImage(index: number): void {
    if (!this.mediaItem) {
      return;
    }

    const sourceMediaItem: SourceMediaItemLink = {
      mediaItemId: this.mediaItem.id,
      mediaIndex: index,
      role: 'input',
    };

    const navigationExtras: NavigationExtras = {
      state: {
        remixState: {
          sourceMediaItems: [sourceMediaItem],
          prompt: this.mediaItem.originalPrompt,
          previewUrl: this.mediaItem.presignedUrls?.[index],
        },
      },
    };
    this.router.navigate(['/'], navigationExtras);
  }

  generateVideoWithImage(event: {role: 'start' | 'end'; index: number}): void {
    if (!this.mediaItem) {
      return;
    }

    const sourceMediaItem: SourceMediaItemLink = {
      mediaItemId: this.mediaItem.id,
      mediaIndex: event.index,
      role: event.role === 'start' ? 'start_frame' : 'end_frame',
    };

    const remixState = {
      prompt: this.mediaItem.originalPrompt,
      sourceMediaItems: [sourceMediaItem],
      startImagePreviewUrl:
        event.role === 'start'
          ? this.mediaItem.presignedUrls?.[event.index]
          : undefined,
      endImagePreviewUrl:
        event.role === 'end'
          ? this.mediaItem.presignedUrls?.[event.index]
          : undefined,
    };

    const navigationExtras: NavigationExtras = {
      state: {remixState},
    };
    this.router.navigate(['/video'], navigationExtras);
  }

  sendToVto(index: number): void {
    if (!this.mediaItem) {
      return;
    }

    const navigationExtras: NavigationExtras = {
      state: {
        remixState: {
          modelImageAssetId: this.mediaItem.id,
          modelImagePreviewUrl: this.mediaItem.presignedUrls?.[index],
          modelImageMediaIndex: index,
          modelImageGcsUri: this.mediaItem.gcsUris?.[index],
        },
      },
    };
    this.router.navigate(['/vto'], navigationExtras);
  }

  handleExtendWithAi(event: {
    mediaItem: MediaItem;
    selectedIndex: number;
  }): void {
    if (!this.mediaItem) {
      return;
    }

    const sourceMediaItem: SourceMediaItemLink = {
      mediaItemId: this.mediaItem.id,
      mediaIndex: event.selectedIndex,
      role: 'video_extension_source',
    };

    const remixState = {
      prompt: this.mediaItem.originalPrompt,
      sourceMediaItems: [sourceMediaItem],
      // Since it's a video, we can use the thumbnail as a preview.
      startImagePreviewUrl:
        this.mediaItem.presignedThumbnailUrls?.[event.selectedIndex],
      generationModel: 'veo-2.0-generate-001', // Switch to Veo 2 for video input
    };

    const navigationExtras: NavigationExtras = {
      state: {remixState},
    };
    this.router.navigate(['/video'], navigationExtras);
  }

  handleConcatenate(event: {
    mediaItem: MediaItem;
    selectedIndex: number;
  }): void {
    if (!this.mediaItem) {
      return;
    }

    const sourceMediaItem: SourceMediaItemLink = {
      mediaItemId: this.mediaItem.id,
      mediaIndex: event.selectedIndex,
      role: 'concatenation_source', // Generic role for concatenation
    };

    const remixState = {
      sourceMediaItems: [sourceMediaItem],
      startImagePreviewUrl:
        this.mediaItem.presignedThumbnailUrls?.[event.selectedIndex],
      startConcatenation: true,
    };

    this.router.navigate(['/video'], {state: {remixState}});
  }

  public openSourceAssetInLightbox(
    sourceAsset: EnrichedSourceAsset,
    event: MouseEvent,
  ): void {
    event.preventDefault();
    event.stopPropagation();

    const isVideo =
      sourceAsset.mimeType?.startsWith('video/') === true ||
      sourceAsset.presignedUrl.includes('.mp4');

    if (isVideo) {
      // PhotoSwipe lightbox doesn't support videos, so open in a new tab.
      window.open(sourceAsset.presignedUrl, '_blank');
      return;
    }

    // Existing logic for images
    // Construct a MediaItem-like object for the lightbox
    const mediaItem: MediaItem = {
      id: Number(sourceAsset.sourceAssetId),
      mimeType: MimeTypeEnum.IMAGE,
      presignedUrls: [sourceAsset.presignedUrl],
      presignedThumbnailUrls: [sourceAsset.presignedThumbnailUrl],
      originalPrompt: `Input: ${sourceAsset.role}`,
      gcsUris: [sourceAsset.gcsUri],
    };
    this.selectedAssetForLightbox = mediaItem;
    this.lightboxInitialIndex = 0;
  }

  public closeLightbox(): void {
    this.selectedAssetForLightbox = null;
  }

  public getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
