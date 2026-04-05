import { afterAll, describe, expect, test } from "bun:test"
import { column, DB } from "../src/index"

const testDb = new DB(":memory:")

const testTable = testDb.createTable<{
  id: number
  createdAt: Date | null
  updatedAt: Date | null
  eventDate: Date | null
}>(
  "date_test_table",
  {
    id: column.id(),
    createdAt: column.date({ notNull: false }),
    updatedAt: column.date({ notNull: false }),
    eventDate: column.date({ notNull: false }),
  },
  {
    parser: {
      DATE: ["createdAt", "updatedAt", "eventDate"],
    },
  }
)

afterAll(() => {
  testDb.close()
})

describe("DATE parsing tests", () => {
  test("DATE parsing with current date", () => {
    const testDate = new Date()

    const insertId = testTable.insert({ createdAt: testDate }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result).toBeDefined()
    expect(result?.createdAt).toBeInstanceOf(Date)
    expect(result?.createdAt?.toISOString()).toBe(testDate.toISOString())
    expect(result?.updatedAt).toBeNull()
    expect(result?.eventDate).toBeNull()
  })

  test("DATE parsing with specific date", () => {
    const testDate = new Date("2024-01-15T10:30:00Z")

    const insertId = testTable.insert({ eventDate: testDate }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.eventDate).toBeInstanceOf(Date)
    expect(result?.eventDate?.toISOString()).toBe(testDate.toISOString())
  })

  test("DATE parsing with null value", () => {
    const insertId = testTable.insert({ createdAt: null }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.createdAt).toBeNull()
    expect(result?.updatedAt).toBeNull()
    expect(result?.eventDate).toBeNull()
  })

  test("DATE parsing with multiple date columns", () => {
    const created = new Date("2024-01-01T00:00:00Z")
    const updated = new Date("2024-01-15T12:00:00Z")
    const event = new Date("2024-02-01T18:30:00Z")

    const insertId = testTable.insert({
      createdAt: created,
      updatedAt: updated,
      eventDate: event,
    }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.createdAt).toBeInstanceOf(Date)
    expect(result?.updatedAt).toBeInstanceOf(Date)
    expect(result?.eventDate).toBeInstanceOf(Date)
    expect(result?.createdAt?.toISOString()).toBe(created.toISOString())
    expect(result?.updatedAt?.toISOString()).toBe(updated.toISOString())
    expect(result?.eventDate?.toISOString()).toBe(event.toISOString())
  })

  test("DATE parsing preserves timezone information", () => {
    const testDate = new Date("2024-06-15T14:30:00.000Z")

    const insertId = testTable.insert({ createdAt: testDate }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.createdAt?.getTime()).toBe(testDate.getTime())
    expect(result?.createdAt?.toISOString()).toBe("2024-06-15T14:30:00.000Z")
  })

  test("DATE parsing with midnight date", () => {
    const testDate = new Date("2024-01-01T00:00:00.000Z")

    const insertId = testTable.insert({ eventDate: testDate }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.eventDate).toBeInstanceOf(Date)
    expect(result?.eventDate?.toISOString()).toBe(testDate.toISOString())
  })

  test("DATE parsing with end of day", () => {
    const testDate = new Date("2024-12-31T23:59:59.999Z")

    const insertId = testTable.insert({ eventDate: testDate }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.eventDate).toBeInstanceOf(Date)
    expect(result?.eventDate?.getTime()).toBe(testDate.getTime())
  })
})

describe("DATE update tests", () => {
  test("Update DATE column preserves Date parsing", () => {
    const initialDate = new Date("2024-01-01T00:00:00Z")
    const updatedDate = new Date("2024-12-31T23:59:59Z")

    const insertId = testTable.insert({ createdAt: initialDate }).insertId

    testTable.where({ id: insertId }).update({ createdAt: updatedDate })

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.createdAt).toBeInstanceOf(Date)
    expect(result?.createdAt?.toISOString()).toBe(updatedDate.toISOString())
  })

  test("Update multiple DATE columns", () => {
    const created = new Date("2024-01-01T00:00:00Z")
    const updated = new Date("2024-06-15T12:00:00Z")

    const insertId = testTable.insert({ createdAt: created }).insertId

    testTable.where({ id: insertId }).update({
      updatedAt: updated,
      eventDate: updated,
    })

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.createdAt?.toISOString()).toBe(created.toISOString())
    expect(result?.updatedAt?.toISOString()).toBe(updated.toISOString())
    expect(result?.eventDate?.toISOString()).toBe(updated.toISOString())
  })

  test("Update DATE column to null", () => {
    const initialDate = new Date("2024-01-01T00:00:00Z")

    const insertId = testTable.insert({ createdAt: initialDate }).insertId

    testTable.where({ id: insertId }).update({ createdAt: null })

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.createdAt).toBeNull()
  })
})

describe("DATE bulk operations", () => {
  test("Bulk insert with DATE columns", () => {
    const date1 = new Date("2024-01-01T00:00:00Z")
    const date2 = new Date("2024-02-01T00:00:00Z")
    const date3 = new Date("2024-03-01T00:00:00Z")

    testTable.insertBatch([
      { createdAt: date1, eventDate: date1 },
      { createdAt: date2, eventDate: date2 },
      { createdAt: date3, eventDate: date3 },
    ])

    const results = testTable.select(["*"]).orderBy("id").desc().limit(3).all()

    expect(results).toHaveLength(3)
    expect(results[2]?.createdAt).toBeInstanceOf(Date)
    expect(results[1]?.createdAt).toBeInstanceOf(Date)
    expect(results[0]?.createdAt).toBeInstanceOf(Date)
    expect(results[2]?.createdAt?.toISOString()).toBe(date1.toISOString())
    expect(results[1]?.createdAt?.toISOString()).toBe(date2.toISOString())
    expect(results[0]?.createdAt?.toISOString()).toBe(date3.toISOString())
  })

  test("Query with DATE comparisons", () => {
    const baseDate = new Date("2024-01-15T12:00:00Z")
    const olderDate = new Date("2024-01-10T12:00:00Z")
    const newerDate = new Date("2024-01-20T12:00:00Z")

    testTable.insertBatch([
      { eventDate: olderDate },
      { eventDate: baseDate },
      { eventDate: newerDate },
    ])

    const results = testTable.select(["*"]).orderBy("id").desc().limit(3).all()

    expect(results).toHaveLength(3)
    results.forEach((result) => {
      expect(result.eventDate).toBeInstanceOf(Date)
    })
  })
})

describe("DATE edge cases", () => {
  test("DATE parsing with leap year date", () => {
    const leapYearDate = new Date("2024-02-29T12:00:00Z")

    const insertId = testTable.insert({ eventDate: leapYearDate }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.eventDate).toBeInstanceOf(Date)
    expect(result?.eventDate?.toISOString()).toBe(leapYearDate.toISOString())
  })

  test("DATE parsing with daylight saving time date", () => {
    const dstDate = new Date("2024-03-10T07:00:00Z") // DST transition in some regions

    const insertId = testTable.insert({ eventDate: dstDate }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.eventDate).toBeInstanceOf(Date)
    expect(result?.eventDate?.getTime()).toBe(dstDate.getTime())
  })

  test("DATE parsing with milliseconds precision", () => {
    const preciseDate = new Date("2024-06-15T14:30:45.123Z")

    const insertId = testTable.insert({ eventDate: preciseDate }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.eventDate).toBeInstanceOf(Date)
    expect(result?.eventDate?.getTime()).toBe(preciseDate.getTime())
  })

  test("DATE parsing with very old date", () => {
    const oldDate = new Date("1970-01-01T00:00:00Z")

    const insertId = testTable.insert({ eventDate: oldDate }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.eventDate).toBeInstanceOf(Date)
    expect(result?.eventDate?.toISOString()).toBe(oldDate.toISOString())
  })

  test("DATE parsing with future date", () => {
    const futureDate = new Date("2099-12-31T23:59:59Z")

    const insertId = testTable.insert({ eventDate: futureDate }).insertId

    const result = testTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.eventDate).toBeInstanceOf(Date)
    expect(result?.eventDate?.toISOString()).toBe(futureDate.toISOString())
  })
})

describe("DATE automatic parser detection", () => {
  test("Automatically detect DATE columns without explicit parser config", () => {
    const autoTable = testDb.createTable<{
      id: number
      createdAt: Date | null
      updatedAt: Date | null
    }>(
      "auto_date_table",
      {
        id: column.id(),
        createdAt: column.date({ notNull: false }),
        updatedAt: column.date({ notNull: false }),
      }
      // No parser config provided - should auto-detect
    )

    const testDate = new Date("2024-01-15T10:30:00Z")
    const insertId = autoTable.insert({ createdAt: testDate }).insertId

    const result = autoTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.createdAt).toBeInstanceOf(Date)
    expect(result?.createdAt?.toISOString()).toBe(testDate.toISOString())
  })

  test("Merge auto-detected DATE columns with explicit parser config", () => {
    const mixedTable = testDb.createTable<{
      id: number
      createdAt: Date | null
      customDate: Date | null
    }>(
      "mixed_date_table",
      {
        id: column.id(),
        createdAt: column.date({ notNull: false }), // Auto-detected
        customDate: column.text({ notNull: false }), // Explicitly added to parser
      },
      {
        parser: {
          DATE: ["customDate"], // Explicit config
        },
      }
    )

    const testDate = new Date("2024-06-15T14:30:00Z")
    const insertId = mixedTable.insert({
      createdAt: testDate,
      customDate: testDate,
    }).insertId

    const result = mixedTable.select(["*"]).where({ id: insertId }).first()

    // Both should be parsed as Date objects
    expect(result?.createdAt).toBeInstanceOf(Date)
    expect(result?.customDate).toBeInstanceOf(Date)
    expect(result?.createdAt?.toISOString()).toBe(testDate.toISOString())
    expect(result?.customDate?.toISOString()).toBe(testDate.toISOString())
  })

  test("Auto-detect DATETIME columns", () => {
    const datetimeTable = testDb.createTable<{
      id: number
      timestamp: Date | null
    }>("datetime_table", {
      id: column.id(),
      timestamp: column.datetime({ notNull: false }),
    })

    const testDate = new Date("2024-03-20T18:45:30Z")
    const insertId = datetimeTable.insert({ timestamp: testDate }).insertId

    const result = datetimeTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.timestamp).toBeInstanceOf(Date)
    expect(result?.timestamp?.toISOString()).toBe(testDate.toISOString())
  })

  test("Auto-detect TIMESTAMP columns", () => {
    const timestampTable = testDb.createTable<{
      id: number
      eventTime: Date | null
    }>(
      "timestamp_table",
      {
        id: column.id(),
        eventTime: column.timestamp({ notNull: false, asText: true }),
      },
      {
        parser: {
          DATE: ["eventTime"], // Explicit config needed when asText: true changes type to TEXT
        },
      }
    )

    const testDate = new Date("2024-12-01T09:15:00Z")
    const insertId = timestampTable.insert({ eventTime: testDate }).insertId

    const result = timestampTable.select(["*"]).where({ id: insertId }).first()

    expect(result?.eventTime).toBeInstanceOf(Date)
    expect(result?.eventTime?.toISOString()).toBe(testDate.toISOString())
  })
})
