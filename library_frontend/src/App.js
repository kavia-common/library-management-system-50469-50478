import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import './index.css';
import { ThemeProvider } from './theme/ThemeContext';
import Home from './pages/Home';
import BookDetails from './pages/BookDetails';
import GamificationPage from './pages/GamificationPage';
import NavBar from './components/NavBar';
import NotificationsCenter from './components/NotificationsCenter';
import PreferencesModal from './components/PreferencesModal';
import { ToastProvider } from './components/ToastContext';

// PUBLIC_INTERFACE
function AppShell() {
  /** Internal shell that has access to navigation for notifications center */
  const navigate = useNavigate();
  const [openCenter, setOpenCenter] = React.useState(false);
  const [openPrefs, setOpenPrefs] = React.useState(false);

  // Expose controls to NavBar via context or window events if needed; here we attach to window for simplicity.
  React.useEffect(() => {
    const openCenterHandler = () => setOpenCenter(true);
    const openPrefsHandler = () => setOpenPrefs(true);
    window.addEventListener('openNotifications', openCenterHandler);
    window.addEventListener('openPreferences', openPrefsHandler);
    return () => {
      window.removeEventListener('openNotifications', openCenterHandler);
      window.removeEventListener('openPreferences', openPrefsHandler);
    };
  }, []);

  const onNavigateToBook = (bookId) => {
    navigate(`/books/${bookId}`);
    setOpenCenter(false);
  };

  return (
    <>
      <NavBar />
      <main aria-live="polite">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books/:id" element={<BookDetails />} />
          <Route path="/gamification" element={<GamificationPage />} />
        </Routes>
      </main>

      <NotificationsCenter
        open={openCenter}
        onClose={() => setOpenCenter(false)}
        onNavigateToBook={onNavigateToBook}
      />
      <PreferencesModal open={openPrefs} onClose={() => setOpenPrefs(false)} />
    </>
  );
}

// PUBLIC_INTERFACE
function App() {
  /**
   * PUBLIC_INTERFACE
   * Root application with routing, theme provider, toast provider, and top navigation.
   * Routes:
   *  - "/" -> Home (search + grid)
   *  - "/books/:id" -> BookDetails
   */
  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="app-root">
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
