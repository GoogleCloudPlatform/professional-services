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

import React from 'react';
import { useModalContext } from '../context/ModalContext';
import AccountBalanceModal from './AccountBalanceModal';
import RecentTransactionsModal from './RecentTransactionsModal';
import ActionSuccessModal from './ActionSuccessModal';

import type { AccountBalanceData } from './AccountBalanceModal';
import type { Transaction } from './RecentTransactionsModal';
import type { ActionSuccessData } from './ActionSuccessModal';

const GlobalModals: React.FC = () => {
  const { activeModal, modalData, closeModal } = useModalContext();

  return (
    <>
      <AccountBalanceModal
        open={activeModal === 'account_balance'}
        onClose={closeModal}
        data={activeModal === 'account_balance' ? (modalData as AccountBalanceData | AccountBalanceData[]) : null}
      />
      <RecentTransactionsModal
        open={activeModal === 'recent_transactions'}
        onClose={closeModal}
        transactions={activeModal === 'recent_transactions' ? (modalData as Transaction[]) : null}
      />
      <ActionSuccessModal
        open={activeModal === 'action_success'}
        onClose={closeModal}
        data={activeModal === 'action_success' ? (modalData as ActionSuccessData) : null}
      />

    </>
  );
};

export default GlobalModals;