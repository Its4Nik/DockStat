import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { column, DB } from "../src/index"

/**
 * Tests for type-safe JOIN functionality with proper IntelliSense
 *
 * These tests demonstrate that:
 * - join() methods accept a generic type parameter for the joined table
 * - Result type is properly merged (e.g., User & Post)
 * - IntelliSense works for columns from both tables
 * - select, where, orderBy methods work with the merged type
 */

const db = new DB(":memory:")

interface User extends Record<string, unknown> {
  id: number
  name: string
  email: string
}

interface Post extends Record<string, unknown> {
  id: number
  user_id: number
  title: string
  content: string | null
  published: boolean
}

interface Comment extends Record<string, unknown> {
  id: number
  post_id: number
  user_id: number
  text: string
}

const users = db.createTable<User>(
  "users",
  {
    email: column.text({ notNull: true }),
    id: column.id(),
    name: column.text({ notNull: true }),
  },
  { ifNotExists: true }
)

const posts = db.createTable<Post>(
  "posts",
  {
    content: column.text({ notNull: false }),
    id: column.id(),
    published: column.boolean({ default: false }),
    title: column.text({ notNull: true }),
    user_id: column.integer({ notNull: true }),
  },
  { ifNotExists: true }
)

const comments = db.createTable<Comment>(
  "comments",
  {
    id: column.id(),
    post_id: column.integer({ notNull: true }),
    text: column.text({ notNull: true }),
    user_id: column.integer({ notNull: true }),
  },
  { ifNotExists: true }
)

beforeAll(() => {
  // Insert test data
  users.insertBatch([
    { email: "alice@example.com", name: "Alice" },
    { email: "bob@example.com", name: "Bob" },
  ])

  posts.insertBatch([
    { published: true, title: "Alice's post", user_id: 1 },
    { published: false, title: "Bob's draft", user_id: 2 },
  ])

  comments.insertBatch([
    { post_id: 1, text: "Great post!", user_id: 2 },
    { post_id: 1, text: "Thanks!", user_id: 1 },
  ])
})

afterAll(() => {
  db.close()
})

describe("Type-safe JOIN with IntelliSense", () => {
  test("join<User>(...) should have IntelliSense for User columns", () => {
    // This query has type QueryBuilder<User>
    const query = users

    // Valid User columns should work
    const results = query.where({ name: "Alice" }).all()
    expect(results.length).toBe(1)
  })

  test("join<Post>(...) should merge result types", () => {
    // After joining with Post, result type is QueryBuilder<User, User & Post>
    const joinedQuery = users.join<Post>("posts", { id: "user_id" })

    // This demonstrates that the result type is User & Post
    // IntelliSense should show columns from BOTH tables: id, name, email, user_id, title, content, published

    const results = joinedQuery.all()

    // Each result should have properties from both User and Post
    const first = results[0]

    // User columns
    expect(first).toHaveProperty("id") // From User
    expect(first).toHaveProperty("name") // From User
    expect(first).toHaveProperty("email") // From User

    // Post columns
    expect(first).toHaveProperty("user_id") // From Post
    expect(first).toHaveProperty("title") // From Post
    expect(first).toHaveProperty("published") // From Post
    expect(first).toHaveProperty("content") // From Post
  })

  // HALLO
  test("where(...) should work with merged type columns", () => {
    const results = users
      .join<Post>("posts", { id: "user_id" })
      .where({ published: true }) // Filter by Post column
      .all()

    expect(results.length).toBe(1)
    expect(results[0].published).toBe(true)
    expect(results[0].name).toBe("Alice")
  })

  test("select(...) should work with merged type columns", () => {
    // We can select specific columns from either table
    const results = users
      .join<Post>("posts", { id: "user_id" })
      .select(["name", "title"]) // Mix columns from both tables
      .all()

    expect(results[0]).toHaveProperty("name") // User column
    expect(results[0]).toHaveProperty("title") // Post column
  })

  test("orderBy(...) should work with merged type columns", () => {
    // We can order by columns from either table
    const results = users
      .join<Post>("posts", { id: "user_id" })
      .orderBy("title") // Order by Post column
      .all()

    expect(results.length).toBe(2)
  })

  test("value(...) should work with merged type columns", () => {
    // We can get a single value from any column
    const title = users.join<Post>("posts", { id: "user_id" }).value("title") // Get Post column value

    expect(typeof title).toBe("string")
  })

  test("pluck(...) should work with merged type columns", () => {
    // We can pluck values from any column
    const titles = users.join<Post>("posts", { id: "user_id" }).pluck("title") // Pluck Post column values

    expect(titles).toHaveLength(2)
    expect(titles.every((t) => typeof t === "string")).toBe(true)
  })

  test("multiple joins should merge all types", () => {
    // Join multiple tables - result type is User & Post & Comment
    const results = users
      .join<Post>("posts", { id: "user_id" })
      .join<Comment>("comments", { "posts.id": "post_id" })
      .all()

    expect(results.length).toBeGreaterThan(0)

    // Result should have columns from all three tables
    const first = results[0]

    // User columns
    expect(first).toHaveProperty("name")
    expect(first).toHaveProperty("email")

    // Post columns
    expect(first).toHaveProperty("title")
    expect(first).toHaveProperty("published")

    // Comment columns
    expect(first).toHaveProperty("text")
  })

  test("chained operations should preserve type safety", () => {
    // All operations should preserve the merged type
    const result = users
      .join<Post>("posts", { id: "user_id" })
      .where({ published: true }) // Filter by Post column
      .orderBy("name") // Order by User column
      .select(["name", "title"]) // Select from both tables
      .limit(1)
      .first()

    if (result) {
      // Result should have properties from both tables
      expect(result).toHaveProperty("name") // User
      expect(result).toHaveProperty("title") // Post
    }
  })

  test("left join should preserve type safety", () => {
    // LEFT JOIN should also preserve merged type
    const results = users.leftJoin<Post>("posts", { id: "user_id" }).all()

    expect(results.length).toBeGreaterThanOrEqual(1) // At least one user

    // Results should have columns from both tables
    const first = results[0]
    expect(first).toHaveProperty("name") // User
    expect(first).toHaveProperty("title") // Post
  })

  test("raw expression join should preserve type safety", () => {
    // Using raw expression should still preserve type safety
    const results = users.join<Post>("posts", "users.id = posts.user_id").all()

    expect(results.length).toBe(2)

    // Result should have columns from both tables
    const first = results[0]
    expect(first).toHaveProperty("name") // User
    expect(first).toHaveProperty("title") // Post
  })

  test("join with alias should preserve type safety", () => {
    // Join with alias should still preserve type safety
    const results = users.join<Post>("posts", { id: "user_id" }, "p").all()

    expect(results.length).toBe(2)

    // Result should have columns from both tables
    const first = results[0]
    expect(first).toHaveProperty("name") // User
    expect(first).toHaveProperty("title") // Post
  })

  test("chained joins should update type correctly", () => {
    // First join: QueryBuilder<User, User & Post>
    const afterPostJoin = users.join<Post>("posts", { id: "user_id" })

    // Second join: QueryBuilder<User, User & Post & Comment>
    const afterCommentJoin = afterPostJoin.join<Comment>("comments", {
      "posts.id": "post_id",
    })

    const results = afterCommentJoin.all()

    expect(results.length).toBeGreaterThan(0)

    // Result should have columns from all three tables
    const first = results[0]
    expect(first).toHaveProperty("name") // User
    expect(first).toHaveProperty("title") // Post
    expect(first).toHaveProperty("text") // Comment
  })

  test("type safety should prevent column name typos", () => {
    // Type safety ensures only valid columns can be used
    // This will be caught by TypeScript compiler at compile time
    const results = users.join<Post>("posts", { id: "user_id" }).where({ name: "Alice" }).all()
    expect(results.length).toBeGreaterThan(0)
  })
})
