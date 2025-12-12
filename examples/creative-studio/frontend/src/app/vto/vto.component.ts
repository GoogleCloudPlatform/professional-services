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
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import {FormBuilder, Validators, FormGroup} from '@angular/forms';
import {JobStatus, MediaItem} from '../common/models/media-item.model';
import {HttpClient} from '@angular/common/http';
import {VtoInputLink, VtoRequest, VtoSourceMediaItemLink} from './vto.model';
import {environment} from '../../environments/environment';
import {MatDialog} from '@angular/material/dialog';
import {
  ImageSelectorComponent,
  MediaItemSelection,
} from '../common/components/image-selector/image-selector.component';
import {
  SourceAssetResponseDto,
  SourceAssetService,
} from '../common/services/source-asset.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {finalize, Observable} from 'rxjs';
import {handleErrorSnackbar, handleSuccessSnackbar} from '../utils/handleMessageSnackbar';
import {NavigationExtras, Router} from '@angular/router';
import {SearchService} from '../services/search/search.service';
import {MatStepper} from '@angular/material/stepper';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';
import {WorkspaceStateService} from '../services/workspace/workspace-state.service';
import {VtoStateService} from '../services/vto-state.service';
import {
  AssetScopeEnum,
  AssetTypeEnum,
} from '../admin/source-assets-management/source-asset.model';

interface Garment {
  id: string;
  name: string;
  imageUrl: string;
  type: 'top' | 'bottom' | 'dress' | 'shoes';
  inputLink: VtoInputLink;
}

interface VtoAssetsResponseDto {
  male_models: SourceAssetResponseDto[];
  female_models: SourceAssetResponseDto[];
  tops: SourceAssetResponseDto[];
  bottoms: SourceAssetResponseDto[];
  dresses: SourceAssetResponseDto[];
  shoes: SourceAssetResponseDto[];
}

interface Model {
  id: string;
  name: string;
  imageUrl: string;
  size: string;
  inputLink: VtoInputLink;
}

@Component({
  selector: 'app-vto',
  templateUrl: './vto.component.html',
  styleUrls: ['./vto.component.scss'],
})
export class VtoComponent implements OnInit, AfterViewInit {
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;

  showErrorOverlay = true;

  @ViewChild('stepper') stepper!: MatStepper;

  activeVtoJob$: Observable<MediaItem | null>;
  public readonly JobStatus = JobStatus; // Expose enum to template

  isLoading = false;
  imagenDocuments: MediaItem | null = null;
  previousResult: MediaItem | null = null;
  private shouldAdvanceStepperOnLoad = false;
  private savedStepperIndex: number = 0;

  selectedTop: Garment | null = null;
  selectedBottom: Garment | null = null;
  selectedDress: Garment | null = null;
  selectedShoes: Garment | null = null;

  uploadExamples: {imageUrl: string; alt: string}[] = [
    {
      imageUrl: 'assets/images/vto/upload-photo-1.png',
      alt: 'Well-lit, full body example 1',
    },
    {
      imageUrl: 'assets/images/vto/upload-photo-2.png',
      alt: 'Well-lit, full body example 2',
    },
    {
      imageUrl: 'assets/images/vto/upload-photo-3.png',
      alt: 'Well-lit, full body example 3',
    },
    {
      imageUrl: 'assets/images/vto/upload-photo-4.png',
      alt: 'Well-lit, full body example 4',
    },
  ];

  // Mock data
  femaleModels: Model[] = [];
  maleModels: Model[] = [];
  tops: Garment[] = [];
  bottoms: Garment[] = [];
  dresses: Garment[] = [];
  shoes: Garment[] = [];

  modelsToShow: Model[] = this.femaleModels;

  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly http: HttpClient,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    public matIconRegistry: MatIconRegistry,
    private workspaceStateService: WorkspaceStateService,
    private sourceAssetService: SourceAssetService,
    private searchService: SearchService,
    private vtoStateService: VtoStateService,
  ) {
    this.activeVtoJob$ = this.searchService.activeVtoJob$;
    this.matIconRegistry.addSvgIcon(
      'mobile-white-gemini-spark-icon',
      this.setPath(`${this.path}/mobile-white-gemini-spark-icon.svg`),
    );

    this.firstFormGroup = this._formBuilder.group({
      modelType: ['female', Validators.required],
      model: [null, Validators.required],
    });

    this.secondFormGroup = this._formBuilder.group({
      top: [null],
      bottom: [null],
      dress: [null],
      shoes: [null],
    });

    const remixState =
      this.router.getCurrentNavigation()?.extras.state?.['remixState'];
    if (remixState) {
      this.applyRemixState(remixState);
      this.shouldAdvanceStepperOnLoad = true;
    }

    this.firstFormGroup.get('modelType')?.valueChanges.subscribe(val => {
      this.modelsToShow =
        val === 'female' ? this.femaleModels : this.maleModels;
      if (this.firstFormGroup.get('model')?.value?.id !== 'uploaded') {
        this.firstFormGroup.get('model')?.reset();
      }
      this.imagenDocuments = null;
    });

    this.firstFormGroup.get('model')?.valueChanges.subscribe(() => {
      this.imagenDocuments = null;
      this.previousResult = null;
    });

    this.secondFormGroup.get('top')?.valueChanges.subscribe(top => {
      this.selectedTop = top;
      if (top) {
        if (this.secondFormGroup.get('dress')?.value) {
          handleErrorSnackbar(this._snackBar, { message: 'A dress cannot be worn with a top. The dress has been unselected.' }, 'Garment Conflict');
        }
        this.selectedDress = null;
        this.secondFormGroup.get('dress')?.reset(null, {emitEvent: false});
      }
    });
    this.secondFormGroup.get('bottom')?.valueChanges.subscribe(bottom => {
      this.selectedBottom = bottom;
      if (bottom) {
        if (this.secondFormGroup.get('dress')?.value) {
          handleErrorSnackbar(this._snackBar, { message: 'A dress cannot be worn with a bottom. The dress has been unselected.' }, 'Garment Conflict');
        }
        this.selectedDress = null;
        this.secondFormGroup.get('dress')?.reset(null, {emitEvent: false});
      }
    });
    this.secondFormGroup.get('dress')?.valueChanges.subscribe(dress => {
      this.selectedDress = dress;
      if (dress) {
        let message = '';
        if (
          this.secondFormGroup.get('top')?.value &&
          this.secondFormGroup.get('bottom')?.value
        ) {
          message =
            'A top and bottom cannot be worn with a dress. The top and bottom have been unselected.';
        } else if (this.secondFormGroup.get('top')?.value) {
          message =
            'A top cannot be worn with a dress. The top has been unselected.';
        } else if (this.secondFormGroup.get('bottom')?.value) {
          message =
            'A bottom cannot be worn with a dress. The bottom has been unselected.';
        }
        if (message) {
          handleErrorSnackbar(this._snackBar, { message: message }, 'Garment Conflict');
        }
        this.selectedTop = null;
        this.selectedBottom = null;
        this.secondFormGroup.get('top')?.reset(null, {emitEvent: false});
        this.secondFormGroup.get('bottom')?.reset(null, {emitEvent: false});
      }
    });
    this.secondFormGroup.get('shoes')?.valueChanges.subscribe(shoes => {
      this.selectedShoes = shoes;
    });
  }

  ngOnInit(): void {
    this.loadVtoAssets();
    this.restoreVtoState();

    // Subscribe to activeVtoJob$ to keep imagenDocuments in sync
    this.activeVtoJob$.subscribe(vtoJob => {
      if (vtoJob && vtoJob.status === JobStatus.COMPLETED) {
        this.previousResult = this.imagenDocuments;
        this.imagenDocuments = vtoJob;
      } else if (!vtoJob) {
        // Clear saved state when job is no longer active
        this.clearVtoState();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.shouldAdvanceStepperOnLoad && this.firstFormGroup.valid) {
      this.stepper.next();
      this.cdr.detectChanges(); // To avoid ExpressionChangedAfterItHasBeenCheckedError
    }

    // Restore stepper index if there's a saved state
    if (this.savedStepperIndex > 0 && this.stepper) {
      this.stepper.selectedIndex = this.savedStepperIndex;
      this.cdr.detectChanges();
    }
  }

  private path = '../../assets/images';

  private setPath(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private loadVtoAssets(): void {
    this.isLoading = true;
    this.http
      .get<VtoAssetsResponseDto>(
        `${environment.backendURL}/source_assets/vto-assets`,
      )
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: response => {
          this.femaleModels = response.female_models.map(asset =>
            this.mapAssetToModel(asset),
          );
          this.maleModels = response.male_models.map(asset =>
            this.mapAssetToModel(asset),
          );
          this.tops = response.tops.map(asset =>
            this.mapAssetToGarment(asset, 'top'),
          );
          this.bottoms = response.bottoms.map(asset =>
            this.mapAssetToGarment(asset, 'bottom'),
          );
          this.dresses = response.dresses.map(asset =>
            this.mapAssetToGarment(asset, 'dress'),
          );
          this.shoes = response.shoes.map(asset =>
            this.mapAssetToGarment(asset, 'shoes'),
          );

          // Set default models to show
          this.modelsToShow =
            this.firstFormGroup.get('modelType')?.value === 'female'
              ? this.femaleModels
              : this.maleModels;
        },
        error: err => {
          handleErrorSnackbar(this._snackBar, err, 'Load VTO assets');
        },
      });
  }

  private mapAssetToModel(asset: SourceAssetResponseDto): Model {
    return {
      id: asset.id.toString(),
      name: asset.originalFilename,
      imageUrl: asset.presignedUrl,
      size: 'M', // Default size or handle differently
      inputLink: {sourceAssetId: asset.id},
    };
  }

  private mapAssetToGarment(
    asset: SourceAssetResponseDto,
    type: 'top' | 'bottom' | 'dress' | 'shoes',
  ): Garment {
    return {
      id: asset.id ? asset.id.toString() : `uploaded-${Date.now()}`, // Ensure ID is a string
      name: asset.originalFilename,
      imageUrl: asset.presignedUrl,
      type: type,
      inputLink: {sourceAssetId: asset.id},
    };
  }

  openImageSelector() {
    const dialogRef = this.dialog.open(ImageSelectorComponent, {
      width: '90vw',
      height: '80vh',
      maxWidth: '90vw',
      panelClass: 'image-selector-dialog',
      data: {mimeType: 'image/*'},
    });

    dialogRef
      .afterClosed()
      .subscribe((result: MediaItemSelection | SourceAssetResponseDto) => {
        if (result) {
          if ('gcsUri' in result) {
            // SourceAssetResponseDto
            const uploadedModel: Model = {
              id: 'uploaded',
              name: result.originalFilename,
              imageUrl: result.presignedUrl,
              size: 'custom',
              inputLink: {sourceAssetId: result.id},
            };
            this.firstFormGroup.get('model')?.setValue(uploadedModel);
          } else {
            // MediaItemSelection
            if (result.mediaItem) {
              this.applyRemixState({
                modelImageAssetId: result.mediaItem.id,
                modelImagePreviewUrl:
                  result.mediaItem.presignedUrls![result.selectedIndex],
                modelImageMediaIndex: result.selectedIndex, // This is correct as it's internal to the component
              });
            }
          }
        }
      });
  }

  private uploadAsset(
    file: File,
    assetType?: AssetTypeEnum,
  ): Observable<SourceAssetResponseDto> {
    return this.sourceAssetService.uploadAsset(file, {
      assetType: assetType,
      scope: AssetScopeEnum.PRIVATE,
    });
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.isLoading = true;
      this.uploadAsset(file)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: asset => {
            const uploadedModel: Model = {
              id: 'uploaded',
              name: asset.originalFilename,
              imageUrl: asset.presignedUrl,
              size: 'custom',
              inputLink: {sourceAssetId: asset.id},
            };
            this.firstFormGroup.get('model')?.setValue(uploadedModel);
          },
          error: error => {
            handleErrorSnackbar(this._snackBar, error, 'Image upload');
          },
        });
    }
  }

  clearImage(event: MouseEvent) {
    event.stopPropagation();
    this.firstFormGroup.get('model')?.reset();
  }

  selectGarment(garment: Garment, type: 'top' | 'bottom' | 'dress' | 'shoes') {
    const control = this.secondFormGroup.get(type);
    if (control?.value?.id === garment.id) {
      control?.setValue(null);
    } else {
      control?.setValue(garment);
    }
  }

  tryOn() {
    const selectedModel = this.firstFormGroup.get('model')?.value;
    if (!selectedModel) {
      console.error('No model selected.');
      return;
    }

    if (
      !this.selectedTop &&
      !this.selectedBottom &&
      !this.selectedDress &&
      !this.selectedShoes
    ) {
      handleErrorSnackbar(this._snackBar, { message: 'You need to select at least 1 garment!' }, 'Virtual Try-On');
      return;
    }

    // Save state before starting generation
    this.saveVtoState();

    this.isLoading = true;

    const payload: VtoRequest = {
      numberOfMedia: 4, // Defaulting to 4 as per DTO
      personImage: selectedModel.inputLink,
      workspaceId: this.workspaceStateService.getActiveWorkspaceId() ?? '',
    };

    if (this.selectedTop) payload.topImage = this.selectedTop.inputLink;
    if (this.selectedBottom)
      payload.bottomImage = this.selectedBottom.inputLink;
    if (this.selectedDress) payload.dressImage = this.selectedDress.inputLink;
    if (this.selectedShoes) payload.shoeImage = this.selectedShoes.inputLink;

    this.searchService
      .startVtoGeneration(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (initialResponse: MediaItem) => {
          console.log('VTO job started successfully:', initialResponse);
          // UI will update via activeVtoJob$ observable
        },
        error: err => {
          handleErrorSnackbar(this._snackBar, err, 'Virtual Try-On');
        },
      });
  }


  closeErrorOverlay() {
    this.showErrorOverlay = false;
  }

  private applyRemixState(remixState: {
    modelImageAssetId: number;
    modelImagePreviewUrl: string;
    modelImageMediaIndex: number;
  }): void {
    const remixedModel: Model = {
      id: 'uploaded', // To match the logic for showing the preview
      name: 'Imported Model',
      imageUrl: remixState.modelImagePreviewUrl,
      size: 'custom',
      inputLink: {
        sourceMediaItem: {
          mediaItemId: remixState.modelImageAssetId,
          mediaIndex: remixState.modelImageMediaIndex,
        },
      },
    };
    this.firstFormGroup.get('model')?.setValue(remixedModel);
  }

  setModelFromImage(index: number): void {
    if (!this.imagenDocuments) {
      return;
    }

    const newModel: Model = {
      id: 'uploaded', // Treat it as a custom uploaded model
      name: 'Generated Model',
      imageUrl: this.imagenDocuments.presignedUrls![index],
      size: 'custom',
      inputLink: {
        sourceMediaItem: {
          mediaItemId: this.imagenDocuments.id,
          mediaIndex: index,
        },
      },
    };

    this.firstFormGroup.get('model')?.setValue(newModel);
  }

  remixWithThisImage(index: number): void {
    if (!this.imagenDocuments) {
      return;
    }

    const sourceMediaItem: VtoSourceMediaItemLink = {
      mediaItemId: this.imagenDocuments.id,
      mediaIndex: index,
      role: 'input',
    };

    const navigationExtras: NavigationExtras = {
      state: {
        remixState: {
          sourceMediaItems: [sourceMediaItem],
          prompt: this.imagenDocuments.originalPrompt,
          previewUrl: this.imagenDocuments.presignedUrls?.[index],
        },
      },
    };
    this.router.navigate(['/'], navigationExtras);
  }

  generateVideoWithResult(event: {role: 'start' | 'end'; index: number}): void {
    if (!this.imagenDocuments) {
      return;
    }

    const sourceMediaItem: VtoSourceMediaItemLink = {
      mediaItemId: this.imagenDocuments.id,
      mediaIndex: event.index,
      role: event.role === 'start' ? 'start_frame' : 'end_frame',
    };

    const remixState = {
      prompt: this.imagenDocuments.originalPrompt,
      sourceMediaItems: [sourceMediaItem],
      aspectRatio: '9:16',
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
      state: {remixState},
    };
    this.router.navigate(['/video'], navigationExtras);
  }

  openGarmentSelector(type: 'top' | 'bottom' | 'dress' | 'shoes') {
    const dialogRef = this.dialog.open(ImageSelectorComponent, {
      width: '90vw',
      height: '80vh',
      maxWidth: '90vw',
      panelClass: 'image-selector-dialog',
      data: {
        assetType: `vto_${type}`,
        mimeType: 'image/*', // VTO garments are always images
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: MediaItemSelection | SourceAssetResponseDto) => {
        if (result) {
          let newGarment: Garment;
          if ('gcsUri' in result) {
            // Uploaded image
            newGarment = this.mapAssetToGarment(result, type);
          } else {
            // Gallery image
            newGarment = {
              id: result.mediaItem.id + '-' + result.selectedIndex,
              name: 'Gallery Garment',
              imageUrl: result.mediaItem.presignedUrls![result.selectedIndex],
              type: type,
              inputLink: {
                sourceMediaItem: {
                  mediaItemId: result.mediaItem.id,
                  mediaIndex: result.selectedIndex,
                },
              },
            };
          }
          switch (type) {
            case 'top':
              this.tops = [newGarment, ...this.tops];
              break;
            case 'bottom':
              this.bottoms = [newGarment, ...this.bottoms];
              break;
            case 'dress':
              this.dresses = [newGarment, ...this.dresses];
              break;
            case 'shoes':
              this.shoes = [newGarment, ...this.shoes];
              break;
          }
          this.cdr.detectChanges();
          this.selectGarment(newGarment, type);
        }
      });
  }

  private saveVtoState(): void {
    const state = {
      stepperIndex: this.stepper?.selectedIndex || 1,
      modelType: this.firstFormGroup.get('modelType')?.value,
      model: this.firstFormGroup.get('model')?.value,
      top: this.secondFormGroup.get('top')?.value,
      bottom: this.secondFormGroup.get('bottom')?.value,
      dress: this.secondFormGroup.get('dress')?.value,
      shoes: this.secondFormGroup.get('shoes')?.value,
    };
    this.vtoStateService.updateState(state);
  }

  private restoreVtoState(): void {
    const state = this.vtoStateService.getState();
    if (!state.modelType && !state.model) {
      return;
    }

    try {
      // Restore first form group
      if (state.modelType) {
        this.firstFormGroup.get('modelType')?.setValue(state.modelType, {emitEvent: false});
      }
      if (state.model) {
        this.firstFormGroup.get('model')?.setValue(state.model, {emitEvent: false});
      }

      // Restore second form group
      if (state.top) {
        this.secondFormGroup.get('top')?.setValue(state.top, {emitEvent: false});
        this.selectedTop = state.top;
      }
      if (state.bottom) {
        this.secondFormGroup.get('bottom')?.setValue(state.bottom, {emitEvent: false});
        this.selectedBottom = state.bottom;
      }
      if (state.dress) {
        this.secondFormGroup.get('dress')?.setValue(state.dress, {emitEvent: false});
        this.selectedDress = state.dress;
      }
      if (state.shoes) {
        this.secondFormGroup.get('shoes')?.setValue(state.shoes, {emitEvent: false});
        this.selectedShoes = state.shoes;
      }

      // Save stepper index to restore after view init
      this.savedStepperIndex = state.stepperIndex || 0;
    } catch (error) {
      console.error('Failed to restore VTO state:', error);
      this.clearVtoState();
    }
  }

  private clearVtoState(): void {
    this.vtoStateService.resetState();
    this.savedStepperIndex = 0;
  }
}
