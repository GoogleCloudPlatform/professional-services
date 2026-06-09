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

import { useEffect, useRef } from 'react';
import { useModalContext } from '../context/ModalContext';

/**
 * useGeminiModalAutomation handles the "Voice-Forward" UX policy of automatically 
 * closing informational modals when the user begins speaking to the AI.
 */
export function useGeminiModalAutomation() {
  const { activeModal, closeModal } = useModalContext();

  const activeModalRef = useRef(activeModal);
  useEffect(() => {
    activeModalRef.current = activeModal;
  }, [activeModal]);

  const closeModalRef = useRef(closeModal);
  useEffect(() => {
    closeModalRef.current = closeModal;
  }, [closeModal]);

  const handleUserStartedSpeaking = () => {
    // Auto-close informational modals at the start of a new utterance.
    // We explicitly exclude 'show_appointment_slots' as it is a selection modal 
    // that the user might be interacting with while talking.
    if (activeModalRef.current && activeModalRef.current !== 'show_appointment_slots') {
      closeModalRef.current();
    }
  };

  return { handleUserStartedSpeaking };
}
