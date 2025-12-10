import { stringifyCSV } from "./services/dataIO";
import { exportReadingListCSV } from "./services/dataIO";
import { parseFile as _parseFile, validateRows } from "./services/dataIO";

// Mock taxonomy service for validation tests
jest.mock("./services/taxonomy", () => ({
  getAllGenres: jest.fn().mockResolvedValue([{ name: "Classic" }, { name: "Fiction" }]),
  getAllTags: jest.fn().mockResolvedValue([{ name: "American" }]),
  createGenre: jest.fn().mockResolvedValue({}),
  createTag: jest.fn().mockResolvedValue({}),
}));

// Mock api
jest.mock("./services/api", () => ({
  getBooks: jest.fn().mockResolvedValue([]),
  upsertBookByISBN: jest.fn().mockResolvedValue({}),
}));

function fakeFile(name, content) {
  return {
    name,
    text: async () => content,
  };
}

test("stringifyCSV handles objects with header", () => {
  const csv = stringifyCSV([{ a: 1, b: "x,y" }, { a: 2, b: "z" }]);
  expect(csv.split("\n")[0]).toBe("a,b");
  expect(csv).toContain('"x,y"');
});

test("parse and validate CSV rows", async () => {
  const csv = "title,author,isbn,description,publishedYear,genres,tags,coverUrl\n" +
              "Book A,Author A,123456789,Desc,2000,Classic,American,https://x.com/a\n" +
              "Book B,,123,Desc,abcd,Fiction,,http://x.com/b\n";
  const file = fakeFile("books.csv", csv);
  const result = await _parseFile(file);
  expect(result.rows.length).toBe(2);

  const { validRows, invalidRows, counts } = await validateRows(result.rows, { autoCreateMissing: false });
  expect(counts.total).toBe(2);
  expect(validRows.length).toBe(1);
  expect(invalidRows.length).toBe(1);
  expect(invalidRows[0]._errors.join(" ")).toMatch(/Missing required: author/);
});

test("exportReadingListCSV outputs header and rows", async () => {
  const favorites = [{ isbn: "9780743273565", addedAt: "2020-01-01T00:00:00Z" }];
  const csv = await exportReadingListCSV({ favorites, allBooks: [
    { isbn: "9780743273565", title: "The Great Gatsby", author: "F. Scott Fitzgerald", genres: ["Classic"], tags: ["American"] }
  ]});
  const lines = csv.split("\n");
  expect(lines[0]).toContain("title,author,isbn,description,publishedYear,genres,tags,coverUrl,addedAt");
  expect(csv).toContain("The Great Gatsby");
});
