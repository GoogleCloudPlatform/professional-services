/**
 * Copyright 2026 Google LLC
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

import { describe, it, expect } from 'vitest';
import { float32ToInt16, int16ToBase64 } from './audioConversion';

describe('audioConversion', () => {
  describe('float32ToInt16', () => {
    it('should convert 1.0 to 32767', () => {
      const input = new Float32Array([1.0]);
      const output = float32ToInt16(input);
      expect(output[0]).toBe(32767);
    });

    it('should convert -1.0 to -32768', () => {
      const input = new Float32Array([-1.0]);
      const output = float32ToInt16(input);
      expect(output[0]).toBe(-32768);
    });

    it('should convert 0 to 0', () => {
      const input = new Float32Array([0]);
      const output = float32ToInt16(input);
      expect(output[0]).toBe(0);
    });

    it('should clip values outside [-1, 1]', () => {
      const input = new Float32Array([1.5, -2.0]);
      const output = float32ToInt16(input);
      expect(output[0]).toBe(32767);
      expect(output[1]).toBe(-32768);
    });
  });

  describe('int16ToBase64', () => {
    it('should correctly encode simple Int16Array', () => {
      // 0 in Int16 is [0, 0] in bytes
      const input = new Int16Array([0]);
      const output = int16ToBase64(input);
      // btoa('\0\0') is 'AAA='
      expect(output).toBe('AAA=');
    });

    it('should handle multiple values', () => {
      const input = new Int16Array([1, -1]);
      // 1 is [1, 0], -1 is [255, 255]
      const output = int16ToBase64(input);
      expect(output).toBe('AQD//w==');
    });
  });
});
