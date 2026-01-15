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
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {MediaItem} from '../../models/media-item.model';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import {Clipboard} from '@angular/cdk/clipboard';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, Router} from '@angular/router';
import {EventEmitter} from '@angular/core';
import {Location} from '@angular/common';
import { handleErrorSnackbar, handleSuccessSnackbar } from '../../../utils/handleMessageSnackbar';

@Component({
  selector: 'app-media-lightbox',
  templateUrl: './media-lightbox.component.html',
  styleUrls: ['./media-lightbox.component.scss'],
})
export class MediaLightboxComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @Input() mediaItem: MediaItem | undefined;
  @Input() initialIndex = 0;
  @Input() showSeeMoreInfoButton = false;
  @Input() showShareButton = true;
  @Input() showDownloadButton = true;
  @Input() showEditButton = false;
  @Input() showGenerateVideoButton = false;
  @Input() showVtoButton = false;
  @Output() editClicked = new EventEmitter<number>();
  @Output() generateVideoClicked = new EventEmitter<{
    role: 'start' | 'end';
    index: number;
  }>();
  @Output() sendToVtoClicked = new EventEmitter<number>();
  @Output() extendWithAiClicked = new EventEmitter<{
    mediaItem: MediaItem;
    selectedIndex: number;
  }>();
  @Output() concatenateClicked = new EventEmitter<{
    mediaItem: MediaItem;
    selectedIndex: number;
  }>();

  selectedIndex = 0;
  selectedUrl: string | undefined;

  // Properties for NgOptimizedImage
  imageWidth = 1920; // A sensible default max width
  imageHeight = 1920;

  public isShareMenuOpen = false;
  public isDownloading = false;
  private lightbox: PhotoSwipeLightbox | undefined;

  @ViewChild('audioPlayer') audioPlayerRef!: ElementRef<HTMLAudioElement>;
  isPlaying = false;
  currentTime = '0:00';
  duration = '0:00';
  progressValue = 0;

  constructor(
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
  ) {}

  ngAfterViewInit(): void {
    this.initializePhotoSwipe();
  }

  ngOnDestroy(): void {
    this.lightbox?.destroy();
    this.lightbox = undefined;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mediaItem'] || changes['initialIndex']) {
      this.initialize();
      // If switching media types, ensure lightbox is destroyed for non-images
      if (this.isAudio || this.isVideo) {
        this.lightbox?.destroy();
        this.lightbox = undefined;
      } else {
        if (this.lightbox) {
          this.lightbox.destroy();
        }
        this.initializePhotoSwipe();
      }
    }
  }

  private initialize(): void {
    if (this.mediaItem?.presignedUrls?.length) {
      const indexFromQuery = this.route.snapshot.queryParamMap.get('img_index');
      const queryIndex = indexFromQuery ? parseInt(indexFromQuery, 10) : -1;

      let startIndex = this.initialIndex;
      if (queryIndex >= 0 && queryIndex < this.mediaItem.presignedUrls.length) {
        startIndex = queryIndex;
      }

      this.selectedIndex =
        startIndex < this.mediaItem.presignedUrls.length ? startIndex : 0;
      this.selectedUrl = this.mediaItem.presignedUrls[this.selectedIndex];
      this.updateImageDimensions();
    } else {
      this.selectedIndex = 0;
      this.selectedUrl = undefined;
    }
  }

  private initializePhotoSwipe(): void {
    if (this.mediaItem?.presignedUrls && !this.isVideo) {
      this.lightbox = new PhotoSwipeLightbox({
        dataSource: this.mediaItem.presignedUrls.map(url => ({
          src: url,
          width: this.imageWidth,
          height: this.imageHeight,
          alt: this.mediaItem?.originalPrompt,
        })),
        pswpModule: () => import('photoswipe'),
      });

      this.lightbox.on('close', () => {
        this.isShareMenuOpen = false;
      });

      this.lightbox.on('change', () => {
        if (this.lightbox?.pswp) {
          this.selectMedia(this.lightbox.pswp.currIndex);
        }
      });

      this.lightbox.init();
    } else {
      this.lightbox?.destroy();
      this.lightbox = undefined;
    }
  }

  private updateImageDimensions(): void {
    if (this.mediaItem) {
      const aspectRatioStr = this.mediaItem.aspectRatio || '1:1';
      const [w, h] = aspectRatioStr.split(':').map(Number);
      this.imageHeight = (h / w) * this.imageWidth;
    }
  }

  toggleShareMenu(): void {
    this.isShareMenuOpen = !this.isShareMenuOpen;
  }

  get currentImageUrl(): string {
    return this.selectedUrl || '';
  }

  openInNewTab(): void {
    if (!this.selectedUrl || this.isDownloading) {
      return;
    }

    this.isDownloading = true;

    const link = document.createElement('a');
    link.href = this.selectedUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      this.isDownloading = false;
    }, 200);
  }

  shareTo(
    platform:
      | 'facebook'
      | 'twitter'
      | 'pinterest'
      | 'reddit'
      | 'whatsapp'
      | 'linkedin'
      | 'telegram',
  ): void {
    const url = this.getShareUrl(platform);
    window.open(url, '_blank');
    this.isShareMenuOpen = false;
  }

  getShareUrl(
    platform:
      | 'facebook'
      | 'twitter'
      | 'pinterest'
      | 'reddit'
      | 'whatsapp'
      | 'linkedin'
      | 'telegram',
  ): string {
    const url = encodeURIComponent(this.currentImageUrl);
    const text = encodeURIComponent(
      this.mediaItem?.originalPrompt || 'Check out this image!',
    );
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
      case 'pinterest':
        return `https://pinterest.com/pin/create/button/?url=${window.location.href}&media=${url}&description=${text}`;
      case 'reddit':
        return `https://reddit.com/submit?url=${url}&title=${text}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${text}%20${url}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      case 'telegram':
        return `https://t.me/share/url?url=${url}&text=${text}`;
    }
  }

  copyLink(): void {
    if (!this.mediaItem?.id) {
      handleErrorSnackbar(this.snackBar, { message: 'Cannot generate link: Media item has no ID.' }, 'Copy Link');
      return;
    }

    // Create a URL tree with the path and query parameters for the specific image
    const urlTree = this.router.createUrlTree(['/gallery', this.mediaItem.id], {
      queryParams: {
        img_index: this.selectedIndex > 0 ? this.selectedIndex : null,
      },
    });
    // Serialize the tree to a relative path string (e.g., /gallery/123?img_index=2)
    const relativeUrl = this.router.serializeUrl(urlTree);
    // Combine with the window's origin to get the full, absolute URL
    const fullUrl = `${window.location.origin}${relativeUrl}`;

    this.clipboard.copy(fullUrl);
    handleSuccessSnackbar(this.snackBar, 'Link copied to clipboard!');
    this.isShareMenuOpen = false;
  }

  openPhotoSwipe(index: number): void {
    if (this.lightbox) {
      this.lightbox.loadAndOpen(index);
    }
  }

  selectMedia(index: number): void {
    if (this.mediaItem?.presignedUrls) {
      this.selectedIndex = index;
      this.selectedUrl = this.mediaItem.presignedUrls[index];
      this.updateUrlWithImageIndex(index);

      // If Audio, we need to reload the player
      if (this.isAudio) {
        this.resetAudioState();
        // Allow DOM to update src, then load
        setTimeout(() => {
          if (this.audioPlayerRef) {
            this.audioPlayerRef.nativeElement.load();
            this.togglePlay(); // Auto-play on switch
          }
        }, 50);
      }
    }
  }

  private updateUrlWithImageIndex(index: number): void {
    // This component is used on multiple pages (VTO, Home, Gallery).
    // We should ONLY manipulate the URL when on the gallery detail page.
    // Otherwise, it can cause unintended navigations and state loss.
    console.log('this.router.url', this.router.url);
    if (!this.router.url.startsWith('/gallery/')) {
      // MediaLightbox: Skipping URL update because we are not on a gallery detail page.
      return;
    }
    const url = this.router
      .createUrlTree([], {
        relativeTo: this.route,
        // If index is 0, we can remove the query param.
        queryParams: {img_index: index > 0 ? index : null},
        queryParamsHandling: 'merge',
      })
      .toString();

    this.location.replaceState(url);
  }

  seeMoreInfo(): void {
    if (this.mediaItem?.id) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/gallery', this.mediaItem.id], {
          queryParams: {
            img_index: this.selectedIndex > 0 ? this.selectedIndex : null,
          },
        }),
      );
      window.open(url, '_blank');
    }
  }

  get isVideo(): boolean {
    return this.mediaItem?.mimeType?.startsWith('video/') ?? false;
  }

  get isAudio(): boolean {
    return this.mediaItem?.mimeType?.startsWith('audio/') ?? false;
  }

  get posterUrl(): string | undefined {
    if (this.isVideo && this.mediaItem?.presignedThumbnailUrls?.length) {
      return this.mediaItem.presignedThumbnailUrls[this.selectedIndex];
    }
    return undefined;
  }

  get aspectRatioClass(): string {
    // For Audio, we just want a nice container, aspect-video works well for the player shape
    if (this.isAudio) return 'aspect-video h-auto';

    const ratio = this.mediaItem?.aspectRatio || this.mediaItem?.aspect;
    switch (ratio) {
      case '1:1':
        return 'aspect-square';
      case '16:9':
        return 'aspect-video';
      case null:
      case undefined:
        return 'aspect-square';
      default:
        return `aspect-[${ratio.replace(':', '/')}]`;
    }
  }

  // --- AUDIO PLAYER LOGIC ---
  togglePlay() {
    const audio = this.audioPlayerRef?.nativeElement;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      this.isPlaying = true;
    } else {
      audio.pause();
      this.isPlaying = false;
    }
  }

  onTimeUpdate() {
    const audio = this.audioPlayerRef?.nativeElement;
    if (!audio) return;

    if (audio.duration) {
      this.progressValue = (audio.currentTime / audio.duration) * 100;
      this.currentTime = this.formatTime(audio.currentTime);
    }
  }

  seek(value: number) {
    const audio = this.audioPlayerRef?.nativeElement;
    if (!audio) return;

    if (audio.duration) {
      audio.currentTime = (value / 100) * audio.duration;
    }
  }

  onAudioLoaded() {
    const audio = this.audioPlayerRef?.nativeElement;
    if (!audio) return;

    this.isPlaying = !audio.paused;
    this.duration = this.formatTime(audio.duration);
  }

  onAudioEnded() {
    this.isPlaying = false;
    this.progressValue = 0;
    this.currentTime = '0:00';
  }

  private resetAudioState() {
    this.isPlaying = false;
    this.progressValue = 0;
    this.currentTime = '0:00';
    this.duration = '0:00';
  }

  private formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  onEditClick(): void {
    this.editClicked.emit(this.selectedIndex);
  }

  onGenerateVideoClick(role: 'start' | 'end'): void {
    this.generateVideoClicked.emit({role, index: this.selectedIndex});
  }

  onSendToVtoClick(): void {
    this.sendToVtoClicked.emit(this.selectedIndex);
  }

  onExtendWithAiClick() {
    if (this.mediaItem) {
      this.extendWithAiClicked.emit({
        mediaItem: this.mediaItem,
        selectedIndex: this.selectedIndex,
      });
    }
  }

  onConcatenateClick() {
    if (this.mediaItem) {
      this.concatenateClicked.emit({
        mediaItem: this.mediaItem,
        selectedIndex: this.selectedIndex,
      });
    }
  }
}
