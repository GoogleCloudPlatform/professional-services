import React from 'react';
import {render, screen} from '@testing-library/react';
import Dashboard from './Dashboard';

test('renders SLO Tools Heading', () => {
  render(<Dashboard />);
  const headingElement = screen.getByText(/SLO Tools/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders JSON Definition to TF Converter Heading', () => {
  render(<Dashboard />);
  const headingElement = screen.getByText(/JSON Definition to TF Converter/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders Convert Button', () => {
  render(<Dashboard />);
  const buttonElement = document.querySelector(
    '.MuiButton-containedPrimary[type="button"]'
  );
  expect(buttonElement).toBeInTheDocument();
});
