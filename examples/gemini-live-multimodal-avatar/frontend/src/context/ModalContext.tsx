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

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AccountBalanceData } from '../components/AccountBalanceModal';
import type { Transaction } from '../components/RecentTransactionsModal';
import type { AppointmentSlot } from '../components/ShowAppointmentSlotsModal';
import type { ActionSuccessData } from '../components/ActionSuccessModal';

export type ModalType = 'account_balance' | 'recent_transactions' | 'show_appointment_slots' | 'action_success' | null;

export interface ShowAppointmentSlotsData {
  slots?: AppointmentSlot[];
  status?: string;
  location?: string;
  topic?: string;
}


export type ModalData = 
  | AccountBalanceData
  | Transaction[]
  | ShowAppointmentSlotsData
  | ActionSuccessData
  | null;

interface ModalContextType {
  activeModal: ModalType;
  modalData: ModalData;
  openModal: (type: ModalType, data?: ModalData) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<ModalData>(null);

  const openModal = useCallback((type: ModalType, data: ModalData = null) => {
    setActiveModal(type);
    setModalData(data);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  const value = useMemo(() => ({
    activeModal, modalData, openModal, closeModal
  }), [activeModal, modalData, openModal, closeModal]);

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};
