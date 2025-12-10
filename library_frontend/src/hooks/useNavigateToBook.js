import { useNavigate } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function useNavigateToBook() {
  const navigate = useNavigate();
  return (book) => navigate(`/books/${encodeURIComponent(book.id)}`);
}
