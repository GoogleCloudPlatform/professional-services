/*
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes,   
 Route } from 'react-router-dom';
import App from './App';
import NewRisk from './components/NewRisk';
import NewApplication from './components/NewApplication';
import UserJourneys from './components/UserJourneys';
import DeleteRisk from './components/DeleteRisk';

global.fetch = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    jest.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ idToken: 'test-id-token' }), 
    });
  });

  afterEach(() => {
    jest.restoreAllMocks(); 
  });

  it('renders the application title', () => {
    render(<App />);
    expect(screen.getByText('SRE Risk Analysis Tool')).toBeInTheDocument();
  });

  it('fetches and displays application options', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        { id: 'app1', applicationName: 'App 1' },
        { id: 'app2', applicationName: 'App 2' },
      ]),
    });

    render(<App />);
    expect(screen.getByPlaceholderText('Select Application')).toBeInTheDocument();

    await screen.findByText('App 1');
    expect(screen.getByText('App 1')).toBeInTheDocument();
    expect(screen.getByText('App 2')).toBeInTheDocument();
  });

  it('toggles the sidebar when the toggle button is clicked', () => {
    const { container } = render(<App />);
    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).toHaveClass('open');
    fireEvent.click(screen.getByRole('button'));
    expect(sidebar).toHaveClass('closed');
  });

  it('renders UserJourneys component correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ idToken: 'test-id-token' }),
    });

    render(
      <MemoryRouter initialEntries={['/newUserJourney']}>
        <Routes>
          <Route path="/newUserJourney" element={<UserJourneys applicationId="app1" backendURL="http://localhost:5000" idToken="test-id-token"/>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Critical User Journey:')).toBeInTheDocument();
      expect(screen.getByLabelText('Critical User Journey Description:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });

  it('renders NewRisk component correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ idToken: 'test-id-token' }),
    });

    render(
      <MemoryRouter initialEntries={['/newRisk']}>
        <Routes>
          <Route path="/newRisk" element={<NewRisk journeys={[]} backendURL="http://localhost:5000" idToken="test-id-token"/>} />
        </Routes>
      </MemoryRouter>
    );
    screen.debug();
    await waitFor(() => {
      expect(screen.getByLabelText('[ETTD] Estimated Time to Detect (Mins)')).toBeInTheDocument();
      expect(screen.getByLabelText('Impact (% of Users Impacted)')).toBeInTheDocument();
      expect(screen.getByLabelText('Risk Name')).toBeInTheDocument();
    });
  });

  it('renders NewApplication component correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ idToken: 'test-id-token' }),
    });

    render(
      <MemoryRouter initialEntries={['/newApplication']}>
        <Routes>
          <Route path="/newApplication" element={<NewApplication journeys={[]} backendURL="http://localhost:5000" setIsAddingNewApplication={() => { }} idToken="test-id-token"/>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Application Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Application Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });

  it('renders DeleteRisk component correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ idToken: 'test-id-token' }),
    });

    // Mock the window.confirm function
    window.confirm = jest.fn(() => true);

    render(
      <MemoryRouter initialEntries={['/deleteRisk/cuj1/risk1']}>
        <Routes>
          <Route path="/deleteRisk/:cujId/:riskId" element={<DeleteRisk backendURL="http://localhost:5000" idToken="test-id-token" />} />
        </Routes>
      </MemoryRouter>
    );

    // Assertions for DeleteRisk (e.g., check if a confirmation dialog is shown)
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this risk?');
    });
  });


});
