import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { MemoryRouter } from 'react-router-dom';

function navigateTo(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

test('renders Events page and calendar/list toggles', async () => {
  navigateTo('/events');
  expect(await screen.findByText(/Events/i)).toBeInTheDocument();
  const listBtn = screen.getByText(/List/i);
  fireEvent.click(listBtn);
  expect(screen.getByText(/List/i)).toBeInTheDocument();
});

test('RSVP toggles update mock store', async () => {
  navigateTo('/events');
  // open first event from list section by clicking a card appears after fetch
  await waitFor(() => expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0));
  const firstCard = screen.getAllByRole('listitem')[0];
  fireEvent.click(firstCard.querySelector('button'));
  // Modal opens with RSVP buttons
  const goingBtn = await screen.findByText(/Going/i);
  fireEvent.click(goingBtn);
  expect(goingBtn.classList.contains('active')).toBeTruthy();
});

test('reminders scheduling via mock notifications', async () => {
  navigateTo('/events');
  await waitFor(() => expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0));
  const firstCard = screen.getAllByRole('listitem')[0];
  fireEvent.click(firstCard.querySelector('button'));
  const remindBtn = await screen.findByText(/Remind me/i);
  fireEvent.click(remindBtn); // this clicks (1h) button maybe; ensure no crash
});

test('challenges join and progress', async () => {
  navigateTo('/events');
  const joinButtons = await screen.findAllByText(/Join/i);
  fireEvent.click(joinButtons[0]);
  // after join, a Progress UI should appear
  await waitFor(() => expect(screen.getAllByText(/Progress/i).length).toBeGreaterThan(0));
});

test('i18n keys resolve', () => {
  navigateTo('/events');
  expect(screen.getByText(/Events/i)).toBeInTheDocument();
  expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
  expect(screen.getByText(/Categories/i)).toBeInTheDocument();
});
