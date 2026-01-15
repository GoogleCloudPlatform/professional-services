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

import { Component, ElementRef, ViewChild } from '@angular/core';
import { AudioService, CreateAudioDto, GenerationModelEnum } from '../services/audio/audio.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { WorkspaceStateService } from '../services/workspace/workspace-state.service';
import { MediaItem } from '../common/models/media-item.model';
import { AddVoiceDialogComponent } from '../components/add-voice-dialog/add-voice-dialog.component';
import { MatIconRegistry } from '@angular/material/icon';
import {LanguageEnum, VoiceEnum} from './audio.constants';
import { handleErrorSnackbar, handleSuccessSnackbar } from '../utils/handleMessageSnackbar';

// UI Helper type
type UiModelType = 'lyria' | 'chirp' | 'gemini-tts';

interface VoiceOption {
  id: VoiceEnum | string; // Allow string for custom cloned voices later
  name: string;
  type: 'preset' | 'custom';
}

interface LanguageOption {
  code: LanguageEnum;
  name: string;
}

@Component({
  selector: 'app-lyria',
  templateUrl: './audio.component.html',
  styleUrls: ['./audio.component.scss'],
})
export class AudioComponent {
  // UI State
  selectedModel: UiModelType = 'lyria';
  isLoading = false;
  audioUrl: SafeResourceUrl | null = null;

  // Lyria Specific Inputs
  prompt = '';
  negativePrompt = '';
  seed: number | undefined;
  sampleCount = 4;

  // TTS & Chirp Specific Inputs
  selectedLanguage: LanguageEnum = LanguageEnum.EN_US;
  selectedVoice: VoiceEnum | string = VoiceEnum.PUCK;

  // --- Audio Player State ---
  @ViewChild('audioPlayer') audioPlayerRef!: ElementRef<HTMLAudioElement>;
  isPlaying = false;
  currentTime = '0:00';
  duration = '0:00';
  progressValue = 0;

  mediaItem: MediaItem | null = null;

  languages: LanguageOption[] = [
    {code: LanguageEnum.AR_XA, name: 'Arabic'},
    {code: LanguageEnum.BG_BG, name: 'Bulgarian (Bulgaria)'},
    {code: LanguageEnum.BN_IN, name: 'Bengali (India)'},
    {code: LanguageEnum.CMN_CN, name: 'Mandarin Chinese'},
    {code: LanguageEnum.CS_CZ, name: 'Czech (Czech Republic)'},
    {code: LanguageEnum.DA_DK, name: 'Danish (Denmark)'},
    {code: LanguageEnum.DE_DE, name: 'German (Germany)'},
    {code: LanguageEnum.EL_GR, name: 'Greek (Greece)'},
    {code: LanguageEnum.EN_AU, name: 'English (Australia)'},
    {code: LanguageEnum.EN_GB, name: 'English (UK)'},
    {code: LanguageEnum.EN_IN, name: 'English (India)'},
    {code: LanguageEnum.EN_US, name: 'English (United States)'},
    {code: LanguageEnum.ES_ES, name: 'Spanish (Spain)'},
    {code: LanguageEnum.ES_US, name: 'Spanish (US)'},
    {code: LanguageEnum.FI_FI, name: 'Finnish (Finland)'},
    {code: LanguageEnum.FR_CA, name: 'French (Canada)'},
    {code: LanguageEnum.FR_FR, name: 'French (France)'},
    {code: LanguageEnum.GU_IN, name: 'Gujarati (India)'},
    {code: LanguageEnum.HE_IL, name: 'Hebrew (Israel)'},
    {code: LanguageEnum.HI_IN, name: 'Hindi (India)'},
    {code: LanguageEnum.HU_HU, name: 'Hungarian (Hungary)'},
    {code: LanguageEnum.ID_ID, name: 'Indonesian (Indonesia)'},
    {code: LanguageEnum.IT_IT, name: 'Italian (Italy)'},
    {code: LanguageEnum.JA_JP, name: 'Japanese (Japan)'},
    {code: LanguageEnum.KN_IN, name: 'Kannada (India)'},
    {code: LanguageEnum.KO_KR, name: 'Korean (South Korea)'},
    {code: LanguageEnum.LT_LT, name: 'Lithuanian (Lithuania)'},
    {code: LanguageEnum.LV_LV, name: 'Latvian (Latvia)'},
    {code: LanguageEnum.ML_IN, name: 'Malayalam (India)'},
    {code: LanguageEnum.MR_IN, name: 'Marathi (India)'},
    {code: LanguageEnum.NB_NO, name: 'Norwegian (Norway)'},
    {code: LanguageEnum.NL_BE, name: 'Dutch (Belgium)'},
    {code: LanguageEnum.NL_NL, name: 'Dutch (Netherlands)'},
    {code: LanguageEnum.PL_PL, name: 'Polish (Poland)'},
    {code: LanguageEnum.PT_BR, name: 'Portuguese (Brazil)'},
    {code: LanguageEnum.RO_RO, name: 'Romanian (Romania)'},
    {code: LanguageEnum.RU_RU, name: 'Russian (Russia)'},
    {code: LanguageEnum.SK_SK, name: 'Slovak (Slovakia)'},
    {code: LanguageEnum.SR_RS, name: 'Serbian (Serbia)'},
    {code: LanguageEnum.SV_SE, name: 'Swedish (Sweden)'},
    {code: LanguageEnum.TA_IN, name: 'Tamil (India)'},
    {code: LanguageEnum.TE_IN, name: 'Telugu (India)'},
    {code: LanguageEnum.TH_TH, name: 'Thai (Thailand)'},
    {code: LanguageEnum.TR_TR, name: 'Turkish (Turkey)'},
    {code: LanguageEnum.UK_UA, name: 'Ukrainian (Ukraine)'},
    {code: LanguageEnum.VI_VN, name: 'Vietnamese (Vietnam)'},
  ];

  // Map Enums to Voice Options
  voices: VoiceOption[] = [
    {id: VoiceEnum.ACHERNAR, name: 'Achernar (Female)', type: 'preset'},
    {id: VoiceEnum.ACHIRD, name: 'Achird (Male)', type: 'preset'},
    {id: VoiceEnum.ALGENIB, name: 'Algenib (Male)', type: 'preset'},
    {id: VoiceEnum.ALGIEBA, name: 'Algieba (Male)', type: 'preset'},
    {id: VoiceEnum.ALNILAM, name: 'Alnilam (Male)', type: 'preset'},
    {id: VoiceEnum.AOEDE, name: 'Aoede (Female)', type: 'preset'},
    {id: VoiceEnum.AUTONOE, name: 'Autonoe (Female)', type: 'preset'},
    {id: VoiceEnum.CALLIRRHOE, name: 'Callirrhoe (Female)', type: 'preset'},
    {id: VoiceEnum.CHARON, name: 'Charon (Male)', type: 'preset'},
    {id: VoiceEnum.DESPINA, name: 'Despina (Female)', type: 'preset'},
    {id: VoiceEnum.ENCELADUS, name: 'Enceladus (Male)', type: 'preset'},
    {id: VoiceEnum.ERINOME, name: 'Erinome (Female)', type: 'preset'},
    {id: VoiceEnum.FENRIR, name: 'Fenrir (Male)', type: 'preset'},
    {id: VoiceEnum.GACRUX, name: 'Gacrux (Female)', type: 'preset'},
    {id: VoiceEnum.IAPETUS, name: 'Iapetus (Male)', type: 'preset'},
    {id: VoiceEnum.KORE, name: 'Kore (Female)', type: 'preset'},
    {id: VoiceEnum.LAOMEDEIA, name: 'Laomedeia (Female)', type: 'preset'},
    {id: VoiceEnum.LEDA, name: 'Leda (Female)', type: 'preset'},
    {id: VoiceEnum.ORUS, name: 'Orus (Male)', type: 'preset'},
    {id: VoiceEnum.PUCK, name: 'Puck (Male)', type: 'preset'},
    {id: VoiceEnum.PULCHERRIMA, name: 'Pulcherrima (Female)', type: 'preset'},
    {id: VoiceEnum.RASALGETHI, name: 'Rasalgethi (Male)', type: 'preset'},
    {id: VoiceEnum.SADACHBIA, name: 'Sadachbia (Male)', type: 'preset'},
    {id: VoiceEnum.SADALTAGER, name: 'Sadaltager (Male)', type: 'preset'},
    {id: VoiceEnum.SCHEDAR, name: 'Schedar (Male)', type: 'preset'},
    {id: VoiceEnum.SULAFAT, name: 'Sulafat (Female)', type: 'preset'},
    {id: VoiceEnum.UMBRIEL, name: 'Umbriel (Male)', type: 'preset'},
    {id: VoiceEnum.VINDEMIATRIX, name: 'Vindemiatrix (Female)', type: 'preset'},
    {id: VoiceEnum.ZEPHYR, name: 'Zephyr (Female)', type: 'preset'},
    {id: VoiceEnum.ZUBENELGENUBI, name: 'Zubenelgenubi (Male)', type: 'preset'},
  ];

  constructor(
    private audioService: AudioService,
    private snackBar: MatSnackBar,
    private workspaceStateService: WorkspaceStateService,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    public matIconRegistry: MatIconRegistry,
  ) {
    this.matIconRegistry.addSvgIcon(
      'white-gemini-spark-icon',
      this.setPath(`${this.path}/white-gemini-spark-icon.svg`),
    );
  }

  private path = '../../assets/images';

  private setPath(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  onVoiceSelectionChange(value: string) {
    if (value === 'add-new-voice') {
      this.openAddVoiceDialog();
      this.selectedVoice = '';
    } else {
      this.selectedVoice = value;
    }
  }

  openAddVoiceDialog() {
    const dialogRef = this.dialog.open(AddVoiceDialogComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newVoice: VoiceOption = {
          id: `custom-${Date.now()}`, // In real app, this ID comes from backend
          name: result.name,
          type: 'custom',
        };
        this.voices = [newVoice, ...this.voices];
        this.selectedVoice = newVoice.id;
        handleSuccessSnackbar(this.snackBar, 'Voice cloned successfully!');
      }
    });
  }

  generate() {
    this.isLoading = true;
    this.mediaItem = null; // Clear previous result

    const activeWorkspaceId = this.workspaceStateService.getActiveWorkspaceId();
    if (!activeWorkspaceId) {
      handleErrorSnackbar(this.snackBar, { message: 'Please select a workspace first.' }, 'Workspace');
      return;
    }

    // 1. Determine specific backend model based on UI selection
    let backendModel: GenerationModelEnum;

    if (this.selectedModel === 'lyria') {
      backendModel = GenerationModelEnum.LYRIA_002;
    } else if (this.selectedModel === 'chirp') {
      backendModel = GenerationModelEnum.CHIRP_3;
    } else {
      // Default to Flash TTS for Gemini selection
      backendModel = GenerationModelEnum.GEMINI_2_5_FLASH_TTS;
    }

    // 2. Construct the generic DTO
    const request: CreateAudioDto = {
      model: backendModel,
      prompt: this.prompt,
      workspaceId: activeWorkspaceId,
      // Optional fields (backend ignores them if not relevant to the specific model)
      negativePrompt:
        this.selectedModel === 'lyria' ? this.negativePrompt : undefined,
      seed: this.selectedModel === 'lyria' ? this.seed : undefined,
      sampleCount: this.sampleCount,
      languageCode:
        this.selectedModel !== 'lyria'
          ? (this.selectedLanguage as LanguageEnum)
          : undefined,
      voiceName:
        this.selectedModel !== 'lyria'
          ? (this.selectedVoice as VoiceEnum)
          : undefined,
    };

    this.isLoading = true;
    this.audioUrl = null;

    this.audioService
      .generateAudio(request)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response: MediaItem) => {
          this.mediaItem = response;
          // The Lightbox will handle displaying the first item automatically via inputs
        },
        error: (error: any) => {
          handleErrorSnackbar(this.snackBar, error, 'Generation');
          console.error('Generation failed:', error);
        },
      });
  }

  // --- Player Logic ---
  togglePlay() {
    const audio = this.audioPlayerRef.nativeElement;
    if (audio.paused) {
      audio.play();
      this.isPlaying = true;
    } else {
      audio.pause();
      this.isPlaying = false;
    }
  }

  onTimeUpdate() {
    const audio = this.audioPlayerRef.nativeElement;
    if (audio.duration) {
      this.progressValue = (audio.currentTime / audio.duration) * 100;
      this.currentTime = this.formatTime(audio.currentTime);
    }
  }

  seek(value: number) {
    const audio = this.audioPlayerRef.nativeElement;
    if (audio.duration) {
      audio.currentTime = (value / 100) * audio.duration;
    }
  }

  onAudioLoaded() {
    const audio = this.audioPlayerRef.nativeElement;
    this.isPlaying = false;
    this.duration = this.formatTime(audio.duration);
  }

  onAudioEnded() {
    this.isPlaying = false;
    this.progressValue = 0;
    this.currentTime = '0:00';
  }

  private formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}
