import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BookDetailsPage from './pages/BookDetailsPage';
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
          <Route path="/books/:id" element={<BookDetailsPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
