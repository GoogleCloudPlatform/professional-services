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
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  AfterViewInit,
  signal,
} from '@angular/core';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {finalize, Observable} from 'rxjs';
import {
  ConcatenationInput,
  SearchService,
} from '../services/search/search.service';
import {Router} from '@angular/router';
import {
  ReferenceImage,
  SourceMediaItemLink,
  VeoRequest,
} from '../common/models/search.model';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {
  ImageSelectorComponent,
  MediaItemSelection,
} from '../common/components/image-selector/image-selector.component';
import {
  EnrichedSourceAsset,
  GenerationParameters,
} from '../fun-templates/media-template.model';
import { handleErrorSnackbar, handleInfoSnackbar, handleSuccessSnackbar } from '../utils/handleMessageSnackbar';
import {JobStatus, MediaItem} from '../common/models/media-item.model';
import {
  SourceAssetResponseDto,
  SourceAssetService,
} from '../common/services/source-asset.service';
import {HttpClient} from '@angular/common/http';
import {WorkspaceStateService} from '../services/workspace/workspace-state.service';
import { MODEL_CONFIGS, GenerationModelConfig } from '../common/config/model-config';
import {AssetTypeEnum} from '../admin/source-assets-management/source-asset.model';
import {ImageCropperDialogComponent} from '../common/components/image-cropper-dialog/image-cropper-dialog.component';
import {VideoStateService} from '../services/video-state.service';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrl: './video.component.scss',
})
export class VideoComponent implements OnInit, AfterViewInit {
  // This observable will always reflect the current job's state
  activeVideoJob$: Observable<MediaItem | null>;
  public readonly JobStatus = JobStatus; // Expose enum to the template

  @HostListener('window:keydown.control.enter', ['$event'])
  handleCtrlEnter(event: KeyboardEvent) {
    if (!this.isLoading) {
      event.preventDefault();
      this.searchTerm();
    }
  }

  templateParams: GenerationParameters | undefined;

  // --- Component State ---
  videoDocuments: MediaItem | null = null;
  isLoading = false;
  isAudioGenerationDisabled = false;
  startImageAssetId: number | null = null;
  endImageAssetId: number | null = null;
  sourceMediaItems: (SourceMediaItemLink | null)[] = [null, null];
  image1Preview: string | null = null;
  image2Preview: string | null = null;
  showDefaultDocuments = false;
  showErrorOverlay = true;
  isConcatenateMode = false;
  isExtensionMode = false;
  referenceImages: ReferenceImage[] = [];
  referenceImagesType: 'ASSET' | 'STYLE' = 'ASSET';
  currentMode = 'Text to Video';
  modes = [
    { value: 'Text to Video', icon: 'description', label: 'Text to Video' },
    { value: 'Frames to Video', icon: 'image', label: 'Frames to Video' },
    { value: 'Ingredients to Video', icon: 'layers', label: 'Ingredients to Video' },
    { value: 'Extend Video', icon: 'extension', label: 'Extend Video' },
    { value: 'Concatenate Video', icon: 'merge', label: 'Concatenate Video' },
  ];

  // Internal state to track input types
  private _input1IsVideo = false;
  private _input2IsVideo = false;

  // --- Search Request Object ---
  // This object holds the current state of all user selections.
  searchRequest: VeoRequest = {
    prompt: '',
    generationModel: 'veo-3.1-generate-preview',
    aspectRatio: '16:9',
    numberOfMedia: 4,
    style: null,
    lighting: null,
    colorAndTone: null,
    composition: null,
    negativePrompt: '',
    generateAudio: true,
    durationSeconds: 8,
    useBrandGuidelines: false,
    referenceImages: [],
  };

  // --- Negative Prompt Chips ---
  negativePhrases: string[] = [];

  // --- Dropdown Options ---
  generationModels: GenerationModelConfig[] = MODEL_CONFIGS.filter(m => m.type === 'VIDEO');
  selectedGenerationModel = this.generationModels[0].viewValue;
  aspectRatioOptions: {value: string; viewValue: string; disabled: boolean}[] =
    [
      {value: '16:9', viewValue: '16:9 \n Horizontal', disabled: false},
      {value: '9:16', viewValue: '9:16 \n Vertical', disabled: false},
    ];
  selectedAspectRatio = this.aspectRatioOptions[0].viewValue;
  videoStyles = [
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
  numberOfVideosOptions = [1, 2, 3, 4];
  durationOptions = [8];
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

  constructor(
    private sanitizer: DomSanitizer,
    public matIconRegistry: MatIconRegistry,
    public service: SearchService,
    public router: Router,
    private _snackBar: MatSnackBar,
    public dialog: MatDialog,
    private http: HttpClient,
    private workspaceStateService: WorkspaceStateService,
    private sourceAssetService: SourceAssetService,
    private videoStateService: VideoStateService,
  ) {
    this.activeVideoJob$ = this.service.activeVideoJob$;

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
      );

    const navigation = this.router.getCurrentNavigation();
    this.templateParams =
      navigation?.extras.state?.['templateParams'] ||
      history.state?.templateParams;
    this.applyTemplateParameters();

    const remixState = navigation?.extras.state?.['remixState'];
    if (remixState) {
      this.applyRemixState(remixState);
    }

    const sourceAssets = navigation?.extras.state?.[
      'sourceAssets'
    ] as EnrichedSourceAsset[];
    if (sourceAssets) {
      this.applySourceAssets(sourceAssets);
    }

    // Load persisted prompt
    this.searchRequest.prompt = this.service.videoPrompt;
  }

  ngOnInit(): void {
    this.restoreState();
  }

  public saveState() {
    this.videoStateService.updateState({
      prompt: this.searchRequest.prompt,
      aspectRatio: this.searchRequest.aspectRatio,
      model: this.searchRequest.generationModel,
      style: this.searchRequest.style,
      colorAndTone: this.searchRequest.colorAndTone,
      lighting: this.searchRequest.lighting,
      numberOfMedia: this.searchRequest.numberOfMedia,
      durationSeconds: this.searchRequest.durationSeconds,
      composition: this.searchRequest.composition,
      generateAudio: this.searchRequest.generateAudio,
      negativePrompt: this.searchRequest.negativePrompt || '',
      useBrandGuidelines: this.searchRequest.useBrandGuidelines,
      mode: this.currentMode,
    });
  }

  private restoreState() {
    const state = this.videoStateService.getState();
    this.searchRequest.prompt = state.prompt;
    this.searchRequest.aspectRatio = state.aspectRatio;
    this.searchRequest.generationModel = state.model;
    this.searchRequest.style = state.style;
    this.searchRequest.colorAndTone = state.colorAndTone;
    this.searchRequest.lighting = state.lighting;
    this.searchRequest.numberOfMedia = state.numberOfMedia;
    this.searchRequest.durationSeconds = state.durationSeconds;
    this.searchRequest.composition = state.composition;
    this.searchRequest.generateAudio = state.generateAudio;
    this.searchRequest.negativePrompt = state.negativePrompt;
    this.searchRequest.useBrandGuidelines = state.useBrandGuidelines;
    this.currentMode = state.mode || 'Text to Video';

    this.negativePhrases = state.negativePrompt
      ? state.negativePrompt.split(', ').filter(Boolean)
      : [];

    // Update selected options for UI
    const modelOption = this.generationModels.find(m => m.value === state.model);
    if (modelOption) {
      this.selectedGenerationModel = modelOption.viewValue;
    }
    const ratioOption = this.aspectRatioOptions.find(r => r.value === state.aspectRatio);
    if (ratioOption) {
      this.selectedAspectRatio = ratioOption.viewValue;
    }
  }

  ngAfterViewInit(): void {
    const remixState = history.state?.remixState;
    // Use a timeout to ensure the view is stable before opening a dialog.
    setTimeout(() => {
      if (remixState?.startConcatenation) {
        this.openImageSelector(2); // Open selector for the second video
      }
    }, 1500);
  }

  private path = '../../assets/images';

  private setPath(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  selectModel(model: {value: string; viewValue: string}): void {
    this.searchRequest.generationModel = model.value;
    this.selectedGenerationModel = model.viewValue;

    const isVeo2 =
      model.value.includes('veo-2.0') && model.value !== 'veo-2.0-generate-exp';
    const isVeo2Exp = model.value === 'veo-2.0-generate-exp';

    if (isVeo2) {
      // Veo 2 models do not support audio.
      this.isAudioGenerationDisabled = true;
      this.searchRequest.generateAudio = false;

      // Re-enable all aspect ratios for Veo 2.
      this.aspectRatioOptions.forEach(opt => (opt.disabled = false));
    } else if (isVeo2Exp) {
      // Veo 2 Exp model does not support audio.
      this.isAudioGenerationDisabled = true;
      this.searchRequest.generateAudio = false;
      this.aspectRatioOptions.forEach(opt => (opt.disabled = false));
    } else {
      this.clearOtherImage(1);

      // Veo 3 models support audio.
      this.isAudioGenerationDisabled = false;
      this.searchRequest.generateAudio = true;

      // Veo 3 only supports 16:9 and 9:16 aspect ratios.
      const supportedRatios = ['16:9', '9:16'];
      if (!supportedRatios.includes(this.searchRequest.aspectRatio)) {
        this.searchRequest.aspectRatio = '16:9';
        const landscapeOption = this.aspectRatioOptions.find(
          opt => opt.value === '16:9',
        )!;
        this.selectedAspectRatio = landscapeOption.viewValue;
      }

      this.aspectRatioOptions.forEach(opt => {
        opt.disabled = !supportedRatios.includes(opt.value);
      });
    }
  }

  selectAspectRatio(ratio: string | {value: string; viewValue: string}): void {
    if (typeof ratio === 'string') {
      this.searchRequest.aspectRatio = ratio;
      const option = this.aspectRatioOptions.find(
        opt => opt.value === ratio || opt.viewValue.includes(ratio),
      );
      if (option) {
        this.selectedAspectRatio = option.viewValue;
      }
    } else {
      this.searchRequest.aspectRatio = ratio.value;
      this.selectedAspectRatio = ratio.viewValue;
    }
    this.saveState();
  }

  selectVideoStyle(style: string): void {
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

  selectNumberOfVideos(num: number): void {
    this.searchRequest.numberOfMedia = num;
    this.saveState();
  }

  selectDuration(seconds: number): void {
    this.searchRequest.durationSeconds = seconds;
    this.saveState();
  }

  selectComposition(composition: string): void {
    this.searchRequest.composition === composition
      ? (this.searchRequest.composition = null)
      : (this.searchRequest.composition = composition);
    this.saveState();
  }

  toggleAudio(): void {
    if (!this.isAudioGenerationDisabled) {
      this.searchRequest.generateAudio = !this.searchRequest.generateAudio;
      this.saveState();
    }
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
  onPromptChanged(prompt: string) {
    this.searchRequest.prompt = prompt;
    this.service.videoPrompt = prompt;
    this.saveState();
  }

  onModeChanged(mode: string) {
    console.log('Mode changed to:', mode);
    if (this.currentMode === mode) {
      return;
    }

    // If we are switching FROM Concatenate TO Extend, we should keep the first video
    // but clear the second one (as Extend only takes one video input).
    if (this.currentMode === 'Concatenate Video' && mode === 'Extend Video') {
      if (this.image2Preview) {
        this.clearVideo(2);
      }
    }
    // If we are switching FROM Extend TO Concatenate, we keep the first video (if any).
    // No need to clear anything.

    // If we are entering Extend or Concatenate mode, ensure we only keep video inputs.
    if (mode === 'Extend Video' || mode === 'Concatenate Video') {
      if (this.image1Preview && !this._input1IsVideo) {
        this.clearInput(1);
      }
      if (this.image2Preview && !this._input2IsVideo) {
        this.clearInput(2);
      }
    }

    // If we are entering Frames to Video mode, ensure we only keep image inputs.
    if (mode === 'Frames to Video') {
      if (this.image1Preview && this._input1IsVideo) {
        this.clearVideo(1);
      }
      if (this.image2Preview && this._input2IsVideo) {
        this.clearVideo(2);
      }
    }

    this.currentMode = mode;
    
    if (mode === 'Extend Video') {
      this.isExtensionMode = true;
      this.isConcatenateMode = false;
      this._showModeNotification('extend');
    } else if (mode === 'Concatenate Video') {
      this.isConcatenateMode = true;
      this.isExtensionMode = false;
      this._showModeNotification('concatenate');
    } else {
      this.isExtensionMode = false;
      this.isConcatenateMode = false;
    }

    this.saveState();
  }



  onClearReferenceImage(data: {index: number, event: Event}) {
    this.clearReferenceImage(data.index, data.event as MouseEvent);
  }

  searchTerm() {
    const activeWorkspaceId = this.workspaceStateService.getActiveWorkspaceId();
    this.searchRequest.workspaceId = activeWorkspaceId || '';
    const workspaceId = activeWorkspaceId || '';

    if (this.isConcatenateMode) {
      const inputs: ConcatenationInput[] = [];

      // Input 1
      if (this.sourceMediaItems[0]) {
        inputs.push({
          id: this.sourceMediaItems[0].mediaItemId,
          type: 'media_item',
        });
      } else if (this.startImageAssetId !== null) {
        inputs.push({id: this.startImageAssetId, type: 'source_asset'});
      }

      // Input 2
      if (this.sourceMediaItems[1]) {
        inputs.push({
          id: this.sourceMediaItems[1].mediaItemId,
          type: 'media_item',
        });
      } else if (this.endImageAssetId !== null) {
        inputs.push({id: this.endImageAssetId, type: 'source_asset'});
      }

      if (inputs.length < 2) {
        this._snackBar.open(
          'Please select at least two videos to concatenate.',
          'OK',
          {duration: 5000},
        );
        return;
      }

      const name = 'Concatenated Video';

      this.isLoading = true;
      this.service
        .concatenateVideos({
          workspaceId,
          name,
          inputs,
          aspectRatio: this.searchRequest.aspectRatio,
        })
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          error: err =>
            handleErrorSnackbar(this._snackBar, err, 'Concatenate videos'),
        });
      return;
    }
    if (!this.searchRequest.prompt && !this.isExtensionMode) {
      handleInfoSnackbar(this._snackBar, 'Please enter a prompt to generate a video.');
      return;
    }
    this.showErrorOverlay = true;

    const hasSourceAssets = this.startImageAssetId || this.endImageAssetId;
    const hasSourceMediaItems = this.sourceMediaItems.some(i => !!i);
    const isVeo3 = [
      'veo-3.0-fast-generate-001',
      'veo-3.0-generate-001',
    ].includes(this.searchRequest.generationModel);

    if (
      (hasSourceAssets || hasSourceMediaItems) &&
      isVeo3 &&
      !this.isExtensionMode &&
      !this.isConcatenateMode
    ) {
      const veo31Model = this.generationModels.find(
        m => m.value === 'veo-3.1-generate-preview',
      );
      if (veo31Model) {
        this.selectModel(veo31Model);
        handleSuccessSnackbar(this._snackBar, "Veo 3 doesn't support images as input, so we've switched to Veo 3.1 for you.");
        return;
      }
    }

    this.isLoading = true;
    this.videoDocuments = null;

    const validSourceMediaItems = this.sourceMediaItems.filter(
      (i): i is SourceMediaItemLink => !!i,
    );

    // --- Build the two separate R2V reference payloads ---
    const referenceImagesPayload: {
      assetId: number;
      referenceType: 'ASSET' | 'STYLE';
    }[] = [];
    const sourceMediaItemsForReference: SourceMediaItemLink[] = [];

    for (const refImage of this.referenceImages) {
      if (refImage.sourceAssetId) {
        referenceImagesPayload.push({
          assetId: refImage.sourceAssetId,
          referenceType: this.referenceImagesType, // Use the global type
        });
      } else if (refImage.sourceMediaItem) {
        sourceMediaItemsForReference.push({
          ...refImage.sourceMediaItem,
          // Use the global type to determine the role
          role:
            this.referenceImagesType === 'STYLE'
              ? 'image_reference_style'
              : 'image_reference_asset',
        });
      }
    }

    const payload: VeoRequest = {
      ...this.searchRequest,
      startImageAssetId:
        this.currentMode === 'Frames to Video' && !this._input1IsVideo
          ? (this.startImageAssetId ?? undefined)
          : undefined,
      sourceVideoAssetId:
        (this.currentMode === 'Frames to Video' && this._input1IsVideo) ||
        this.currentMode === 'Extend Video'
          ? (this.startImageAssetId ?? undefined)
          : undefined,
      endImageAssetId:
        this.currentMode === 'Frames to Video'
          ? (this.endImageAssetId ?? undefined)
          : undefined,
      referenceImages:
        this.currentMode === 'Ingredients to Video' &&
        referenceImagesPayload.length > 0
          ? referenceImagesPayload
          : undefined,
      sourceMediaItems:
        this.currentMode === 'Ingredients to Video'
          ? sourceMediaItemsForReference
          : this.currentMode === 'Frames to Video' ||
              this.currentMode === 'Extend Video'
            ? validSourceMediaItems
            : undefined,
    };

    // TODO: Add notification when video is completed after the pooling
    this.service
      .startVeoGeneration(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (initialResponse: MediaItem) => {
          // This logic is now handled by the 'tap' operator in the service,
          // but it's fine to also have it here. The key is the 'error' block.
          console.log('Job started successfully:', initialResponse);
          // The component's main display will be driven by the service's observable
        },
        error: error => {
          // This block will now execute correctly if the POST request fails.
          console.error('Search error:', error);
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
        targetType: 'video',
        userPrompt: promptToSend,
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response: {prompt: string}) => {
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
      .getRandomPrompt({target_type: 'video'})
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response: {prompt: string}) => {
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
      generationModel: 'veo-3.0-generate-001',
      aspectRatio: '16:9',
      numberOfMedia: 4,
      style: null,
      lighting: null,
      colorAndTone: null,
      composition: null,
      negativePrompt: '',
      generateAudio: true,
      durationSeconds: 8,
      useBrandGuidelines: false,
    };
    this.videoStateService.resetState();
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

    if (this.templateParams.durationSeconds)
      this.searchRequest.durationSeconds = this.templateParams.durationSeconds;

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

    this.saveState();
  }

  openImageSelector(imageNumber: 1 | 2): void {
    const dialogRef = this.dialog.open(ImageSelectorComponent, {
      width: '90vw',
      height: '80vh',
      maxWidth: '90vw',
      data: {
        mimeType: this.getMimeTypeForSelector(),
      },
      panelClass: 'image-selector-dialog',
    });

    dialogRef
      .afterClosed()
      .subscribe((result: MediaItemSelection | SourceAssetResponseDto) => {
        if (result) {
          this.processInput(result, imageNumber);
          this.updateModeAndNotify();
        }
        // If a new image is selected, clear the other one.
        this.clearOtherImage(imageNumber);
      });
  }

  private processInput(
    result: MediaItemSelection | SourceAssetResponseDto,
    imageNumber: 1 | 2,
  ) {
    // 1. Determine if the new input is a video
    const isVideo =
      'gcsUri' in result
        ? result.mimeType?.startsWith('video/')
        : (result as MediaItemSelection).mediaItem.mimeType?.startsWith(
            'video/',
          );

    if (isVideo) {
      // If we are in Extend Video mode, we don't need to force a switch if the model supports it.
      // Veo 3.1 supports video extension.
      const isVeo30 = [
        'veo-3.0-fast-generate-001',
        'veo-3.0-generate-001',
      ].includes(this.searchRequest.generationModel);

      if (isVeo30) {
        const veo31Model = this.generationModels.find(
          m => m.value === 'veo-3.1-generate-preview',
        );
        if (veo31Model) {
          this.selectModel(veo31Model);
          handleSuccessSnackbar(
            this._snackBar,
            "Veo 3.0 doesn't support video as input, so we've switched to Veo 3.1 for you.",
          );
        }
      }
    }
    this.clearSourceMediaItem(imageNumber);
    this.clearImageAssetId(imageNumber);

    if (imageNumber === 1) {
      this._input1IsVideo = !!isVideo;
      this.image1Preview = this.getPreviewUrl(result);
      this.setInputSource(1, result, 'video_extension_source');
    } else {
      // imageNumber === 2
      this._input2IsVideo = !!isVideo;
      this.image2Preview = this.getPreviewUrl(result);
      this.setInputSource(2, result, 'end_frame');
    }
  }

  private getPreviewUrl(
    result: MediaItemSelection | SourceAssetResponseDto,
  ): string | null {
    if ('gcsUri' in result) {
      return result.presignedThumbnailUrl || result.presignedUrl;
    }
    const selection = result as MediaItemSelection;
    const isVideo = selection.mediaItem.mimeType?.startsWith('video/');
    const urlArray = isVideo
      ? selection.mediaItem.presignedThumbnailUrls
      : selection.mediaItem.presignedUrls;
    return urlArray?.[selection.selectedIndex] || null;
  }

  private setInputSource(
    imageNumber: 1 | 2,
    result: MediaItemSelection | SourceAssetResponseDto,
    role: string,
  ) {
    const index = imageNumber - 1;

    if ('gcsUri' in result) {
      const targetAssetId =
        imageNumber === 1 ? 'startImageAssetId' : 'endImageAssetId';
      this[targetAssetId] = result.id;
    } else {
      const selection = result as MediaItemSelection;
      const isVideo = selection.mediaItem.mimeType?.startsWith('video/');
      // Determine role based on whether it's a video for extend/concat or just a frame
      const finalRole = isVideo
        ? role
        : imageNumber === 1
          ? 'start_frame'
          : 'end_frame';
      this.sourceMediaItems[index] = {
        mediaItemId: selection.mediaItem.id,
        mediaIndex: selection.selectedIndex,
        role: finalRole,
      };
    }
  }

  // This method is called by both click and drop events
  handleFileUpload(file: File, imageNumber: 1 | 2): void {
    if (file.type.startsWith('image/')) {
      // If it's an image, open the cropper
      this.openCropperDialog(file, imageNumber);
    } else if (file.type.startsWith('video/')) {
      // If it's a video, upload directly
      this.uploadVideoDirectly(file, imageNumber);
    } else {
      handleErrorSnackbar(
        this._snackBar,
        {message: 'Unsupported file type.'},
        'File Upload',
      );
    }
  }

  openCropperDialog(file: File, imageNumber: 1 | 2) {
    const dialogRef = this.dialog.open(ImageCropperDialogComponent, {
      data: {
        imageFile: file,
        assetType: AssetTypeEnum.GENERIC_IMAGE,
      },
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((result: SourceAssetResponseDto) => {
      if (result && result.id) {
        this.processInput(result, imageNumber);
        this.updateModeAndNotify();
        this.clearOtherImage(imageNumber);
      }
    });
  }

  uploadVideoDirectly(file: File, imageNumber: 1 | 2) {
    this.isLoading = true;
    // No aspectRatio is sent for videos, so we don't pass the second argument
    this.sourceAssetService
      .uploadAsset(file)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: asset => {
          this.processInput(asset, imageNumber);
          this.updateModeAndNotify();
          this.clearOtherImage(imageNumber);
        },
        error: error => {
          handleErrorSnackbar(this._snackBar, error, 'File upload');
        },
      });
  }

  onDrop(event: DragEvent, imageNumber: 1 | 2) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        // If it's an IMAGE, open the cropper dialog
        this.openCropperDialog(file, imageNumber);
      } else if (file.type.startsWith('video/')) {
        // If it's a VIDEO, upload it directly
        this.uploadVideoDirectly(file, imageNumber);
      } else {
        handleErrorSnackbar(
          this._snackBar,
          {message: 'Unsupported file type.'},
          'File Upload',
        );
      }
    }
  }

  clearInput(imageNumber: 1 | 2) {
    if (imageNumber === 1) {
      this.startImageAssetId = null;
      this.image1Preview = null;
      this._input1IsVideo = false;
      this.clearSourceMediaItem(1);

      // If the second input was a video, move it to the first slot.
      if (this._input2IsVideo) {
        this.image1Preview = this.image2Preview;
        this.sourceMediaItems[0] = this.sourceMediaItems[1];
        this.startImageAssetId = this.endImageAssetId;
        this._input1IsVideo = true;
        this.clearInput(2); // Clear the second slot now that it's moved
        return; // updateModeAndNotify will be called by the recursive clearInput
      }
    } else {
      this.endImageAssetId = null;
      this.image2Preview = null;
      this._input2IsVideo = false;
      this.clearSourceMediaItem(2);
    }

    this.updateModeAndNotify();
  }

  clearVideo(imageNumber: 1 | 2) {
    this.clearInput(imageNumber);
  }

  onClearImage(data: {num: 1 | 2, event: Event}) {
    data.event.stopPropagation();
    this.clearInput(data.num);
  }

  private clearImageAssetId(imageNumber: 1 | 2) {
    const targetAssetId =
      imageNumber === 1 ? 'startImageAssetId' : 'endImageAssetId';
    this[targetAssetId] = null;
    this.clearSourceMediaItem(imageNumber); // Clear the corresponding media item slot
  }

  private clearSourceMediaItem(imageNumber: 1 | 2) {
    // Set the specific index to null to clear the slot for that image.
    if (this.sourceMediaItems.length >= imageNumber) {
      this.sourceMediaItems[imageNumber - 1] = null;
    }
  }

  private clearOtherImage(imageNumberJustSet: 1 | 2) {
    const isVeo3 = [
      'veo-3.0-fast-generate-001',
      'veo-3.0-generate-001',
    ].includes(this.searchRequest.generationModel);

    const image1Set = !!this.startImageAssetId || !!this.sourceMediaItems[0];
    const image2Set = !!this.endImageAssetId || !!this.sourceMediaItems[1];
    const totalImages = (image1Set ? 1 : 0) + (image2Set ? 1 : 0);

    if (
      isVeo3 &&
      !this.isConcatenateMode &&
      !this.isExtensionMode &&
      totalImages === 2
    ) {
      const imageToClear = imageNumberJustSet === 1 ? 2 : 1;
      if (imageToClear === 1) {
        this.startImageAssetId = null;
        this.image1Preview = null;
        this.sourceMediaItems[0] = null;
      } else {
        // Clearing image 2
        this.endImageAssetId = null;
        this.image2Preview = null;
        this.sourceMediaItems[1] = null;
      }

      handleSuccessSnackbar(this._snackBar, "Veo 3 doesn't support 2 images as input, so we've cleared the other one for you.");
    }
  }

  closeErrorOverlay() {
    this.showErrorOverlay = false;
  }

  private resetInputs() {
    this.sourceMediaItems = [null, null];
    this.image1Preview = null;
    this.image2Preview = null;
    this.startImageAssetId = null;
    this.endImageAssetId = null;
    this.isExtensionMode = false;
    this.isConcatenateMode = false;
    this.service.clearActiveVideoJob();
  }

  private updateModeAndNotify() {
    if (this._input1IsVideo && this._input2IsVideo) {
      if (this.currentMode !== 'Concatenate Video') {
        this.currentMode = 'Concatenate Video';
        this.selectedMode.set('Concatenate Video');
        this.isConcatenateMode = true;
        this.isExtensionMode = false;
        this.searchRequest.prompt = '';
        this._showModeNotification('concatenate');
      }
    } else if (this._input1IsVideo || this._input2IsVideo) {
      // If we are already in Concatenate Video mode, don't switch to Extend just because we have 1 video.
      // We assume the user is building up to 2 videos.
      if (this.currentMode === 'Concatenate Video') {
        return;
      }

      if (this.currentMode !== 'Extend Video') {
        this.currentMode = 'Extend Video';
        this.selectedMode.set('Extend Video');
        this.isExtensionMode = true;
        this.isConcatenateMode = false;
        this.searchRequest.prompt = '';
        this._showModeNotification('extend');
      }
    } else {
      this.isExtensionMode = false;
      this.isConcatenateMode = false;
    }
  }

  private _showModeNotification(mode: 'extend' | 'concatenate') {
    let message = '';
    if (mode === 'extend') {
      message =
        'Extend Mode: You can now write a prompt to add a new segment to this video.';
    } else if (mode === 'concatenate') {
      message =
        'Concatenate Mode: The prompt is disabled. Click "Concatenate" to join the videos.';
    }

    handleInfoSnackbar(this._snackBar, message);
  }

  private getMimeTypeForSelector():
    | 'image/*'
    | 'image/png'
    | 'video/mp4'
    | null {
    if (
      this.isConcatenateMode ||
      this.isExtensionMode ||
      this.currentMode === 'Extend Video' ||
      this.currentMode === 'Concatenate Video'
    ) {
      return 'video/mp4';
    }

    if (this.currentMode === 'Frames to Video') {
      return 'image/*';
    }

    const anyInputIsPresent = !!this.image1Preview || !!this.image2Preview;
    const anyInputIsVideo = this._input1IsVideo || this._input2IsVideo;

    if (!anyInputIsPresent) {
      return null;
    }

    // If any slot has something, restrict to that type's mimeType.
    return anyInputIsVideo ? 'video/mp4' : 'image/*';
  }

  private applyRemixState(remixState: {
    prompt?: string;
    startImageAssetId?: number;
    endImageAssetId?: number;
    startImagePreviewUrl?: string;
    endImagePreviewUrl?: string;
    sourceMediaItems?: SourceMediaItemLink[];
    startConcatenation?: boolean;
    aspectRatio?: string;
    generationModel?: string;
  }): void {
    this.resetInputs();
    if (remixState.prompt) this.searchRequest.prompt = remixState.prompt;
    if (remixState.startImageAssetId) {
      this.startImageAssetId = remixState.startImageAssetId;
      this.sourceMediaItems[0] = null;
    }
    if (remixState.endImageAssetId) {
      this.endImageAssetId = remixState.endImageAssetId;
      this.sourceMediaItems[1] = null;
    }
    if (remixState.startImagePreviewUrl)
      this.image1Preview = remixState.startImagePreviewUrl;
    if (remixState.endImagePreviewUrl)
      this.image2Preview = remixState.endImagePreviewUrl;

    if (remixState.sourceMediaItems?.length) {
      remixState.sourceMediaItems.forEach(item => {
        if (item.role === 'start_frame') {
          this.sourceMediaItems[0] = item;
          this.startImageAssetId = null;
          this.image1Preview = remixState.startImagePreviewUrl || null;
          // Switch to Ingredients to Video mode if we have start or end frames
          this.currentMode = 'Frames to Video';
          this.saveState();
        } else if (item.role === 'end_frame') {
          this.sourceMediaItems[1] = item;
          this.endImageAssetId = null;
          this.image2Preview = remixState.endImagePreviewUrl || null;
          // Switch to Ingredients to Video mode if we have start or end frames
          this.currentMode = 'Frames to Video';
          this.saveState();
        } else if (item.role === 'video_extension_source') {
          // This is the case for extending a video
          this.sourceMediaItems[0] = item;
          this._input1IsVideo = true;
          this.startImageAssetId = null;
          this.image1Preview = remixState.startImagePreviewUrl || null;
          this.isExtensionMode = true;
          this.searchRequest.prompt = ''; // Clear prompt for extension
        } else if (item.role === 'concatenation_source') {
          this.sourceMediaItems[0] = {...item, role: 'video_source'};
          this.image1Preview = remixState.startImagePreviewUrl || null;
          this._input1IsVideo = true;
          this.isConcatenateMode = true;
          this.searchRequest.prompt = '';
        }
      });
    }

    if (remixState.startConcatenation) {
      this.isConcatenateMode = true;
    }

    if (remixState.aspectRatio) {
      const aspectRatioOption = this.aspectRatioOptions.find(
        r => r.value === remixState.aspectRatio,
      );
      if (aspectRatioOption) {
        this.searchRequest.aspectRatio = aspectRatioOption.value;
        this.selectedAspectRatio = aspectRatioOption.viewValue;
      }
    }

    if (remixState.generationModel) {
      const modelOption = this.generationModels.find(
        m => m.value === remixState.generationModel,
      );
      if (modelOption) this.selectModel(modelOption);
    }
  }

  handleExtendWithAi(event: {mediaItem: MediaItem; selectedIndex: number}) {
    const remixState = {
      sourceMediaItems: [
        {
          mediaItemId: event.mediaItem.id,
          mediaIndex: event.selectedIndex,
          role: 'video_extension_source',
        },
      ],
      startImagePreviewUrl:
        event.mediaItem.presignedThumbnailUrls?.[event.selectedIndex],
    };
    this.applyRemixState(remixState);
  }

  handleConcatenate(event: {mediaItem: MediaItem; selectedIndex: number}) {
    const remixState = {
      sourceMediaItems: [
        {
          mediaItemId: event.mediaItem.id,
          mediaIndex: event.selectedIndex,
          role: 'concatenation_source',
        },
      ],
      startImagePreviewUrl:
        event.mediaItem.presignedThumbnailUrls?.[event.selectedIndex],
      startConcatenation: true,
    };
    this.applyRemixState(remixState);
    // Use a timeout to ensure the view is stable before opening a dialog.
    setTimeout(() => {
      this.openImageSelector(2);
    }, 1500);
  }

  openImageSelectorForReference(): void {
    if (this.referenceImages.length >= 3) return;
    const dialogRef = this.dialog.open(ImageSelectorComponent, {
      width: '90vw',
      height: '80vh',
      maxWidth: '90vw',
      data: {
        mimeType: 'image/*', // Only allow images for references
      },
      panelClass: 'image-selector-dialog',
    });

    dialogRef
      .afterClosed()
      .subscribe((result: MediaItemSelection | SourceAssetResponseDto) => {
        if (result && this.referenceImages.length < 3) {
          if ('gcsUri' in result) {
            this.referenceImages.push({
              sourceAssetId: result.id,
              previewUrl: result.presignedUrl || '',
            });
          } else {
            const previewUrl =
              result.mediaItem.presignedUrls?.[result.selectedIndex];
            if (previewUrl) {
              this.referenceImages.push({
                previewUrl: previewUrl,
                sourceMediaItem: {
                  mediaItemId: result.mediaItem.id,
                  mediaIndex: result.selectedIndex,
                  role: 'image_reference_asset', // Role is now set dynamically in searchTerm
                },
              });
            }
          }
          this.handleReferenceImageAdded();
        }
      });
  }

  // Called when DROPPING a file on the new drop zone
  onReferenceImageDrop(event: DragEvent) {
    event.preventDefault();
    if (this.referenceImages.length >= 3) return;
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      // For a direct drop, go straight to the cropper
      const dialogRef = this.dialog.open(ImageCropperDialogComponent, {
        data: {
          imageFile: file,
          assetType: AssetTypeEnum.GENERIC_IMAGE,
        },
        width: '600px',
      });

      dialogRef.afterClosed().subscribe((result: SourceAssetResponseDto) => {
        if (result && result.id) {
          this.referenceImages.push({
            sourceAssetId: result.id,
            previewUrl: result.presignedUrl || '',
          });
          this.handleReferenceImageAdded();
        }
      });
    }
  }

  private handleReferenceImageAdded(): void {
    if (this.referenceImages.length === 1) {
      // If there's a start/end frame or a video for extension/concatenation, clear them.
      const hadInputs = this.image1Preview || this.image2Preview;
      const snackbarMessage =
        'Start/end frames and extension videos have been cleared to use reference images.';
      if (this.image1Preview || this.image2Preview) {
        this.startImageAssetId = null;
        this.image1Preview = null;
        this._input1IsVideo = false;
        this.sourceMediaItems[0] = null;
        this.endImageAssetId = null;
        this.image2Preview = null;
        this._input2IsVideo = false;
        this.sourceMediaItems[1] = null;
        this.updateModeAndNotify();
        this._snackBar.open(snackbarMessage, 'OK', {duration: 5000});
      }

      const veo31Model = this.generationModels.find(
        m => m.value === 'veo-3.1-generate-preview',
      );
      if (
        veo31Model &&
        this.searchRequest.generationModel !== veo31Model.value
      ) {
        this.selectModel(veo31Model);
        handleSuccessSnackbar(
          this._snackBar,
          "We've switched to the Veo 3.1 model for you, as this one supports reference images.",
        );
      }
    }
  }

  clearReferenceImage(index: number, event: MouseEvent) {
    event.stopPropagation();
    this.referenceImages.splice(index, 1);
  }

  private applySourceAssets(sourceAssets: EnrichedSourceAsset[]): void {
    if (!sourceAssets || sourceAssets.length === 0) {
      return;
    }

    this.resetInputs();

    let hasAddedReferenceImage = false;

    for (const asset of sourceAssets) {
      if (asset.role === 'image_reference_asset') {
        if (this.referenceImages.length < 3) {
          this.referenceImages.push({
            sourceAssetId: asset.assetId,
            previewUrl: asset.presignedUrl,
          });
          hasAddedReferenceImage = true;
        }
      } else {
        // Assume other roles like 'input' are for start/end frames.
        // Currently, we only process the first one.
        if (!this.image1Preview) {
          this.processInput(
            // Construct a valid SourceAssetResponseDto from the EnrichedSourceAsset
            {
              id: asset.assetId,
              gcsUri: asset.gcsUri,
              presignedUrl: asset.presignedUrl,
              mimeType: asset.gcsUri.endsWith('.mp4') ? 'video/mp4' : 'image/png',
              originalFilename: 'remix-asset',
              // Add other required fields with default/null values
            } as SourceAssetResponseDto,
            1,
          );
        }
      }
    }
 
    if (hasAddedReferenceImage) {
      this.handleReferenceImageAdded();
      this.currentMode = 'Ingredients to Video';
    }
    this.updateModeAndNotify();
    this.saveState();
  }

  promptText = signal<string>('');
  
  // Menu open/close states
  isModeMenuOpen = signal<boolean>(false);
  isSettingsMenuOpen = signal<boolean>(false);
  isExpandMenuOpen = signal<boolean>(false);
  isSettingsDropdownOpen = signal<'aspect' | 'outputs' | 'model' | null>(null);

  // Selected values
  selectedMode = signal<string>('Text to Video');
  selectedNewAspectRatio = signal<string>('Landscape (16:9)');
  selectedOutputs = signal<number>(2);
  selectedModel = signal<string>('Veo 3.1 - Fast');
  selectedPreset = signal<string>('');


  // --- Event Handlers ---

  onPromptInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.promptText.set(target.value);
  }

  // --- Menu Toggles ---
  
  toggleModeMenu() {
    this.isModeMenuOpen.set(!this.isModeMenuOpen());
    this.isSettingsMenuOpen.set(false);
    this.isExpandMenuOpen.set(false);
  }
  
  toggleSettingsMenu() {
    this.isSettingsMenuOpen.set(!this.isSettingsMenuOpen());
    this.isModeMenuOpen.set(false);
    this.isExpandMenuOpen.set(false);
    this.isSettingsDropdownOpen.set(null); // Close inner dropdowns
  }

  toggleExpandMenu() {
    this.isExpandMenuOpen.set(!this.isExpandMenuOpen());
    this.isModeMenuOpen.set(false);
    this.isSettingsMenuOpen.set(false);
  }

  // --- Select Handlers ---

  selectMode(mode: string) {
    this.selectedMode.set(mode);
    this.isModeMenuOpen.set(false);
    console.log('Selected Mode:', mode);
  }

  selectNewAspectRatio(ratio: string) {
    this.selectedNewAspectRatio.set(ratio);
    this.isSettingsDropdownOpen.set(null);
    console.log('Selected Aspect Ratio:', ratio);
  }

  selectOutputs(count: number) {
    this.selectedOutputs.set(count);
    this.isSettingsDropdownOpen.set(null);
    console.log('Selected Outputs:', count);
  }

  selectNewModel(model: string) {
    this.selectedModel.set(model);
    this.isSettingsDropdownOpen.set(null);
    console.log('Selected Model:', model);
  }

  selectPreset(preset: string) {
    this.selectedPreset.set(preset);
    this.isExpandMenuOpen.set(false);
    console.log('Selected Preset:', preset);
    // You could also append this to the prompt, e.g.:
    // this.promptText.set(this.promptText() + ' ' + preset);
  }
}
