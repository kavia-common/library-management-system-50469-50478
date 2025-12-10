import taxonomy, { isMockMode } from './services/taxonomy';
import { getBooks } from './services/api';

describe('taxonomy mock service', () => {
  beforeAll(() => {
    // ensure we are in mock mode for CI
    process.env.REACT_APP_API_BASE = '';
    // reset storage
    localStorage.clear();
  });

  test('seeds are available', async () => {
    const genres = await taxonomy.getGenres();
    const tags = await taxonomy.getTags();
    expect(genres.length).toBeGreaterThan(0);
    expect(tags.length).toBeGreaterThan(0);
  });

  test('create/update/delete tag', async () => {
    const created = await taxonomy.createTag({ name: 'Bestseller' });
    expect(created.id).toBeTruthy();
    const updated = await taxonomy.updateTag(created.id, { description: 'Top seller' });
    expect(updated.description).toBe('Top seller');
    const res = await taxonomy.deleteTag(created.id);
    expect(res.success).toBe(true);
  });

  test('assign to book and filter books', async () => {
    // there are mock books in api.js
    const tags = await taxonomy.getTags();
    const tagId = tags[0].id;
    await taxonomy.assignTagsToBook(1, { tags: [tagId], genres: [] });
    const all = await getBooks();
    expect(all.find((b) => b.id === 1)?.taxonomy?.tags).toContain(tagId);

    const filtered = await getBooks({ tags: [tagId] });
    expect(filtered.some((b) => b.id === 1)).toBe(true);
  });
});
