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

import { Component, EventEmitter, Input, Output, signal, HostListener, ElementRef } from '@angular/core';
import { VeoRequest } from '../../models/search.model';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  standalone: true,
  selector: 'app-flow-prompt-box',
  templateUrl: './flow-prompt-box.component.html',
  styleUrls: ['./flow-prompt-box.component.scss'],
  imports:[CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule]
})
export class FlowPromptBoxComponent {
  @Input() searchRequest!: any; // Keep for now, but prefer individual inputs
  @Input() generationModels: any[] = [];
  @Input() isLoading = false;
  @Input() selectedGenerationModel = '';
  @Input() prompt = '';
  @Input() aspectRatio = '16:9';
  @Input() outputs = 4;
  @Input() mode = 'Text to Video';

  @Output() generateClicked = new EventEmitter<void>();
  @Output() rewriteClicked = new EventEmitter<void>();
  @Output() modelSelected = new EventEmitter<any>();
  @Output() promptChanged = new EventEmitter<string>();
  @Output() aspectRatioChanged = new EventEmitter<string>();
  @Output() outputsChanged = new EventEmitter<number>();
  @Output() modeChanged = new EventEmitter<string>();
  @Output() openImageSelector = new EventEmitter<1 | 2>();
  @Output() clearImage = new EventEmitter<{num: 1 | 2, event: Event}>();
  @Output() openImageSelectorForReference = new EventEmitter<void>();
  @Output() onReferenceImageDrop = new EventEmitter<DragEvent>();
  @Output() clearReferenceImage = new EventEmitter<{index: number, event: Event}>();
  @Output() toggleReferenceImagesType = new EventEmitter<boolean>();

  @Input() image1Preview: string | null = null;
  @Input() image2Preview: string | null = null;
  @Input() referenceImages: any[] = [];
  @Input() referenceImagesType: 'ASSET' | 'STYLE' = 'ASSET';

  constructor(private eRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isModeMenuOpen.set(false);
      this.isSettingsMenuOpen.set(false);
    }
  }

  // --- Logic moved from VideoComponent ---

  promptText = signal<string>('');

  // Menu open/close states
  isModeMenuOpen = signal<boolean>(false);
  isSettingsMenuOpen = signal<boolean>(false);
  isSettingsDropdownOpen = signal<'aspect' | 'outputs' | 'model' | null>(null);
  selectedMode = signal<string>('Text to Video');
  selectedPreset = signal<string>('');

  // --- Event Handlers ---

  onPromptInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.promptChanged.emit(target.value);
  }

  // --- Menu Toggles ---

  toggleModeMenu() {
    this.isModeMenuOpen.set(!this.isModeMenuOpen());
    this.isSettingsMenuOpen.set(false);
  }

  toggleSettingsMenu() {
    this.isSettingsMenuOpen.set(!this.isSettingsMenuOpen());
    this.isModeMenuOpen.set(false);
    this.isSettingsDropdownOpen.set(null); // Close inner dropdowns
  }

  // --- Select Handlers ---

  selectMode(mode: string) {
    this.selectedMode.set(mode);
    this.modeChanged.emit(mode);
    this.isModeMenuOpen.set(false);
    console.log('Selected Mode:', mode);
  }

  selectNewAspectRatio(ratio: string) {
    this.aspectRatioChanged.emit(ratio);
    this.isSettingsDropdownOpen.set(null);
    console.log('Selected Aspect Ratio:', ratio);
  }

  selectOutputs(count: number) {
    this.outputsChanged.emit(count);
    this.isSettingsDropdownOpen.set(null);
    console.log('Selected Outputs:', count);
  }

  // Triggered from internal dropdown
  selectInternalModel(model: any) {
    this.isSettingsDropdownOpen.set(null);
    this.modelSelected.emit(model);
  }

  selectPreset(preset: string) {
    this.selectedPreset.set(preset);
    console.log('Selected Preset:', preset);
  }
}