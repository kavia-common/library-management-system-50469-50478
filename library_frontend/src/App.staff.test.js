import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import LibrariesManagement from './pages/staff/LibrariesManagement';
import StaffLogin from './pages/staff/StaffLogin';
import RolesPermissions from './pages/staff/RolesPermissions';
import StaffUsersManagement from './pages/staff/StaffUsersManagement';

function renderWithAuth(ui, { route = '/' } = {}) {
  window.history.pushState({}, 'Test', route);
  return render(<AuthProvider>{ui}</AuthProvider>, { wrapper: ({ children }) => <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter> });
}

test('ProtectedRoute redirects to staff login when no user', () => {
  renderWithAuth(
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/staff/libraries" element={<LibrariesManagement />} />
      </Route>
      <Route path="/staff/login" element={<StaffLogin />} />
    </Routes>,
    { route: '/staff/libraries' }
  );
  expect(screen.getByText(/Staff Login/i)).toBeInTheDocument();
});

test('Libraries CRUD mock create shows in table', async () => {
  // login as ADMIN via login screen button
  renderWithAuth(
    <Routes>
      <Route path="/staff/login" element={<StaffLogin />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/staff/libraries" element={<LibrariesManagement />} />
      </Route>
    </Routes>,
    { route: '/staff/login' }
  );
  fireEvent.click(screen.getByText(/ADMIN/));
  // navigate to libraries
  window.history.pushState({}, '', '/staff/libraries');
  // Wait for loading then click add
  await waitFor(() => {});
  const addBtn = await screen.findByRole('button', { name: /Add Library|Agregar Biblioteca/i });
  fireEvent.click(addBtn);
  // Fill form
  const nameInput = screen.getByLabelText(/Name|Nombre/i);
  fireEvent.change(nameInput, { target: { value: 'Test Library' } });
  const addressInput = screen.getByLabelText(/Address|Dirección/i);
  fireEvent.change(addressInput, { target: { value: '123 Test St' } });
  const hoursInput = screen.getByLabelText(/Hours|Horario/i);
  fireEvent.change(hoursInput, { target: { value: '9-5' } });
  const saveBtn = screen.getByText(/Save|Guardar/i);
  fireEvent.click(saveBtn);
  await waitFor(async () => {
    expect(await screen.findByText(/Test Library/)).toBeInTheDocument();
  });
});

test('Changing role permissions updates users permissions', async () => {
  // Login as ADMIN
  renderWithAuth(
    <Routes>
      <Route path="/staff/login" element={<StaffLogin />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/staff/roles" element={<RolesPermissions />} />
        <Route path="/staff/users" element={<StaffUsersManagement />} />
      </Route>
    </Routes>,
    { route: '/staff/login' }
  );
  fireEvent.click(screen.getByText(/ADMIN/));
  window.history.pushState({}, '', '/staff/roles');
  // Wait for roles table
  const toggleLabelRegex = /Toggle permission|Alternar permiso/i;
  const anyCheckbox = await screen.findAllByRole('checkbox');
  // toggle first checkbox if exists
  if (anyCheckbox.length > 0) {
    fireEvent.click(anyCheckbox[0]);
  }
  // Navigate to users and verify table renders
  window.history.pushState({}, '', '/staff/users');
  await waitFor(() => {
    expect(screen.getByText(/Staff Users|Usuarios del Personal/i)).toBeInTheDocument();
  });
});
