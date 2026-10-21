// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { FormatModule } from './types';
import { zipFormat } from './zip';
import { yamlFormat } from './yaml';
import { adkFormat } from './adk';
import { cxasFormat } from './cxas';
import { visualizerFormat } from './visualizer';
import { toolsSignaturesFormat } from './report/tools_signatures';

const formats: Record<string, FormatModule> = {
  zip: zipFormat,
  yaml: yamlFormat,
  adk: adkFormat,
  cxas: cxasFormat,
  visualizer: visualizerFormat,
  'tools-signatures': toolsSignaturesFormat,
  'tools_signatures': toolsSignaturesFormat
};

export function getFormat(id: string): FormatModule | undefined {
  return formats[id];
}

export function getAllFormats(): FormatModule[] {
  return Object.values(formats);
}
