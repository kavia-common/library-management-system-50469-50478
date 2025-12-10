import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import './index.css';
import { ThemeProvider } from './theme/ThemeContext';
import Home from './pages/Home';
import BookDetails from './pages/BookDetails';
import NavBar from './components/NavBar';

// PUBLIC_INTERFACE
function App() {
  /**
   * PUBLIC_INTERFACE
   * Root application with routing, theme provider, and top navigation.
   * Routes:
   *  - "/" -> Home (search + grid)
   *  - "/books/:id" -> BookDetails
   */
  return (
    <ThemeProvider>
      <div className="app-root">
        <BrowserRouter>
          <NavBar />
          <main aria-live="polite">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/books/:id" element={<BookDetails />} />
            </Routes>
          </main>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
