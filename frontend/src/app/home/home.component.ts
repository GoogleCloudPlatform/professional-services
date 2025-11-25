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

import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavigationExtras, Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { AssetTypeEnum } from '../admin/source-assets-management/source-asset.model';
import { ImageCropperDialogComponent } from '../common/components/image-cropper-dialog/image-cropper-dialog.component';
import {
  ImageSelectorComponent,
  MediaItemSelection,
} from '../common/components/image-selector/image-selector.component';
import { ToastMessageComponent } from '../common/components/toast-message/toast-message.component';
import { MediaItem } from '../common/models/media-item.model';
import {
  ImagenRequest,
  ReferenceImage,
  SourceMediaItemLink,
} from '../common/models/search.model';
import { SourceAssetResponseDto } from '../common/services/source-asset.service';
import {
  EnrichedSourceAsset,
  GenerationParameters,
} from '../fun-templates/media-template.model';
import { SearchService } from '../services/search/search.service';
import { WorkspaceStateService } from '../services/workspace/workspace-state.service';
import { handleErrorSnackbar } from '../utils/handleErrorSnackbar';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  // --- Component State ---
  imagenDocuments: MediaItem | null = null;
  isLoading = false;
  templateParams: GenerationParameters | undefined;
  showDefaultDocuments = false;
  referenceImages: ReferenceImage[] = [];
  sourceMediaItems: (SourceMediaItemLink | null)[] = [];
  activeWorkspaceId$: Observable<string | null>;

  @HostListener('window:keydown.control.enter', ['$event'])
  handleCtrlEnter(event: KeyboardEvent) {
    if (!this.isLoading) {
      event.preventDefault();
      this.searchTerm();
    }
  }

  // --- Search Request Object ---
  // This object holds the current state of all user selections.
  searchRequest: ImagenRequest = {
    prompt: '',
    generationModel: 'gemini-3-pro-image-preview',
    aspectRatio: '1:1',
    numberOfMedia: 4,
    style: null,
    lighting: null,
    colorAndTone: null,
    composition: null,
    addWatermark: false,
    negativePrompt: '',
    useBrandGuidelines: false,
    googleSearch: false,
    resolution: '4K',
  };

  // --- Negative Prompt Chips ---
  negativePhrases: string[] = [];

  // --- Dropdown Options ---
  generationModels = [
    {
      value: 'gemini-3-pro-image-preview',
      viewValue: 'Nano Banana Pro',
      isImage: true,
      imageSrc: 'assets/images/banana-peel.png',
    },
    {
      value: 'gemini-2.5-flash-image-preview',
      viewValue: 'Nano Banana',
      isImage: true,
      imageSrc: 'assets/images/banana-peel.png',
    },
    {
      value: 'imagen-4.0-generate-001',
      viewValue: 'Imagen 4', // Keeping gemini-spark-icon for Imagen
      icon: 'gemini-spark-icon',
      isSvg: true,
    },
    {
      value: 'imagen-4.0-ultra-generate-001',
      viewValue: 'Imagen 4 Ultra', // Keeping gemini-spark-icon for Imagen
      icon: 'gemini-spark-icon',
      isSvg: true,
    },
    {
      value: 'imagen-4.0-fast-generate-001',
      viewValue: 'Imagen 4 Fast', // Keeping gemini-spark-icon for Imagen
      icon: 'gemini-spark-icon',
      isSvg: true,
    },
    {
      value: 'imagen-3.0-generate-002',
      viewValue: 'Imagen 3',
      icon: 'auto_awesome',
    },
    {
      value: 'imagen-3.0-fast-generate-001',
      viewValue: 'Imagen 3 Fast',
      icon: 'auto_awesome',
    },
  ];
  selectedGenerationModelObject = this.generationModels[0];
  selectedGenerationModel = this.generationModels[0].viewValue;
  aspectRatioOptions: {
    value: string;
    viewValue: string;
    disabled: boolean;
    icon: string;
  }[] = [
      {
        value: '1:1',
        viewValue: '1:1 \n Square',
        disabled: false,
        icon: 'crop_square',
      },
      {
        value: '16:9',
        viewValue: '16:9 \n Horizontal',
        disabled: false,
        icon: 'crop_16_9',
      },
      {
        value: '9:16',
        viewValue: '9:16 \n Vertical',
        disabled: false,
        icon: 'crop_portrait',
      },
      {
        value: '3:4',
        viewValue: '3:4 \n Portrait',
        disabled: false,
        icon: 'crop_portrait',
      },
      {
        value: '4:3',
        viewValue: '4:3 \n Pin',
        disabled: false,
        icon: 'crop_landscape',
      },
      {
        value: '2:3',
        viewValue: '2:3 \n Portrait',
        disabled: false,
        icon: 'crop_portrait',
      },
      {
        value: '3:2',
        viewValue: '3:2 \n Landscape',
        disabled: false,
        icon: 'crop_landscape',
      },
      {
        value: '4:5',
        viewValue: '4:5 \n Portrait',
        disabled: false,
        icon: 'crop_portrait',
      },
      {
        value: '5:4',
        viewValue: '5:4 \n Landscape',
        disabled: false,
        icon: 'crop_landscape',
      },
      {
        value: '21:9',
        viewValue: '21:9 \n Wide',
        disabled: false,
        icon: 'crop_16_9',
      },
    ];
  selectedAspectRatio = this.aspectRatioOptions[0].viewValue;
  imageStyles = [
    'Cinematic',
    'Fantasy',
    'Modern',
    'Monochrome',
    'Photorealistic',
    'Realistic',
    'Sketch',
    'Vintage',
  ];
  lightings = [
    'Ambient',
    'Backlighting',
    'Cinematic',
    'Dramatic',
    'Dramatic Light',
    'Exposure',
    'Golden Hour',
    'Low Lighting',
    'Multiexposure',
    'Natural',
    'Studio',
    'Studio Light',
  ];
  colorsAndTones = [
    'Black & White',
    'Cool',
    'Golden',
    'Monochrome',
    'Muted',
    'Pastel',
    'Toned',
    'Vibrant',
    'Warm',
  ];
  numberOfImagesOptions = [1, 2, 3, 4];
  compositions = [
    'Closeup',
    'Knolling',
    'Landscape photography',
    'Photographed through window',
    'Shallow depth of field',
    'Shot from above',
    'Shot from below',
    'Surface detail',
    'Wide angle',
  ];
  watermarkOptions = [
    { value: true, viewValue: 'Yes' },
    { value: false, viewValue: 'No' },
  ];
  selectedWatermark = this.watermarkOptions.find(
    o => o.value === this.searchRequest.addWatermark,
  )!.viewValue;

  // --- Private properties for animation and gallery ---
  private curX = 0;
  private curY = 0;
  private tgX = 0;
  private tgY = 0;
  private animationFrameId: number | undefined;

  @ViewChild('interactiveBubble') interBubble!: ElementRef<HTMLDivElement>;

  constructor(
    public router: Router,
    private sanitizer: DomSanitizer,
    public matIconRegistry: MatIconRegistry,
    private service: SearchService,
    private _snackBar: MatSnackBar,
    public dialog: MatDialog,
    private http: HttpClient,
    @Inject(WorkspaceStateService)
    private workspaceStateService: WorkspaceStateService,
  ) {
    this.matIconRegistry
      .addSvgIcon(
        'content-type-icon',
        this.setPath(`${this.path}/content-type-icon.svg`),
      )
      .addSvgIcon(
        'lighting-icon',
        this.setPath(`${this.path}/lighting-icon.svg`),
      )
      .addSvgIcon(
        'number-of-images-icon',
        this.setPath(`${this.path}/number-of-images-icon.svg`),
      )
      .addSvgIcon(
        'gemini-spark-icon',
        this.setPath(`${this.path}/gemini-spark-icon.svg`),
      )
      .addSvgIcon(
        'white-gemini-spark-icon',
        this.setPath(`${this.path}/white-gemini-spark-icon.svg`),
      )
      .addSvgIcon(
        'mobile-white-gemini-spark-icon',
        this.setPath(`${this.path}/mobile-white-gemini-spark-icon.svg`),
      );

    const navigation = this.router.getCurrentNavigation();
    const remixState = navigation?.extras.state?.['remixState'];
    const sourceAssets = navigation?.extras.state?.[
      'sourceAssets'
    ] as EnrichedSourceAsset[];

    if (remixState) {
      this.applyRemixState(remixState);
    } else {
      // Only apply template params if there's no remix state.
      this.templateParams = navigation?.extras.state?.['templateParams'];
      this.applyTemplateParameters();
    }

    if (sourceAssets) {
      this.applySourceAssets(sourceAssets);
    }

    this.activeWorkspaceId$ = this.workspaceStateService.activeWorkspaceId$;
  }

  private path = '../../assets/images';

  private setPath(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngAfterViewInit(): void {
    // This hook is called after the component's view has been initialized.
    // Now we can be sure that 'interBubble' is available.
    if (this.interBubble && this.interBubble.nativeElement) {
      this.move();
    } else {
      console.warn(
        'Interactive bubble element not found. Animation may not start.',
      );
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined')
      window.removeEventListener('mousemove', this.onMouseMove);

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  ngOnInit(): void {
    // Set up event listener here, but don't start animation yet
    // As this should be browser code we check first if window exists
    if (typeof window !== 'undefined')
      window.addEventListener('mousemove', this.onMouseMove);

    // Since we start with Nano Banana, apply its restrictions by default.
    this.selectModel(this.selectedGenerationModelObject);
  }

  private applyTemplateParameters(): void {
    if (!this.templateParams) {
      return;
    }

    if (this.templateParams.prompt) {
      this.searchRequest.prompt = this.templateParams.prompt;
    }

    if (this.templateParams.numMedia) {
      console.log('Setting number of images:', this.templateParams.numMedia);
      this.searchRequest.numberOfMedia = this.templateParams.numMedia;
    }

    if (this.templateParams.model) {
      const templateModel = this.templateParams.model;
      const modelOption = this.generationModels.find(m =>
        m.value.toLowerCase().includes(templateModel.toLowerCase()),
      );
      if (modelOption) {
        this.searchRequest.generationModel = modelOption.value;
        this.selectedGenerationModel = modelOption.viewValue;
      }
    }

    if (this.templateParams.aspectRatio) {
      const templateAspectRatio = this.templateParams.aspectRatio;
      const aspectRatioOption = this.aspectRatioOptions.find(
        r => r.value === templateAspectRatio,
      );
      if (aspectRatioOption) {
        this.searchRequest.aspectRatio = aspectRatioOption.value;
        this.selectedAspectRatio = aspectRatioOption.viewValue;
      }
    }

    if (this.templateParams.style) {
      this.searchRequest.style = this.templateParams.style;
    }

    if (this.templateParams.lighting) {
      this.searchRequest.lighting = this.templateParams.lighting;
    }

    if (this.templateParams.colorAndTone) {
      this.searchRequest.colorAndTone = this.templateParams.colorAndTone;
    }

    if (this.templateParams.composition) {
      this.searchRequest.composition = this.templateParams.composition;
    }

    if (this.templateParams.negativePrompt) {
      this.negativePhrases = this.templateParams.negativePrompt
        .split(',')
        .map((p: string) => p.trim())
        .filter(Boolean);
      this.searchRequest.negativePrompt = this.negativePhrases.join(', ');
    }
  }

  openLink(url: string | undefined) {
    if (!url) return;
    window.open(url, '_blank');
  }

  private processSearchResults(searchResponse: MediaItem) {
    this.imagenDocuments = searchResponse;

    const hasImagenResults =
      (this.imagenDocuments?.presignedUrls?.length || 0) > 0;

    if (hasImagenResults) {
      this.showDefaultDocuments = false;
    } else {
      this.showDefaultDocuments = true;
    }
  }

  selectModel(model: any): void {
    this.searchRequest.generationModel = model.value;
    this.selectedGenerationModel = model.viewValue;
    this.selectedGenerationModelObject = model;

    if (model.value === 'gemini-3-pro-image-preview') {
      // Enable all aspect ratios for Gemini 3 Pro
      this.aspectRatioOptions.forEach(r => (r.disabled = false));
    } else if (model.value === 'gemini-2.5-flash-image-preview') {
      // Nano Banana only supports 1:1 aspect ratio for now.
      const oneToOneRatio = this.aspectRatioOptions.find(
        r => r.value === '1:1',
      );
      if (oneToOneRatio) {
        this.selectAspectRatio(oneToOneRatio);
      }
      // Disable other aspect ratios
      this.aspectRatioOptions.forEach(r => {
        r.disabled = r.value !== '1:1';
      });
      // Enforce image limit (max 2 for Flash)
      if (this.referenceImages.length > 2) {
        this.referenceImages = this.referenceImages.slice(0, 2);
      }
    } else {
      // Imagen models support standard aspect ratios
      const imagenRatios = ['1:1', '16:9', '9:16', '3:4', '4:3'];
      this.aspectRatioOptions.forEach(r => {
        r.disabled = !imagenRatios.includes(r.value);
      });
      if (!imagenRatios.includes(this.searchRequest.aspectRatio)) {
        const oneToOneRatio = this.aspectRatioOptions.find(
          r => r.value === '1:1',
        );
        if (oneToOneRatio) {
          this.selectAspectRatio(oneToOneRatio);
        }
      }
      // Enforce image limit (max 2 for Imagen 3)
      if (this.referenceImages.length > 2) {
        this.referenceImages = this.referenceImages.slice(0, 2);
      }
      // Clear images for Imagen 4 as it doesn't support them
      if (model.value.startsWith('imagen-4')) {
        this.referenceImages = [];
      }
      // Reset Google Search for non-Gemini 3 Pro models
      this.searchRequest.googleSearch = false;
    }
  }

  selectAspectRatio(ratio: { value: string; viewValue: string }): void {
    this.searchRequest.aspectRatio = ratio.value;
    this.selectedAspectRatio = ratio.viewValue;
  }

  selectImageStyle(style: string): void {
    this.searchRequest.style === style
      ? (this.searchRequest.style = null)
      : (this.searchRequest.style = style);
  }

  selectLighting(lighting: string): void {
    this.searchRequest.lighting === lighting
      ? (this.searchRequest.lighting = null)
      : (this.searchRequest.lighting = lighting);
  }

  selectColor(color: string): void {
    this.searchRequest.colorAndTone === color
      ? (this.searchRequest.colorAndTone = null)
      : (this.searchRequest.colorAndTone = color);
  }

  selectNumberOfImages(num: number): void {
    this.searchRequest.numberOfMedia === num
      ? (this.searchRequest.numberOfMedia = 4)
      : (this.searchRequest.numberOfMedia = num);
  }

  selectComposition(composition: string): void {
    this.searchRequest.composition === composition
      ? (this.searchRequest.composition = null)
      : (this.searchRequest.composition = composition);
  }

  selectWatermark(option: { value: boolean; viewValue: string }): void {
    this.searchRequest.addWatermark = option.value;
    this.selectedWatermark = option.viewValue;
  }

  addNegativePhrase(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) this.negativePhrases.push(value);

    // Clear the input value
    event.chipInput!.clear();
  }

  removeNegativePhrase(phrase: string): void {
    const index = this.negativePhrases.indexOf(phrase);
    if (index >= 0) this.negativePhrases.splice(index, 1);
  }

  searchTerm() {
    if (!this.searchRequest.prompt) return;

    const hasSourceAssets = this.referenceImages.length > 0;
    const isImagen4 = [
      'imagen-4.0-generate-001',
      'imagen-4.0-ultra-generate-001',
      'imagen-4.0-fast-generate-001',
    ].includes(this.searchRequest.generationModel);

    if (hasSourceAssets && isImagen4) {
      const imagen3Model = this.generationModels.find(
        m => m.value === 'imagen-3.0-generate-002',
      );
      if (imagen3Model) {
        this.selectModel(imagen3Model);
        this._snackBar.openFromComponent(ToastMessageComponent, {
          panelClass: ['green-toast'],
          duration: 8000,
          data: {
            text: "Imagen 4 doesn't support images as input, so we've switched to Imagen 3 for you!",
            matIcon: 'info_outline',
          },
        });
        return;
      }
    }

    const validSourceMediaItems: SourceMediaItemLink[] = [];
    const sourceAssetIds: string[] = [];

    this.referenceImages.forEach(img => {
      if (img.sourceMediaItem) {
        validSourceMediaItems.push(img.sourceMediaItem);
      } else if (img.sourceAssetId) {
        sourceAssetIds.push(img.sourceAssetId);
      }
    });

    const activeWorkspaceId = this.workspaceStateService.getActiveWorkspaceId();
    const payload: ImagenRequest = {
      ...this.searchRequest,
      negativePrompt: this.negativePhrases.join(', '),
      sourceMediaItems: validSourceMediaItems.length
        ? validSourceMediaItems
        : undefined,
      sourceAssetIds: sourceAssetIds.length ? sourceAssetIds : undefined,
      workspaceId: activeWorkspaceId ?? undefined,
    };

    this.isLoading = true;
    this.imagenDocuments = null;

    this.service
      .searchImagen(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (searchResponse: MediaItem) => {
          this.processSearchResults(searchResponse);
        },
        error: error => {
          handleErrorSnackbar(this._snackBar, error, 'Search');
        },
      });
  }

  rewritePrompt() {
    if (!this.searchRequest.prompt) return;

    this.isLoading = true;
    const promptToSend = this.searchRequest.prompt;
    this.searchRequest.prompt = '';
    this.service
      .rewritePrompt({
        targetType: 'image',
        userPrompt: promptToSend,
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response: { prompt: string }) => {
          this.searchRequest.prompt = response.prompt;
        },
        error: error => {
          handleErrorSnackbar(this._snackBar, error, 'Rewrite prompt');
        },
      });
  }

  getRandomPrompt() {
    this.isLoading = true;
    this.searchRequest.prompt = '';
    this.service
      .getRandomPrompt({ target_type: 'image' })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response: { prompt: string }) => {
          this.searchRequest.prompt = response.prompt;
        },
        error: error => {
          handleErrorSnackbar(this._snackBar, error, 'Get random prompt');
        },
      });
  }

  resetAllFilters() {
    this.searchRequest = {
      prompt: '',
      generationModel: 'gemini-3-pro-image-preview',
      aspectRatio: '1:1',
      numberOfMedia: 4,
      style: null,
      lighting: null,
      colorAndTone: null,
      composition: null,
      addWatermark: false,
      negativePrompt: '',
      useBrandGuidelines: false,
      googleSearch: false,
      resolution: '4K',
    };
    this.negativePhrases = [];
    this.referenceImages = [];
    this.sourceMediaItems = [];
    this.selectedGenerationModel = this.generationModels[0].viewValue;
    this.selectedGenerationModelObject = this.generationModels[0];
    this.selectedAspectRatio = this.aspectRatioOptions[0].viewValue;
  }

  editResultImage(index: number) {
    if (!this.imagenDocuments || !this.imagenDocuments.presignedUrls) return;
    const imageUrl = this.imagenDocuments.presignedUrls[index];
    const mediaItemId = this.imagenDocuments.id;

    // Add to reference images
    const refImage: ReferenceImage = {
      previewUrl: imageUrl,
      sourceMediaItem: {
        mediaItemId: mediaItemId,
        mediaIndex: index,
        role: 'input',
      },
    };
    this.referenceImages.push(refImage);

    // Scroll to top to show the input
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  applyRemixState(state: any) {
    this.searchRequest.prompt = state.prompt;
    this.searchRequest.aspectRatio = state.aspectRatio;
    this.searchRequest.generationModel = state.generationModel;
    this.searchRequest.style = state.style;
    this.searchRequest.lighting = state.lighting;
    this.searchRequest.colorAndTone = state.colorAndTone;
    this.searchRequest.composition = state.composition;
    this.searchRequest.negativePrompt = state.negativePrompt;
    this.negativePhrases = state.negativePrompt
      ? state.negativePrompt.split(', ')
      : [];

    if (state.sourceAssetIds && state.sourceAssetIds.length > 0) {
      // This is a simplification, we might need to fetch the actual assets to get preview URLs
      // For now, we just set the IDs, but preview won't work until we have URLs
      state.sourceAssetIds.forEach((id: string) => {
        this.referenceImages.push({
          previewUrl: '', // Need to handle this
          sourceAssetId: id,
        });
      });
    }

    if (state.sourceMediaItems && state.sourceMediaItems.length > 0) {
      state.sourceMediaItems.forEach((item: SourceMediaItemLink) => {
        this.referenceImages.push({
          previewUrl: '', // Need to handle this
          sourceMediaItem: item,
        });
      });
    }

    this.selectModel(
      this.generationModels.find(m => m.value === state.generationModel) ||
      this.generationModels[0],
    );
    this.selectedAspectRatio =
      this.aspectRatioOptions.find(r => r.value === state.aspectRatio)
        ?.viewValue || this.aspectRatioOptions[0].viewValue;
  }

  private onMouseMove = (event: MouseEvent) => {
    this.tgX = event.clientX;
    this.tgY = event.clientY;
  };

  private move = () => {
    this.curX += (this.tgX - this.curX) / 20;
    this.curY += (this.tgY - this.curY) / 20;

    if (this.interBubble && this.interBubble.nativeElement) {
      this.interBubble.nativeElement.style.transform = `translate(${Math.round(this.curX)}px, ${Math.round(this.curY)}px)`;
    }

    this.animationFrameId = requestAnimationFrame(this.move);
  };

  openImageSelector(index?: number) {
    const dialogRef = this.dialog.open(ImageSelectorComponent, {
      width: '90vw',
      height: '80vh',
      maxWidth: '90vw',
      data: {
        mimeType: 'image/*',
      },
      panelClass: 'image-selector-dialog',
    });

    dialogRef
      .afterClosed()
      .subscribe((result: MediaItemSelection | SourceAssetResponseDto) => {
        if (result) {
          this.processInput(result, index);
        }
      });
  }

  openCropperDialog(file: File, index?: number) {
    const dialogRef = this.dialog.open(ImageCropperDialogComponent, {
      data: {
        imageFile: file,
        assetType: AssetTypeEnum.GENERIC_IMAGE,
      },
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((result: SourceAssetResponseDto) => {
      if (result && result.id) {
        this.processInput(result, index);
      }
    });
  }

  private processInput(
    result: MediaItemSelection | SourceAssetResponseDto,
    index?: number,
  ) {
    const isGalleryImage = !('gcsUri' in result);
    let previewUrl: string | null = null;
    let sourceAssetId: string | null = null;
    let sourceMediaItem: SourceMediaItemLink | null = null;

    if (isGalleryImage) {
      const selection = result as MediaItemSelection;
      previewUrl =
        selection.mediaItem.presignedUrls?.[selection.selectedIndex || 0] || null;
      sourceMediaItem = {
        mediaItemId: selection.mediaItem.id,
        mediaIndex: selection.selectedIndex,
        role: 'input',
      };
    } else {
      const asset = result as SourceAssetResponseDto;
      previewUrl = asset.presignedUrl || null;
      sourceAssetId = asset.id;
    }

    if (previewUrl) {
      const refImage: ReferenceImage = {
        previewUrl,
        sourceAssetId: sourceAssetId || undefined,
        sourceMediaItem: sourceMediaItem || undefined,
      };

      if (index !== undefined && index < this.referenceImages.length) {
        this.referenceImages[index] = refImage;
      } else {
        this.referenceImages.push(refImage);
      }
    }
  }

  onDrop(event: DragEvent, index?: number) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Handle multiple files if dropped
      for (let i = 0; i < files.length; i++) {
        this.openCropperDialog(files[i], index !== undefined ? index + i : undefined);
      }
    }
  }

  clearImage(index: number, event: MouseEvent) {
    event.stopPropagation();
    if (index >= 0 && index < this.referenceImages.length) {
      this.referenceImages.splice(index, 1);
    }
  }


  generateVideoWithImage(event: { role: 'start' | 'end'; index: number }) {
    if (!this.imagenDocuments) {
      return;
    }

    const sourceMediaItem: SourceMediaItemLink = {
      mediaItemId: this.imagenDocuments.id,
      mediaIndex: event.index,
      role: event.role === 'start' ? 'start_frame' : 'end_frame',
    };

    const remixState = {
      prompt: this.imagenDocuments.originalPrompt,
      sourceMediaItems: [sourceMediaItem],
      startImagePreviewUrl:
        event.role === 'start'
          ? this.imagenDocuments.presignedUrls?.[event.index]
          : undefined,
      endImagePreviewUrl:
        event.role === 'end'
          ? this.imagenDocuments.presignedUrls?.[event.index]
          : undefined,
    };

    const navigationExtras: NavigationExtras = {
      state: { remixState },
    };
    this.router.navigate(['/video'], navigationExtras);
  }

  sendToVto(index: number) {
    if (!this.imagenDocuments) {
      return;
    }

    const navigationExtras: NavigationExtras = {
      state: {
        remixState: {
          modelImageAssetId: this.imagenDocuments.id,
          modelImagePreviewUrl: this.imagenDocuments.presignedUrls?.[index],
          modelImageGcsUri: this.imagenDocuments.gcsUris?.[index],
          modelImageMediaIndex: index,
        },
      },
    };
    this.router.navigate(['/vto'], navigationExtras);
  }

  private applySourceAssets(sourceAssets: EnrichedSourceAsset[]): void {
    if (!sourceAssets || sourceAssets.length === 0) {
      return;
    }

    // Clear any existing inputs
    this.referenceImages = [];
    this.sourceMediaItems = [];

    sourceAssets.forEach(asset => {
      this.referenceImages.push({
        previewUrl: asset.presignedUrl || '',
        sourceAssetId: asset.assetId,
      });
    });
  }
}
