import { render, screen } from '@testing-library/react';
import App from './App';
import './i18n';

test('renders navigation title', () => {
  render(<App />);
  const enTitle = screen.queryByText(/Ocean Library/i);
  const esTitle = screen.queryByText(/Biblioteca Océano/i);
  expect(enTitle || esTitle).toBeTruthy();
});

test('renders notifications bell button', () => {
  render(<App />);
  const btn = screen.getByRole('button', { name: /open notifications|abrir notificaciones/i });
  expect(btn).toBeInTheDocument();
});
