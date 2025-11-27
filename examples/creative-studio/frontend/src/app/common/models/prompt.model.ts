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

import {DocumentData} from '@angular/fire/firestore';

export interface CreatePromptMediaDto extends DocumentData {
  metadata: Metadata;
  subject: Subject;
  scene_setup: SceneSetup;
  visual_style: VisualStyle;
  camera_directives: CameraDirectives;
  audio: AudioDesign;
  timeline: TimelineEvent[];
  constraints: Constraints;
  final_summary_prompt: string;
}

interface Metadata extends DocumentData {
  prompt_name: string;
  version: number;
  target_model: string;
  core_concept: string;
}

interface SceneSetup extends DocumentData {
  environment: string;
  mood: string;
  key_objects: string[];
  temporal_elements: string;
}

interface Subject extends DocumentData {
  main_subject: string;
  character_details?: string;
  key_objects: string[];
}

interface VisualStyle extends DocumentData {
  aesthetic: string;
  color_palette: string;
  resolution_and_format: string;
}

interface CameraDirectives extends DocumentData {
  camera_angles: string[];
  camera_movements: string[];
  lens_and_optical_effects?: string;
  overall_movement?: string;
  shot_types?: string;
}

interface TimelineEvent extends DocumentData {
  sequence_id: number;
  timestamp: string;
  action: string;
  camera_instruction: string;
  audio_description: string;
}

interface AudioDesign extends DocumentData {
  music_style?: string;
  key_sound_effects?: string;
  dialogue_or_narration?: string;
  audio_description: string;
}

interface Constraints extends DocumentData {
  negative_prompts: string[];
}
