import { render, screen } from '@testing-library/react';
import App from './App';

test('renders navigation title', () => {
  render(<App />);
  const title = screen.getByText(/Ocean Library/i);
  expect(title).toBeInTheDocument();
});
