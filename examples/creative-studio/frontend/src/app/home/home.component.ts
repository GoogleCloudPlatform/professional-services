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
import { ImageStateService } from '../services/image-state.service';
import { handleErrorSnackbar, handleSuccessSnackbar, handleInfoSnackbar } from '../utils/handleMessageSnackbar';
import { MODEL_CONFIGS, GenerationModelConfig } from '../common/config/model-config';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  // --- Component State ---
  imagenDocuments: MediaItem | null = null;
  isLoading = false;
  isImageGenerating = false;
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

  modes = [
    { value: 'Text to Image', icon: 'description', label: 'Text to Image' },
    { value: 'Ingredients to Image', icon: 'layers', label: 'Ingredients to Image' }
  ];
  currentMode = 'Text to Image';

  // --- Negative Prompt Chips ---
  negativePhrases: string[] = [];

  // --- Dropdown Options ---
  generationModels: GenerationModelConfig[] = MODEL_CONFIGS.filter(m => m.type === 'IMAGE');
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
  @ViewChild('promptBoxTarget') promptBoxTarget!: ElementRef<HTMLDivElement>;

  constructor(
    public router: Router,
    private sanitizer: DomSanitizer,
    public matIconRegistry: MatIconRegistry,
    public service: SearchService,
    private _snackBar: MatSnackBar,
    public dialog: MatDialog,
    private http: HttpClient,
    @Inject(WorkspaceStateService)
    private workspaceStateService: WorkspaceStateService,
    private imageStateService: ImageStateService,
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

    // Subscribe to the active image job to update the UI
    this.service.activeImageJob$.subscribe(job => {
      if (job) {
        this.processSearchResults(job);
        if (job.status === 'completed' || job.status === 'failed') {
          this.isImageGenerating = false;
        } else {
          this.isImageGenerating = true;
        }
      }
    });
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

    // Restore state from service
    this.imageStateService.state$.subscribe(state => {
      this.searchRequest.prompt = state.prompt;
      this.searchRequest.negativePrompt = state.negativePrompt;
      this.searchRequest.aspectRatio = state.aspectRatio;
      this.searchRequest.generationModel = state.model;
      this.searchRequest.lighting = state.lighting;
      this.searchRequest.addWatermark = state.watermark;
      this.searchRequest.googleSearch = state.googleSearch;
      this.searchRequest.resolution = state.resolution as '4K' | '1K' | '2K' | undefined;
      this.searchRequest.style = state.style;
      this.searchRequest.colorAndTone = state.colorAndTone;
      this.searchRequest.numberOfMedia = state.numberOfMedia;
      this.searchRequest.composition = state.composition;
      this.searchRequest.useBrandGuidelines = state.useBrandGuidelines;
      this.currentMode = state.mode;

      // Update local variables to reflect state
      this.selectedGenerationModel = this.generationModels.find(
        m => m.value === state.model
      )?.viewValue || this.generationModels[0].viewValue;
      
      this.selectedGenerationModelObject = this.generationModels.find(
        m => m.value === state.model
      ) || this.generationModels[0];

      this.selectedAspectRatio = this.aspectRatioOptions.find(
        r => r.value === state.aspectRatio
      )?.viewValue || '1:1 \n Square';

      this.selectedWatermark = this.watermarkOptions.find(
        o => o.value === state.watermark
      )?.viewValue || 'No';
      
      this.service.imagePrompt = state.prompt;
    });
  }

  public saveState() {
    this.imageStateService.updateState({
      prompt: this.searchRequest.prompt,
      negativePrompt: this.searchRequest.negativePrompt || '',
      aspectRatio: this.searchRequest.aspectRatio,
      model: this.searchRequest.generationModel,
      lighting: this.searchRequest.lighting || null,
      watermark: this.searchRequest.addWatermark,
      googleSearch: this.searchRequest.googleSearch,
      resolution: this.searchRequest.resolution,
      style: this.searchRequest.style || null,
      colorAndTone: this.searchRequest.colorAndTone || null,
      numberOfMedia: this.searchRequest.numberOfMedia,
      composition: this.searchRequest.composition || null,
      useBrandGuidelines: this.searchRequest.useBrandGuidelines,
      mode: this.currentMode
    });
  }

  private restoreState() {
    const state = this.imageStateService.getState();
    this.searchRequest.prompt = state.prompt;
    this.searchRequest.negativePrompt = state.negativePrompt;
    this.searchRequest.aspectRatio = state.aspectRatio;
    this.searchRequest.generationModel = state.model;
    this.searchRequest.lighting = state.lighting === 'none' ? null : state.lighting;
    this.searchRequest.addWatermark = state.watermark;
    this.searchRequest.googleSearch = state.googleSearch;
    this.searchRequest.resolution = state.resolution as '4K' | '1K' | '2K' | undefined;
    this.searchRequest.style = state.style;
    this.searchRequest.colorAndTone = state.colorAndTone;
    this.searchRequest.numberOfMedia = state.numberOfMedia;
    this.searchRequest.composition = state.composition;
    this.searchRequest.useBrandGuidelines = state.useBrandGuidelines;

    this.negativePhrases = state.negativePrompt
      ? state.negativePrompt.split(', ').filter(Boolean)
      : [];
    
    // Update selected options for UI
    const modelOption = this.generationModels.find(m => m.value === state.model);
    if (modelOption) {
      this.selectedGenerationModel = modelOption.viewValue;
      this.selectedGenerationModelObject = modelOption;
    }
    const ratioOption = this.aspectRatioOptions.find(r => r.value === state.aspectRatio);
    if (ratioOption) {
      this.selectedAspectRatio = ratioOption.viewValue;
    }
    const watermarkOption = this.watermarkOptions.find(o => o.value === state.watermark);
    if (watermarkOption) {
      this.selectedWatermark = watermarkOption.viewValue;
    }

    // Run selectModel logic to set up aspect ratios and other model-specific settings
    // but don't save state again to avoid infinite loop, and don't overwrite restored state
    if (modelOption) {
      this.applyModelSettings(modelOption);
    }
  }

  private applyModelSettings(model: GenerationModelConfig) {
    const capabilities = model.capabilities;

    // Enable/Disable aspect ratios based on capabilities
    this.aspectRatioOptions.forEach(r => {
      r.disabled = !capabilities.supportedAspectRatios.includes(r.value);
    });

    // If current aspect ratio is not supported, switch to the first supported one (usually 1:1)
    if (!capabilities.supportedAspectRatios.includes(this.searchRequest.aspectRatio)) {
      const firstSupported = this.aspectRatioOptions.find(r => !r.disabled);
      if (firstSupported) {
        this.selectAspectRatio(firstSupported);
      }
    }
  }

  private applyTemplateParameters(): void {
    if (!this.templateParams) {
      return;
    }

    if (this.templateParams.prompt) {
      this.searchRequest.prompt = this.templateParams.prompt;
    }

    if (this.templateParams.numMedia) {
      this.searchRequest.numberOfMedia = this.templateParams.numMedia;
    }

    if (this.templateParams.model) {
      const templateModel = this.templateParams.model;
      const modelOption = this.generationModels.find(m =>
        m.value.toLowerCase().includes(templateModel.toLowerCase()),
      );
      if (modelOption) {
        this.selectModel(modelOption);
      }
    }

    if (this.templateParams.aspectRatio) {
      const templateAspectRatio = this.templateParams.aspectRatio;
      const aspectRatioOption = this.aspectRatioOptions.find(
        r => r.value === templateAspectRatio,
      );
      if (aspectRatioOption) {
        this.selectAspectRatio(aspectRatioOption);
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

    // Save the state so it persists and isn't overwritten by ngOnInit subscription
    this.saveState();
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

  selectModel(model: GenerationModelConfig): void {
    this.searchRequest.generationModel = model.value;
    this.selectedGenerationModel = model.viewValue;
    this.selectedGenerationModelObject = model;
    this.applyModelSettings(model);

    const capabilities = model.capabilities;

    // Enforce reference image limits
    if (this.referenceImages.length > capabilities.maxReferenceImages) {
      this.referenceImages = this.referenceImages.slice(0, capabilities.maxReferenceImages);
    }

    // Reset Google Search if not supported
    if (!capabilities.supportsGoogleSearch) {
      this.searchRequest.googleSearch = false;
    }

    this.saveState();
  }

  selectAspectRatio(ratio: { value: string; viewValue: string }): void {
    this.searchRequest.aspectRatio = ratio.value;
    this.selectedAspectRatio = ratio.viewValue;
    this.saveState();
  }

  onAspectRatioChanged(ratio: string) {
    const option = this.aspectRatioOptions.find(r => r.value === ratio);
    if (option) {
      this.selectAspectRatio(option);
    }
  }

  onOutputsChanged(count: number) {
    this.selectNumberOfImages(count);
  }

  onClearReferenceImage(data: {index: number, event: Event}) {
    this.clearImage(data.index, data.event as MouseEvent);
  }

  onReferenceImageDrop(event: DragEvent) {
    this.onDrop(event);
  }

  onPromptChanged(prompt: string) {
    this.searchRequest.prompt = prompt;
    this.service.imagePrompt = prompt;
    this.saveState();
  }

  onModeChanged(mode: string) {
    this.currentMode = mode;
    this.saveState();
  }

  onModelSelected(model: any) {
    this.selectModel(model);
  }

  onGenerateClicked() {
    this.searchTerm();
  }

  onRewriteClicked() {
    this.rewritePrompt();
  }

  onOpenImageSelectorForReference() {
    this.openImageSelector();
  }

  selectImageStyle(style: string): void {
    this.searchRequest.style === style
      ? (this.searchRequest.style = null)
      : (this.searchRequest.style = style);
    this.saveState();
  }

  selectLighting(lighting: string): void {
    this.searchRequest.lighting === lighting
      ? (this.searchRequest.lighting = null)
      : (this.searchRequest.lighting = lighting);
    this.saveState();
  }

  selectColor(color: string): void {
    this.searchRequest.colorAndTone === color
      ? (this.searchRequest.colorAndTone = null)
      : (this.searchRequest.colorAndTone = color);
    this.saveState();
  }

  selectNumberOfImages(num: number): void {
    this.searchRequest.numberOfMedia === num
      ? (this.searchRequest.numberOfMedia = 4)
      : (this.searchRequest.numberOfMedia = num);
    this.saveState();
  }

  selectComposition(composition: string): void {
    this.searchRequest.composition === composition
      ? (this.searchRequest.composition = null)
      : (this.searchRequest.composition = composition);
    this.saveState();
  }

  selectWatermark(option: { value: boolean; viewValue: string }): void {
    this.searchRequest.addWatermark = option.value;
    this.selectedWatermark = option.viewValue;
    this.saveState();
  }

  addNegativePhrase(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) this.negativePhrases.push(value);
    this.searchRequest.negativePrompt = this.negativePhrases.join(', ');

    // Clear the input value
    event.chipInput!.clear();
    this.saveState();
  }

  removeNegativePhrase(phrase: string): void {
    const index = this.negativePhrases.indexOf(phrase);
    if (index >= 0) this.negativePhrases.splice(index, 1);
    this.searchRequest.negativePrompt = this.negativePhrases.join(', ');
    this.saveState();
  }

  searchTerm() {
    if (!this.searchRequest.prompt) {
      handleInfoSnackbar(this._snackBar, 'Please enter a prompt to generate an image.');
      return;
    }

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
        handleSuccessSnackbar(this._snackBar, "Imagen 4 doesn't support images as input, so we've switched to Imagen 3 for you!");
        return;
      }
    }

    const validSourceMediaItems: SourceMediaItemLink[] = [];
    const sourceAssetIds: number[] = [];

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
      sourceMediaItems:
        this.currentMode === 'Ingredients to Image' &&
        validSourceMediaItems.length
          ? validSourceMediaItems
          : undefined,
      sourceAssetIds:
        this.currentMode === 'Ingredients to Image' && sourceAssetIds.length
          ? sourceAssetIds
          : undefined,
      workspaceId: activeWorkspaceId ?? undefined,
    };

    this.isImageGenerating = true;
    this.imagenDocuments = null;

    this.service
      .startImagenGeneration(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (initialResponse: MediaItem) => {
          console.log('Image generation job started:', initialResponse);
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
          this.saveState();
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
          this.saveState();
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
    this.imageStateService.resetState();
  }

  editResultImage(index: number) {
    if (!this.imagenDocuments || !this.imagenDocuments.presignedUrls) return;
    const imageUrl = this.imagenDocuments.presignedUrls[index];
    const mediaItemId = this.imagenDocuments.id;

    // Select Nano Banana Pro (gemini-3-pro-image-preview)
    const nanoBananaPro = this.generationModels.find(m => m.value === 'gemini-3-pro-image-preview');
    if (nanoBananaPro) {
      this.selectModel(nanoBananaPro);
    }

    // Check if we reached the limit
    if (this.referenceImages.length >= this.selectedGenerationModelObject.capabilities.maxReferenceImages) {
      handleInfoSnackbar(this._snackBar, `You can only add up to ${this.selectedGenerationModelObject.capabilities.maxReferenceImages} reference images for this model.`);
      return;
    }

    // Switch to Ingredients to Image mode
    this.currentMode = 'Ingredients to Image';

    // Add to reference images
    const refImage: ReferenceImage = {
      previewUrl: imageUrl,
      sourceMediaItem: {
        mediaItemId: mediaItemId,
        mediaIndex: index,
        role: 'input',
      },
      isNew: true,
    };
    this.referenceImages.push(refImage);

    // Remove highlight after 2 seconds
    setTimeout(() => {
      refImage.isNew = false;
    }, 2000);

    this.saveState();
    this.scrollToBottom();
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
      state.sourceAssetIds.forEach((assetId: number, index: number) => {
        const isDuplicate = this.referenceImages.some(
          img => img.sourceAssetId === assetId,
        );
        if (!isDuplicate) {
          this.referenceImages.push({
            previewUrl:
              (state.previewUrls && state.previewUrls[index]) ||
              state.previewUrl ||
              '',
            sourceAssetId: assetId,
          });
        } else {
          handleInfoSnackbar(this._snackBar, 'Image already added.');
        }
      });
    }

    if (state.sourceMediaItems && state.sourceMediaItems.length > 0) {
      state.sourceMediaItems.forEach(
        (item: SourceMediaItemLink, index: number) => {
          const isDuplicate = this.referenceImages.some(
            img =>
              img.sourceMediaItem &&
              img.sourceMediaItem.mediaItemId === item.mediaItemId &&
              img.sourceMediaItem.mediaIndex === item.mediaIndex,
          );
          if (!isDuplicate) {
            this.referenceImages.push({
              previewUrl:
                (state.previewUrls && state.previewUrls[index]) ||
                state.previewUrl ||
                '',
              sourceMediaItem: item,
            });
          } else {
            handleInfoSnackbar(this._snackBar, 'Image already added.');
          }
        },
      );
    }

    this.selectModel(
      this.generationModels.find(m => m.value === state.generationModel) ||
      this.generationModels[0],
    );
    this.selectedAspectRatio =
      this.aspectRatioOptions.find(r => r.value === state.aspectRatio)
        ?.viewValue || this.aspectRatioOptions[0].viewValue;

    // Switch to Ingredients to Image mode if we have reference images
    if (this.referenceImages.length > 0) {
      this.currentMode = 'Ingredients to Image';
      this.saveState();
    }
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
    let sourceAssetId: number | undefined = undefined;
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
        isNew: true,
      };

      // Check for duplicates
      const isDuplicate = this.referenceImages.some(img => {
        if (sourceAssetId && img.sourceAssetId === sourceAssetId) return true;
        if (
          sourceMediaItem &&
          img.sourceMediaItem &&
          img.sourceMediaItem.mediaItemId === sourceMediaItem.mediaItemId &&
          img.sourceMediaItem.mediaIndex === sourceMediaItem.mediaIndex
        )
          return true;
        return false;
      });

      if (isDuplicate) {
        handleInfoSnackbar(this._snackBar, 'This image is already selected.');
        return;
      }

      if (index !== undefined && index < this.referenceImages.length) {
        this.referenceImages[index] = refImage;
      } else {
        this.referenceImages.push(refImage);
      }

      setTimeout(() => {
        refImage.isNew = false;
      }, 2000);
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



  scrollToBottom() {
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
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
          modelImageMediaIndex: index,
          modelImageGcsUri: this.imagenDocuments.gcsUris?.[index],
        },
      },
    };
    this.router.navigate(['/vto'], navigationExtras);
  }


  private applySourceAssets(sourceAssets: EnrichedSourceAsset[]) {
    this.referenceImages = sourceAssets.map(asset => ({
      previewUrl: asset.presignedUrl,
      sourceAssetId: asset.assetId,
      file: undefined,
      sourceMediaItem: undefined
    }));
    
    if (this.referenceImages.length > 0) {
      this.currentMode = 'Ingredients to Image';
    }
    this.saveState();
  }
}
