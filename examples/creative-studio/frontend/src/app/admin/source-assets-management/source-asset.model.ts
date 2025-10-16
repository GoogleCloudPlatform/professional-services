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

export enum AssetScopeEnum {
  PRIVATE = 'private', // Belongs to a single user
  SYSTEM = 'system', // Available to all users (e.g., VTO models)
}

export enum AssetTypeEnum {
  GENERIC_IMAGE = 'generic_image',
  GENERIC_VIDEO = 'generic_video',
  VTO_PRODUCT = 'vto_product',
  VTO_PERSON_FEMALE = 'vto_person_female',
  VTO_PERSON_MALE = 'vto_person_male',
  VTO_TOP = 'vto_top',
  VTO_BOTTOM = 'vto_bottom',
  VTO_DRESS = 'vto_dress',
  VTO_SHOE = 'vto_shoe',
}

export interface SourceAsset {
  id?: string;
  description?: string;
  scope: AssetScopeEnum;
  assetType: AssetTypeEnum;
  gcsUri: string;
  presignedUrl?: string;
  originalFilename: string;
  mimeType?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}
