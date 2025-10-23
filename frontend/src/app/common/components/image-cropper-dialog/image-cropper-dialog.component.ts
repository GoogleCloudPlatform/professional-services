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

import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {
  ImageCroppedEvent,
  ImageTransform,
  CropperOptions,
} from 'ngx-image-cropper';
import {HttpClient} from '@angular/common/http';
import {Observable, finalize} from 'rxjs';
import {
  SourceAssetResponseDto,
  SourceAssetService,
} from '../../services/source-asset.service';
import {
  AssetScopeEnum,
  AssetTypeEnum,
} from '../../../admin/source-assets-management/source-asset.model';
import {WorkspaceStateService} from '../../../services/workspace/workspace-state.service';
import {environment} from '../../../../environments/environment';

interface AspectRatio {
  label: string;
  value: number;
  stringValue: string;
}

@Component({
  selector: 'app-image-cropper-dialog',
  templateUrl: './image-cropper-dialog.component.html',
  styleUrls: ['./image-cropper-dialog.component.scss'],
})
export class ImageCropperDialogComponent {
  isUploading = false;
  isConverting = false; // New state for the conversion step
  imageFile: File | null = null; // Initialize as null

  croppedImageBlob: Blob | null = null;
  aspectRatios: AspectRatio[] = [];
  currentAspectRatio: number;
  containWithinAspectRatio = false;
  backgroundColor = 'white';

  transform: ImageTransform = {
    translateUnit: 'px',
    scale: 1,
    rotate: 0,
    flipH: false,
    flipV: false,
  };
  canvasRotation = 0;
  options: Partial<CropperOptions>;

  constructor(
    public dialogRef: MatDialogRef<ImageCropperDialogComponent>,
    private http: HttpClient,
    private sourceAssetService: SourceAssetService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      imageFile: File;
      assetType: AssetTypeEnum;
      aspectRatios?: AspectRatio[];
    },
  ) {
    this.aspectRatios = data.aspectRatios || [
      {label: '1:1 Square', value: 1 / 1, stringValue: '1:1'},
      {label: '16:9 Horizontal', value: 16 / 9, stringValue: '16:9'},
      {label: '9:16 Vertical', value: 9 / 16, stringValue: '9:16'},
      {label: '3:4 Portrait', value: 3 / 4, stringValue: '3:4'},
      {label: '4:3 Pin', value: 4 / 3, stringValue: '4:3'},
    ];
    this.currentAspectRatio = this.aspectRatios[0].value;

    // Initialize the options object
    this.options = {
      aspectRatio: this.currentAspectRatio,
      maintainAspectRatio: true,
      containWithinAspectRatio: this.containWithinAspectRatio,
      backgroundColor: this.backgroundColor,
      autoCrop: true,
    };
    this.handleFile(this.data.imageFile); // Handle the file on init
  }

  // --- Start: New file handling logic ---
  handleFile(file: File): void {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/png',
      'image/webp',
    ];
    if (supportedTypes.includes(file.type)) {
      // If the format is supported, load it directly into the cropper
      this.imageFile = file;
    } else {
      // If the format is unsupported (like AVIF), convert it via the backend
      this.isConverting = true;
      this.convertImageOnBackend(file)
        .pipe(finalize(() => (this.isConverting = false)))
        .subscribe({
          next: pngBlob => {
            // Create a new File from the returned PNG blob and load it
            this.imageFile = new File([pngBlob], 'converted-image.png', {
              type: 'image/png',
            });
          },
          error: err => {
            console.error('Image conversion failed:', err);
            this.dialogRef.close(); // Close dialog on conversion failure
          },
        });
    }
  }

  private convertImageOnBackend(file: File): Observable<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    // Assumes you create a new backend endpoint for this
    const convertUrl = `${environment.backendURL}/source_assets/convert-to-png`;
    return this.http.post(convertUrl, formData, {responseType: 'blob'});
  }

  // --- Start: Add Event Handlers ---
  onAspectRatioChange(newRatio: number): void {
    this.currentAspectRatio = newRatio;
    this.options = {...this.options, aspectRatio: newRatio};
  }

  onBackgroundColorChange(newColor: string): void {
    this.backgroundColor = newColor;
    this.options = {...this.options, backgroundColor: newColor};
  }

  // --- Start: Add New Control Methods ---
  rotateLeft() {
    this.canvasRotation--;
  }

  rotateRight() {
    this.canvasRotation++;
  }

  moveLeft() {
    this.transform = {
      ...this.transform,
      translateH: (this.transform.translateH || 0) - 5,
    };
  }

  moveRight() {
    this.transform = {
      ...this.transform,
      translateH: (this.transform.translateH || 0) + 5,
    };
  }

  moveDown() {
    this.transform = {
      ...this.transform,
      translateV: (this.transform.translateV || 0) + 5,
    };
  }

  moveUp() {
    this.transform = {
      ...this.transform,
      translateV: (this.transform.translateV || 0) - 5,
    };
  }

  flipHorizontal() {
    this.transform = {...this.transform, flipH: !this.transform.flipH};
  }

  flipVertical() {
    this.transform = {...this.transform, flipV: !this.transform.flipV};
  }

  zoomOut() {
    this.transform = {
      ...this.transform,
      scale: (this.transform.scale || 1) - 0.1,
    };
  }

  zoomIn() {
    this.transform = {
      ...this.transform,
      scale: (this.transform.scale || 1) + 0.1,
    };
  }
  // --- End: Add New Control Methods ---

  imageCropped(event: ImageCroppedEvent) {
    if (event.blob) {
      this.croppedImageBlob = event.blob;
    }
  }

  uploadCroppedImage() {
    if (this.croppedImageBlob) {
      const croppedFile = new File(
        [this.croppedImageBlob],
        this.imageFile?.name || 'untitled',
        {
          type: 'image/png',
        },
      );

      // 3. Find the string value of the current aspect ratio
      const selectedRatio = this.aspectRatios.find(
        r => r.value === this.currentAspectRatio,
      );
      const aspectRatioString = selectedRatio
        ? selectedRatio.stringValue
        : '1:1';

      this.isUploading = true;
      this.uploadAsset(croppedFile, aspectRatioString)
        .pipe(finalize(() => (this.isUploading = false)))
        .subscribe(asset => {
          this.sourceAssetService.addAsset(asset);
          this.dialogRef.close(asset); // Close and return the final asset
        });
    }
  }

  private uploadAsset(
    file: File,
    aspectRatio: string,
  ): Observable<SourceAssetResponseDto> {
    return this.sourceAssetService.uploadAsset(file, {
      aspectRatio: aspectRatio,
      scope: AssetScopeEnum.PRIVATE,
      assetType: this.data.assetType || AssetTypeEnum.GENERIC_IMAGE,
    });
  }
}
