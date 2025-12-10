import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import './i18n';
import * as api from './services/api';

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

test('trending recommendations section renders title', async () => {
  render(<App />);
  const heading = await screen.findByText(/Trending|Tendencias/i, {}, { timeout: 3000 });
  expect(heading).toBeInTheDocument();
});

test('favorite toggle updates storage', async () => {
  // ensure clean state
  try { window.localStorage.removeItem('favorites'); } catch {}
  render(<App />);
  // wait for any book cards to render from grid or recs
  const quickButtons = await screen.findAllByRole('button', { name: /Quick view|Vista rápida/i });
  expect(quickButtons.length).toBeGreaterThan(0);

  // find a heart button by title (add to favorites)
  const addFavButton = await screen.findByTitle(/Add to favorites|Agregar a favoritos/i);
  fireEvent.click(addFavButton);

  const favs = api.readFavorites();
  expect(favs.length).toBeGreaterThan(0);
});

test('i18n strings resolve for recommendations', async () => {
  render(<App />);
  const str = await screen.findByText(/Popular this week|Popular esta semana/i);
  expect(str).toBeInTheDocument();
});
