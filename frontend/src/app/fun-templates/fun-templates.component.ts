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
import {EnrichedSourceAsset} from './media-template.model';

import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {
  IndustryEnum,
  MimeTypeEnum,
  MediaTemplate,
  TemplateFilter,
} from './media-template.model';
import {Router} from '@angular/router';
import {MediaItem} from '../common/models/media-item.model';
import {MediaTemplatesService} from '../admin/media-templates-management/media-templates.service';

@Component({
  selector: 'app-fun-templates',
  templateUrl: './fun-templates.component.html',
  styleUrl: './fun-templates.component.scss',
})
export class FunTemplatesComponent implements OnInit, OnDestroy {
  public isLoading = true;
  public allTemplates: MediaTemplate[] = [];
  public filteredTemplates: MediaTemplate[] = [];
  public templateFilter: TemplateFilter = {
    industry: null,
    mediaType: null,
    tags: null,
    model: null,
    name: null,
  };
  public industries: string[] = [];
  public readonly mediaTypes = Object.values(MimeTypeEnum);
  private autoSlideIntervals: {[id: string]: any} = {};
  public currentImageIndices: {[id: string]: number} = {};
  public hoveredVideoId: number | null = null;
  public selectedTemplateForLightbox: MediaItem | null = null;
  public lightboxInitialIndex = 0;

  // Services using inject() for modern Angular
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  public matIconRegistry = inject(MatIconRegistry);
  private mediaTemplatesService = inject(MediaTemplatesService);
  private industryColorMap: Map<string, string> = new Map([
    [IndustryEnum.AUTOMOTIVE, '!bg-blue-500/20 !text-blue-300'],
    [IndustryEnum.CONSUMER_GOODS, '!bg-green-500/20 !text-green-300'],
    [IndustryEnum.ART_AND_DESIGN, '!bg-purple-500/20 !text-purple-300'],
    [IndustryEnum.ENTERTAINMENT, '!bg-red-500/20 !text-red-300'],
    [IndustryEnum.HOME_APPLIANCES, '!bg-yellow-500/20 !text-yellow-300'],
    [IndustryEnum.FASHION_AND_APPAREL, '!bg-pink-500/20 !text-pink-300'],
    [IndustryEnum.FOOD_AND_BEVERAGE, '!bg-orange-500/20 !text-orange-300'],
    [IndustryEnum.HEALTH_AND_WELLNESS, '!bg-teal-500/20 !text-teal-300'],
    [IndustryEnum.LUXURY_GOODS, '!bg-indigo-500/20 !text-indigo-300'],
    [IndustryEnum.TECHNOLOGY, '!bg-sky-500/20 !text-sky-300'],
    [IndustryEnum.TRAVEL_AND_HOSPITALITY, '!bg-lime-500/20 !text-lime-300'],
    [IndustryEnum.PET_SUPPLIES, '!bg-fuchsia-500/20 !text-fuchsia-300'],
    [IndustryEnum.OTHER, '!bg-gray-500/20 !text-gray-300'],
  ]);

  constructor() {
    const iconPath = '../../assets/images';
    this.matIconRegistry
      .addSvgIcon(
        'gemini-spark-icon',
        this.setPath(`${iconPath}/gemini-spark-icon.svg`),
      )
      .addSvgIcon(
        'mobile-white-gemini-spark-icon',
        this.setPath(`${iconPath}/mobile-white-gemini-spark-icon.svg`),
      );
  }

  ngOnInit(): void {
    this.fetchTemplates();
  }

  getIndustryColor(industry: IndustryEnum): string {
    return (
      this.industryColorMap.get(industry) || 'bg-gray-500/20 text-gray-300'
    );
  }

  fetchTemplates(): void {
    this.isLoading = true;
    this.mediaTemplatesService.getMediaTemplates().subscribe({
      next: response => {
        this.allTemplates = response.data
          .filter(t => t.id)
          .map((mediaTemplate: MediaTemplate) => {
            return {
              ...mediaTemplate,
              id: mediaTemplate.id!,
              mimeType: mediaTemplate.mimeType as unknown as MimeTypeEnum,
              presignedUrls: mediaTemplate.presignedUrls,
              tags: mediaTemplate.tags || [],
              thumbnailUris: mediaTemplate.thumbnailUris || [],
              industry: mediaTemplate.industry || IndustryEnum.OTHER,
              enrichedSourceAssets: mediaTemplate.enrichedSourceAssets || [],
            } as MediaTemplate;
          });

        this.industries = [
          ...new Set(this.allTemplates.map(t => t.industry)),
        ].sort();

        this.allTemplates.forEach(t => (this.currentImageIndices[t.id] = 0));
        this.applyFilters();
        this.isLoading = false;
      },
      error: err => {
        console.error('Error fetching fun templates', err);
        this.isLoading = false;
      },
    });
  }

  /**
   * Optimizes *ngFor performance by providing a unique identifier for each template.
   * This prevents Angular from re-rendering the entire list when data changes.
   * @param index The index of the item in the array.
   * @param template The template object itself.
   * @returns The unique ID of the template.
   */
  public trackByTemplateId(index: number, template: MediaTemplate): number {
    return template.id;
  }

  /**
   * Filters the templates based on the current `templateFilter` values.
   */
  applyFilters(): void {
    let templates = [...this.allTemplates];
    const filter = this.templateFilter;

    // Filter by Industry
    if (filter.industry) {
      templates = templates.filter(t => t.industry === filter.industry);
    }

    // Filter by Media Type
    if (filter.mediaType) {
      templates = templates.filter(t => t.mimeType === filter.mediaType);
    }

    // Filter by Name (case-insensitive)
    if (filter.name) {
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(filter.name!.toLowerCase()),
      );
    }

    // Filter by Model (case-insensitive)
    if (filter.model) {
      templates = templates.filter(t =>
        t.generationParameters.model
          ?.toLowerCase()
          .includes(filter.model!.toLowerCase()),
      );
    }

    // Filter by Tags (case-insensitive search within the tags array)
    if (filter.tags) {
      templates = templates.filter(t =>
        t.tags.some(tag =>
          tag.toLowerCase().includes(filter.tags!.toLowerCase()),
        ),
      );
    }

    this.filteredTemplates = templates;

    // Clear all intervals
    Object.values(this.autoSlideIntervals).forEach(clearInterval);
    this.autoSlideIntervals = {};

    // Start intervals for filtered templates
    this.filteredTemplates.forEach(t => {
      if (this.currentImageIndices[t.id] === undefined) {
        this.currentImageIndices[t.id] = 0;
      }
      this.startAutoSlide(t);
    });
  }

  /**
   * Navigates to the main generator page, passing the selected template's
   * generation parameters in the router state.
   * @param template The template object that was clicked.
   */
  useTemplate(template: MediaTemplate): void {
    // Navigate to the homepage (or your generator page) and pass the parameters
    this.router.navigate(
      [template.mimeType === MimeTypeEnum.VIDEO ? '/video' : '/'],
      {
        state: {
          templateParams: template.generationParameters,
          sourceAssets: template.enrichedSourceAssets,
        },
      },
    );
  }

  /**
   * Clears all active filters and re-applies to show all templates.
   */
  clearFilters(): void {
    this.templateFilter = {
      industry: null,
      mediaType: null,
      tags: null,
      model: null,
      name: null,
    };
    this.applyFilters();
  }

  private setPath(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  public nextImage(templateId: number, totalImages: number): void {
    const currentIndex = this.currentImageIndices[templateId] || 0;
    this.currentImageIndices[templateId] = (currentIndex + 1) % totalImages;
  }

  public prevImage(templateId: number, totalImages: number): void {
    const currentIndex = this.currentImageIndices[templateId] || 0;
    this.currentImageIndices[templateId] =
      (currentIndex - 1 + totalImages) % totalImages;
  }

  public startAutoSlide(template: MediaTemplate): void {
    const urls = template.presignedUrls;
    if (urls && urls.length > 1) {
      if (this.autoSlideIntervals[template.id]) {
        return;
      }
      this.autoSlideIntervals[template.id] = setInterval(() => {
        this.nextImage(template.id, urls.length);
      }, 3000);
    }
  }

  public stopAutoSlide(templateId: number): void {
    if (this.autoSlideIntervals[templateId]) {
      clearInterval(this.autoSlideIntervals[templateId]);
      delete this.autoSlideIntervals[templateId];
    }
  }

  public onMouseEnter(template: MediaTemplate): void {
    if (template.mimeType === MimeTypeEnum.VIDEO) {
      this.hoveredVideoId = template.id;
    }
    this.stopAutoSlide(template.id);
  }

  public onMouseLeave(template: MediaTemplate): void {
    if (template.mimeType === MimeTypeEnum.VIDEO) {
      this.hoveredVideoId = null;
    }
    this.startAutoSlide(template);
  }

  public openGallery(template: MediaTemplate, index: number): void {
    this.stopAutoSlide(template.id);

    // The `media-lightbox` component expects a `MediaItem` object. We can construct
    // a compatible object by flattening the `generationParameters` and mapping
    // the thumbnail URIs.
    const mediaItem: MediaItem = {
      ...template.generationParameters,
      id: template.id,
      mimeType: template.mimeType,
      gcsUris: template.gcsUris || [],
      presignedUrls: template.presignedUrls,
      presignedThumbnailUrls: template.presignedThumbnailUrls, // Map to property expected by lightbox
    };
    // Remove the nested object to keep the state clean.
    delete (mediaItem as any).generationParameters;
    delete (mediaItem as any).thumbnailUris;

    this.selectedTemplateForLightbox = mediaItem;
    this.lightboxInitialIndex = index;
  }

  public closeLightbox(): void {
    if (this.selectedTemplateForLightbox) {
      // Find the original template to restart the slide show when the lightbox is closed
      const template = this.allTemplates.find(
        t => t.id === this.selectedTemplateForLightbox!.id,
      );
      if (template) {
        this.startAutoSlide(template);
      }
    }
    this.selectedTemplateForLightbox = null;
  }

  public openSourceAssetInLightbox(
    sourceAsset: EnrichedSourceAsset,
    event: MouseEvent,
  ): void {
    event.stopPropagation(); // Prevent card's openGallery from firing

    // Construct a MediaItem-like object for the lightbox
    const mediaItem: MediaItem = {
      id: sourceAsset.assetId,
      mimeType: MimeTypeEnum.IMAGE, // Assuming source assets are images
      presignedUrls: [sourceAsset.presignedUrl],
      presignedThumbnailUrls: [sourceAsset.presignedUrl],
      originalPrompt: `Input: ${sourceAsset.role}`,
      gcsUris: [sourceAsset.presignedUrl]
      // Add any other required fields for MediaItem with default values
    };

    this.selectedTemplateForLightbox = mediaItem;
    this.lightboxInitialIndex = 0;
  }

  ngOnDestroy(): void {
    Object.values(this.autoSlideIntervals).forEach(clearInterval);
  }
}
