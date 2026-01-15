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
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MediaItemSelection } from '../../common/components/image-selector/image-selector.component';
import { JobStatus, MediaItem } from '../../common/models/media-item.model';
import { GallerySearchDto } from '../../common/models/search.model';
import { UserService } from '../../common/services/user.service';
import { MODEL_CONFIGS } from '../../common/config/model-config';
import { GalleryService } from '../gallery.service';

@Component({
  selector: 'app-media-gallery',
  templateUrl: './media-gallery.component.html',
  styleUrl: './media-gallery.component.scss',
})
export class MediaGalleryComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() mediaItemSelected = new EventEmitter<MediaItemSelection>();
  @Input() filterByType:
    | 'image/png'
    | 'video/mp4'
    | 'audio/mpeg'
    | 'audio/wav'
    | null = null;
  @Input() statusFilter: JobStatus | null = JobStatus.COMPLETED;

  public images: MediaItem[] = [];
  public columns: MediaItem[][] = [];
  allImagesLoaded = false;
  public isLoading = true;
  private imagesSubscription: Subscription | undefined;
  private allImagesLoadedSubscription: Subscription | undefined;
  private loadingSubscription: Subscription | undefined;
  private resizeSubscription: Subscription | undefined;
  private _hostVisibilityObserver!: IntersectionObserver;
  private _scrollObserver!: IntersectionObserver;
  private numColumns = 4;
  public userEmailFilter = '';
  public mediaTypeFilter = '';
  public generationModelFilter = '';
  public showOnlyMyMedia = false;
  public generationModels = MODEL_CONFIGS.map(config => ({
    value: config.value,
    viewValue: config.viewValue.replace('\n', ''), // Remove newlines for dropdown
  }));
  private autoSlideIntervals: { [id: string]: any } = {};
  public currentImageIndices: { [id: string]: number } = {};
  public hoveredVideoId: number | null = null;
  public hoveredAudioId: number | null = null;

  constructor(
    private galleryService: GalleryService,
    private sanitizer: DomSanitizer,
    public matIconRegistry: MatIconRegistry,
    private userService: UserService,
    private elementRef: ElementRef,
    private ngZone: NgZone,
  ) {
    this.matIconRegistry
      .addSvgIcon(
        'mobile-white-gemini-spark-icon',
        this.setPath(`${this.path}/mobile-white-gemini-spark-icon.svg`),
      )
      .addSvgIcon(
        'gemini-spark-icon',
        this.setPath(`${this.path}/gemini-spark-icon.svg`),
      );
  }

  @ViewChild('sentinel') private _sentinel!: ElementRef<HTMLElement>;

  private path = '../../assets/images';

  private setPath(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit(): void {
    this.mediaTypeFilter = this.filterByType || '';
    this.searchTerm(); // Set initial filters
    this.loadingSubscription = this.galleryService.isLoading$.subscribe(
      loading => {
        this.isLoading = loading;
      },
    );

    this.imagesSubscription = this.galleryService.images$.subscribe(images => {
      if (images) {
        // Find only the new images that have been added
        const newImages = images.slice(this.images.length);
        newImages.forEach(image => {
          if (this.currentImageIndices[image.id] === undefined) {
            this.currentImageIndices[image.id] = 0;
          }
          if (!this.autoSlideIntervals[image.id]) {
            this.startAutoSlide(image);
          }
        });
        this.images = images;
        this.updateColumns();
      }
    });

    this.allImagesLoadedSubscription =
      this.galleryService.allImagesLoaded.subscribe(loaded => {
        this.allImagesLoaded = loaded;
      });

    this.handleResize();
    this.resizeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => this.handleResize());
  }

  ngAfterViewInit(): void {
    // This observer's job is to wait until the component's host element is actually
    // visible in the DOM. This is important for components inside lazy-loaded tabs.
    this._hostVisibilityObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Now that the component is visible, we can safely find its scrollable parent
        // and set up the observer for infinite scrolling.
        this.setupInfiniteScrollObserver();
        // We only need to do this once.
        this._hostVisibilityObserver.disconnect();
      }
    });
    this._hostVisibilityObserver.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.imagesSubscription?.unsubscribe();
    this.loadingSubscription?.unsubscribe();
    this.allImagesLoadedSubscription?.unsubscribe();
    this.resizeSubscription?.unsubscribe();
    this._hostVisibilityObserver?.disconnect();
    this._scrollObserver?.disconnect();
    Object.values(this.autoSlideIntervals).forEach(clearInterval);
  }

  private getScrollableContainer(): HTMLElement | null {
    const element = this.elementRef.nativeElement as HTMLElement;
    // When inside a dialog, `elementRef.nativeElement` might not have a `parentElement`
    // immediately available, especially when inside other components like MatTabs.
    // A more robust way is to find the dialog's overlay pane and query within it.
    const overlayPane = element.closest('.cdk-overlay-pane');
    return (
      overlayPane?.querySelector<HTMLElement>('.mat-mdc-dialog-content') || null
    );
  }

  private setupInfiniteScrollObserver(): void {
    if (!this._sentinel) {
      return;
    }

    const scrollRoot = this.getScrollableContainer();

    this._scrollObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.isLoading && !this.allImagesLoaded) {
          this.ngZone.run(() => {
            this.galleryService.loadGallery();
          });
        }
      },
      {
        root: scrollRoot,
      },
    );

    this._scrollObserver.observe(this._sentinel.nativeElement);
  }

  public trackByImage(index: number, image: MediaItem): number {
    return image.id;
  }

  public getCurrentImageUrl(image: MediaItem): string {
    const index = this.currentImageIndices[image.id] || 0;
    return image.presignedUrls?.[index] || '';
  }

  public nextImage(
    imageId: number,
    urlsLength: number,
    event?: MouseEvent,
  ): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
      this.stopAutoSlide(imageId);
    }
    const currentIndex = this.currentImageIndices[imageId] || 0;
    this.currentImageIndices[imageId] = (currentIndex + 1) % urlsLength;
  }

  public prevImage(
    imageId: number,
    urlsLength: number,
    event?: MouseEvent,
  ): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
      this.stopAutoSlide(imageId);
    }
    const currentIndex = this.currentImageIndices[imageId] || 0;
    this.currentImageIndices[imageId] =
      (currentIndex - 1 + urlsLength) % urlsLength;
  }

  get isSelectionMode(): boolean {
    return this.mediaItemSelected.observed;
  }

  selectMedia(mediaItem: MediaItem, event: MouseEvent) {
    if (this.isSelectionMode) {
      const selectedIndex = this.currentImageIndices[mediaItem.id] || 0;
      // Emit the full media item and the selected index
      this.mediaItemSelected.emit({ mediaItem, selectedIndex });
    }
  }

  public onMouseEnter(media: MediaItem): void {
    if (media.mimeType === 'video/mp4') this.playVideo(media.id);

    // 2. ADD THIS CHECK
    if (media.mimeType?.startsWith('audio/')) this.playAudio(media.id);

    this.stopAutoSlide(media.id);
  }

  public onMouseLeave(media: MediaItem): void {
    if (media.mimeType === 'video/mp4') this.stopVideo();

    // 3. ADD THIS CHECK
    if (media.mimeType?.startsWith('audio/')) this.stopAudio();

    this.startAutoSlide(media);
  }

  public playAudio(mediaId: number): void {
    this.hoveredAudioId = mediaId;
  }

  public stopAudio(): void {
    this.hoveredAudioId = null;
  }

  public getShortPrompt(
    prompt: string | undefined | null,
    wordLimit = 20,
  ): string {
    if (!prompt) return 'Generated media';

    let textToTruncate = prompt;

    // Prompts can sometimes be stringified JSON.
    try {
      const parsedPrompt = JSON.parse(prompt);
      if (
        parsedPrompt &&
        typeof parsedPrompt === 'object' &&
        parsedPrompt.prompt_name
      ) {
        textToTruncate = parsedPrompt.prompt_name;
      }
    } catch (e) {
      // It's not JSON, so we use the prompt as is.
    }

    const words = textToTruncate.split(/\s+/);
    if (words.length > wordLimit)
      return words.slice(0, wordLimit).join(' ') + '...';
    return textToTruncate;
  }

  public playVideo(mediaId: number): void {
    this.hoveredVideoId = mediaId;
  }

  public stopVideo(): void {
    this.hoveredVideoId = null;
  }

  public onShowOnlyMyMediaChange(event: MatCheckboxChange): void {
    if (event.checked) {
      const userDetails = this.userService.getUserDetails();
      if (userDetails?.email) this.userEmailFilter = userDetails.email;
    } else this.userEmailFilter = '';
  }

  public startAutoSlide(image: MediaItem): void {
    if (image.presignedUrls && image.presignedUrls.length > 1) {
      if (this.autoSlideIntervals[image.id]) {
        return;
      }
      this.autoSlideIntervals[image.id] = setInterval(() => {
        this.nextImage(image.id, image.presignedUrls!.length);
      }, 3000);
    }
  }

  public stopAutoSlide(imageId: number): void {
    if (this.autoSlideIntervals[imageId]) {
      clearInterval(this.autoSlideIntervals[imageId]);
      delete this.autoSlideIntervals[imageId];
    }
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
    this.columns = Array.from({ length: this.numColumns }, () => []);
    this.images.forEach((image, index) => {
      this.columns[index % this.numColumns].push(image);
    });
  }

  public searchTerm(): void {
    // Reset local component state for a new search to show the main loader
    this.images = [];

    const filters: GallerySearchDto = { limit: 20 };
    if (this.userEmailFilter) {
      filters['userEmail'] = this.userEmailFilter;
    }
    const mimeType = this.filterByType
      ? this.filterByType
      : this.isSelectionMode
        ? null
        : this.mediaTypeFilter;
    if (mimeType) {
      filters['mimeType'] = mimeType;
    }
    if (this.generationModelFilter && !this.isSelectionMode) {
      filters['model'] = this.generationModelFilter;
    }
    if (this.statusFilter) {
      filters['status'] = this.statusFilter;
    }
    this.galleryService.setFilters(filters);
  }
}
