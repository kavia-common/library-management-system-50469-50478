import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BookDetailsPage from './pages/BookDetailsPage';
import ManageBooks from './pages/ManageBooks';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/Profile';
import { injectCssVariables } from './theme';

// PUBLIC_INTERFACE
function App() {
  useEffect(() => {
    injectCssVariables();
  }, []);

  return (
    <div className="app-shell">
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/manage" element={<ManageBooks />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/books/:id" element={<BookDetailsPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
