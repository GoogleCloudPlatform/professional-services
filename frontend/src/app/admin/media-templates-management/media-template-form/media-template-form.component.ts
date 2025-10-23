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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormBuilder, FormGroup, Validators, FormArray} from '@angular/forms';
import {
  MediaTemplate,
  IndustryEnum,
  MimeTypeEnum,
  AspectRatioEnum,
  StyleEnum,
  LightingEnum,
  ColorAndToneEnum,
  CompositionEnum,
  GenerationModelEnum,
} from '../../../fun-templates/media-template.model';
import {MatChipInputEvent} from '@angular/material/chips';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-media-template-form',
  templateUrl: './media-template-form.component.html',
  styleUrls: ['./media-template-form.component.scss'],
})
export class MediaTemplateFormComponent implements OnInit, OnDestroy {
  form: FormGroup;
  industries = Object.values(IndustryEnum);
  mimeTypes = Object.values(MimeTypeEnum);
  aspectRatios = Object.values(AspectRatioEnum);
  styles = Object.values(StyleEnum);
  lightings = Object.values(LightingEnum);
  colorsAndTones = Object.values(ColorAndToneEnum);
  compositions = Object.values(CompositionEnum);

  imageModels: GenerationModelEnum[] = Object.values(
    GenerationModelEnum,
  ).filter(model => model.includes('image'));
  videoModels: GenerationModelEnum[] = Object.values(
    GenerationModelEnum,
  ).filter(model => model.startsWith('veo'));

  filteredGenerationModels: GenerationModelEnum[] = [];
  private mimeTypeSubscription!: Subscription;

  constructor(
    public dialogRef: MatDialogRef<MediaTemplateFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {template: MediaTemplate},
    private fb: FormBuilder,
  ) {
    // This initialization is necessary to prevent template errors.
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    const template = this.data.template || ({} as MediaTemplate);
    const params = template.generationParameters || {};

    this.form = this.fb.group({
      id: [template.id],
      name: [template.name || '', Validators.required],
      description: [template.description || '', Validators.required],
      mimeType: [template.mimeType, Validators.required],
      industry: [template.industry],
      brand: [template.brand],
      tags: this.fb.array(template.tags || []),
      gcsUris: this.fb.array(
        (template.gcsUris || []).map(uri =>
          this.fb.control(uri, Validators.required),
        ),
      ),
      thumbnailUris: this.fb.array(
        (template.thumbnailUris || []).map(uri => this.fb.control(uri)),
      ),
      generationParameters: this.fb.group({
        prompt: [params.prompt],
        model: [params.model],
        aspectRatio: [params.aspectRatio],
        style: [params.style],
        lighting: [params.lighting],
        colorAndTone: [params.colorAndTone],
        composition: [params.composition],
        negativePrompt: [params.negativePrompt],
      }),
    });

    this.updateFilteredModels(); // Set initial state

    this.mimeTypeSubscription = this.form
      .get('mimeType')!
      .valueChanges.subscribe(() => {
        this.form.get('generationParameters.model')?.reset();
        this.updateFilteredModels();
      });
  }

  ngOnDestroy(): void {
    this.mimeTypeSubscription.unsubscribe();
  }

  updateFilteredModels(): void {
    const mimeType = this.form.get('mimeType')?.value;
    if (mimeType === MimeTypeEnum.IMAGE) {
      this.filteredGenerationModels = this.imageModels;
    } else if (mimeType === MimeTypeEnum.VIDEO) {
      this.filteredGenerationModels = this.videoModels;
    } else {
      // For other types like audio, there are no models yet.
      this.filteredGenerationModels = [];
    }
  }

  get tags(): FormArray {
    return this.form.get('tags') as FormArray;
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.tags.push(this.fb.control(value));
    }
    event.chipInput!.clear();
  }

  removeTag(index: number): void {
    this.tags.removeAt(index);
  }

  get gcsUris(): FormArray {
    return this.form.get('gcsUris') as FormArray;
  }

  addGcsUri(): void {
    this.gcsUris.push(this.fb.control('', Validators.required));
  }

  removeGcsUri(index: number): void {
    this.gcsUris.removeAt(index);
  }

  get thumbnailUris(): FormArray {
    return this.form.get('thumbnailUris') as FormArray;
  }

  addThumbnailUri(): void {
    // Thumbnails are optional, so no validator is needed.
    this.thumbnailUris.push(this.fb.control(''));
  }

  removeThumbnailUri(index: number): void {
    this.thumbnailUris.removeAt(index);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
