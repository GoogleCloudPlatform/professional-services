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

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ShowAppointmentSlotsModal from './ShowAppointmentSlotsModal';

describe('ShowAppointmentSlotsModal', () => {
  const mockSlots = [
    { id: '1', label: '10:00 AM' },
    { id: '2', label: '11:00 AM' },
  ];
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  it('renders correctly when open', () => {
    render(
      <ShowAppointmentSlotsModal
        open={true}
        slots={mockSlots}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Schedule Appointment')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('11:00 AM')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(
      <ShowAppointmentSlotsModal
        open={true}
        slots={mockSlots}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('resets state when opened', () => {
    const { rerender } = render(
      <ShowAppointmentSlotsModal
        open={false}
        slots={mockSlots}
        initialLocation="Test Location"
        initialTopic="Test Topic"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    rerender(
      <ShowAppointmentSlotsModal
        open={true}
        slots={mockSlots}
        initialLocation="Test Location"
        initialTopic="Test Topic"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByLabelText('Location')).toHaveValue('Test Location');
    expect(screen.getByLabelText('Topic')).toHaveValue('Test Topic');
  });

  it('calls onConfirm when a slot is selected and Confirm is clicked', () => {
    render(
      <ShowAppointmentSlotsModal
        open={true}
        slots={mockSlots}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByText('10:00 AM'));
    fireEvent.click(screen.getByText('Confirm Appointment'));

    expect(mockOnConfirm).toHaveBeenCalledWith(
      mockSlots[0],
      '',
      ''
    );
  });

  it('updates location and topic fields', () => {
    render(
      <ShowAppointmentSlotsModal
        open={true}
        slots={mockSlots}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const locationInput = screen.getByLabelText('Location');
    const topicInput = screen.getByLabelText('Topic');

    fireEvent.change(locationInput, { target: { value: 'New Branch' } });
    fireEvent.change(topicInput, { target: { value: 'New Topic' } });

    fireEvent.click(screen.getByText('11:00 AM'));
    fireEvent.click(screen.getByText('Confirm Appointment'));

    expect(mockOnConfirm).toHaveBeenCalledWith(
      mockSlots[1],
      'New Branch',
      'New Topic'
    );
  });

  it('disables Confirm button if no slot is selected', () => {
    render(
      <ShowAppointmentSlotsModal
        open={true}
        slots={mockSlots}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const confirmButton = screen.getByText('Confirm Appointment').closest('button');
    expect(confirmButton).toBeDisabled();
  });
});
