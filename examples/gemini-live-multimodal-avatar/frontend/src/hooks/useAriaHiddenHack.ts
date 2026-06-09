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

import { useEffect } from 'react';

/**
 * useAriaHiddenHack aggressively prevents MUI Modals from adding aria-hidden to the root container.
 * 
 * Background: When aria-hidden is true, modern browsers (especially Chrome) suspend video 
 * decoding for elements within that container to save resources. In the case of Gemini Live 
 * and other real-time streaming avatars, this suspension causes the MediaSource pipeline 
 * to permanently crash with an InvalidStateError or simply freeze the video frames.
 * 
 * This hook sets up a MutationObserver on the document body to immediately remove the 
 * aria-hidden attribute whenever it's added to any element, especially to handle 
 * disablePortal modals that apply the attribute deeper in the DOM tree.
 */
export function useAriaHiddenHack() {
  useEffect(() => {
    // We observe the entire body to catch any element MUI decides to hide.
    const targetNode = document.body;
    if (!targetNode) return;

    // We still check the root immediately just in case
    const rootNode = document.getElementById('root');
    if (rootNode && rootNode.getAttribute('aria-hidden') === 'true') {
      rootNode.removeAttribute('aria-hidden');
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          const target = mutation.target as HTMLElement;
          if (target.getAttribute('aria-hidden') === 'true') {
            target.removeAttribute('aria-hidden');
          }
        }
      });
    });

    observer.observe(targetNode, { 
      attributes: true, 
      attributeFilter: ['aria-hidden'],
      subtree: true 
    });
    
    return () => {
      observer.disconnect();
    };
  }, []);
}
