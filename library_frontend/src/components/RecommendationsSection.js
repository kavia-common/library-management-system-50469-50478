import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import RecommendationRow from './RecommendationRow';
import {
  getTrendingBooks,
  getRecommendationsByFavorites,
  readFavorites,
  toggleFavorite
} from '../services/api';

// PUBLIC_INTERFACE
export default function RecommendationsSection({ contextBookId = null, onOpen }) {
  /**
   * Recommendations container for the Home page.
   * Renders Trending and Favorites-based sections. Users-also-borrowed is shown in context (details page).
   */
  const { t } = useTranslation();
  const [trending, setTrending] = useState({ loading: true, items: [] });
  const [byFav, setByFav] = useState({ loading: true, items: [] });
  const [favorites, setFavorites] = useState(readFavorites());

  useEffect(() => {
    let active = true;
    setTrending((s) => ({ ...s, loading: true }));
    getTrendingBooks()
      .then((items) => { if (active) setTrending({ loading: false, items: items || [] }); })
      .catch(() => { if (active) setTrending({ loading: false, items: [] }); });

    setByFav((s) => ({ ...s, loading: true }));
    getRecommendationsByFavorites()
      .then((items) => { if (active) setByFav({ loading: false, items: items || [] }); })
      .catch(() => { if (active) setByFav({ loading: false, items: [] }); });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'favorites') {
        setFavorites(readFavorites());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const hasFavorites = favorites.length > 0;

  const onToggleFavoriteHandler = (bookId) => {
    const next = toggleFavorite(bookId);
    setFavorites(next);
  };

  const trendingTitle = t('recs.trendingTitle');
  const trendingSubtitle = t('recs.trendingSubtitle');

  const favTitle = t('recs.becauseYouLiked');
  const favSubtitle = hasFavorites ? t('recs.fromYourFavorites') : null;

  const favEmpty = t('recs.favoritesEmpty');

  // Avoid rendering empty favorites section when no favorites
  const showFavSection = hasFavorites && (byFav.loading || byFav.items.length > 0);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <RecommendationRow
        title={trendingTitle}
        subtitle={trendingSubtitle}
        books={trending.items}
        loading={trending.loading}
        onOpen={onOpen}
        favorites={favorites}
        onToggleFavorite={onToggleFavoriteHandler}
      />

      {showFavSection ? (
        <RecommendationRow
          title={favTitle}
          subtitle={favSubtitle}
          books={byFav.items}
          loading={byFav.loading}
          emptyMessage={favEmpty}
          onOpen={onOpen}
          favorites={favorites}
          onToggleFavorite={onToggleFavoriteHandler}
        />
      ) : null}
    </div>
  );
}
