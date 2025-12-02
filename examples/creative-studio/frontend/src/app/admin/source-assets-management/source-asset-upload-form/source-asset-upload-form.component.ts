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

import {Component} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {AssetScopeEnum, AssetTypeEnum} from '../source-asset.model';
import {SourceAssetsService} from '../source-assets.service';
import {finalize} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {handleErrorSnackbar} from '../../../utils/handleMessageSnackbar';

@Component({
  selector: 'app-source-asset-upload-form',
  templateUrl: './source-asset-upload-form.component.html',
  styleUrls: ['./source-asset-upload-form.component.scss'],
})
export class SourceAssetUploadFormComponent {
  form: FormGroup;
  assetTypes = Object.values(AssetTypeEnum);
  assetScopes = Object.values(AssetScopeEnum);
  isUploading = false;
  fileName: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<SourceAssetUploadFormComponent>,
    private fb: FormBuilder,
    private sourceAssetsService: SourceAssetsService,
    private _snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      file: [null, Validators.required],
      scope: [AssetScopeEnum.SYSTEM, Validators.required],
      assetType: [AssetTypeEnum.GENERIC_IMAGE, Validators.required],
    });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.form.patchValue({file: file});
      this.fileName = file.name;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onUpload(): void {
    if (this.form.valid) {
      this.isUploading = true;
      const {file, scope, assetType} = this.form.value;
      this.sourceAssetsService
        .uploadSourceAsset(file, scope, assetType)
        .pipe(finalize(() => (this.isUploading = false)))
        .subscribe({
          next: asset => {
            this.dialogRef.close(asset);
          },
          error: err => {
            handleErrorSnackbar(this._snackBar, err, 'Asset Upload');
          },
        });
    }
  }
}
