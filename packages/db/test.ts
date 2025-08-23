import { exists, rm } from 'node:fs/promises'
import type { THEME } from '@dockstat/typings'
import { darkDockStatTheme } from './default_theme'
import DockStatDB from './index'

interface TestResult {
  section: string
  name: string
  success: boolean
  error?: string
}

// Clean up any existing database
async function cleanupDatabase() {
  if (await exists('dockstat.sqlite')) {
    await rm('dockstat.sqlite')
  }
}

await cleanupDatabase()

class TestRunner {
  private results: TestResult[] = []
  private currentSection = ''

  addError(section: string, name: string, error: string) {
    this.results.push({ section, name, success: false, error })
    console.log(`❌ ${section} - ${name}: ${error}`)
  }

  section(name: string) {
    this.currentSection = name
    console.log(`\n📁 ${name}`)
  }

  async test(name: string, fn: () => void | Promise<void>) {
    try {
      // Clean up database before each test
      await cleanupDatabase()

      const result = fn()
      if (result instanceof Promise) {
        await result
      }
      this.results.push({
        section: this.currentSection,
        name,
        success: true,
      })
      console.log(`✅ ${name}`)
    } catch (error) {
      this.addError(
        this.currentSection,
        name,
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  expectError(name: string, fn: () => void) {
    try {
      fn()
      this.addError(this.currentSection, name, 'Expected error but none thrown')
    } catch (_) {
      this.results.push({
        section: this.currentSection,
        name,
        success: true,
      })
      console.log(`✅ ${name}`)
    }
  }

  assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(message)
    }
  }

  assertEqual<T>(actual: T, expected: T, message?: string) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`)
    }
  }

  assertArrayLength<T>(array: T[], expectedLength: number, message?: string) {
    if (array.length !== expectedLength) {
      throw new Error(
        message ||
          `Expected array length ${expectedLength}, got ${array.length}`
      )
    }
  }

  assertObjectEqual<T>(actual: T, expected: T, message?: string) {
    const actualStr = JSON.stringify(actual)
    const expectedStr = JSON.stringify(expected)
    if (actualStr !== expectedStr) {
      throw new Error(message || `Expected ${expectedStr}, got ${actualStr}`)
    }
  }

  printSummary() {
    const totalTests = this.results.length
    const passedTests = this.results.filter((r) => r.success).length
    const failedTests = totalTests - passedTests

    console.log(`\n${'='.repeat(60)}`)
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total Tests: ${totalTests}`)
    console.log(`✅ Passed: ${passedTests}`)
    console.log(`❌ Failed: ${failedTests}`)
    console.log(
      `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
    )

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:')
      for (const r of this.results) {
        if (!r.success) {
          console.log(`  ${r.section} - ${r.name}: ${r.error}`)
        }
      }
    }

    console.log('='.repeat(60))
  }
}

async function runComprehensiveTests() {
  const test = new TestRunner()

  console.log('🧪 Starting DockStatDB Comprehensive Tests')
  console.log('='.repeat(60))

  // Sample test data
  const customTheme: THEME.THEME_config = {
    name: 'custom-theme',
    version: '2.0.0',
    creator: 'TestCreator',
    license: 'GPL-3.0',
    vars: {
      background_effect: {
        Gradient: {
          from: '#ff0000',
          to: '#0000ff',
          direction: 'l-t',
        },
      },
      components: {
        Card: {
          accent: '#00ff00',
          border: false,
          border_size: 2,
          border_color: '#ff00ff',
          title: {
            font: 'Helvetica',
            color: '#000000',
            font_size: 14,
            font_weight: 700,
          },
          sub_title: {
            font: 'Helvetica',
            color: '#333333',
            font_size: 12,
            font_weight: 500,
          },
          content: {
            font: 'Helvetica',
            color: '#666666',
            font_size: 10,
            font_weight: 300,
          },
        },
      },
    },
  }

  // DATABASE INITIALIZATION
  test.section('DATABASE INITIALIZATION')

  await test.test('Create DockStatDB instance', () => {
    const db = new DockStatDB()
    test.assert(db instanceof DockStatDB, 'Should create DockStatDB instance')
    db.close()
  })

  await test.test('Initialize with default theme', () => {
    const db = new DockStatDB()
    const currentTheme = db.getCurrentTheme()
    test.assertEqual(
      currentTheme.name,
      'default',
      "Default theme name should be 'default'"
    )

    const themeName = db.getCurrentThemeName()
    test.assertEqual(
      themeName,
      'default',
      "Current theme name should be 'default'"
    )
    db.close()
  })

  await test.test('Expose underlying DB instance', () => {
    const db = new DockStatDB()
    const rawDB = db.getDB()
    test.assert(rawDB !== null, 'Should expose underlying DB instance')
    test.assert(
      typeof rawDB.table === 'function',
      'Should be a valid DB instance'
    )
    db.close()
  })

  // THEME OPERATIONS
  test.section('THEME OPERATIONS')

  await test.test('Add custom theme', () => {
    const db = new DockStatDB()
    const result = db.addOrUpdateTheme(customTheme)
    test.assert(
      result !== null && result !== undefined,
      'Should successfully add theme'
    )
    db.close()
  })

  await test.test('Get theme by name', () => {
    const db = new DockStatDB()
    db.addOrUpdateTheme(customTheme)
    const retrievedTheme = db.getTheme('custom-theme')

    test.assert(
      retrievedTheme !== null && retrievedTheme !== undefined,
      'Should retrieve theme'
    )
    if (retrievedTheme) {
      test.assertEqual(
        retrievedTheme.name,
        'custom-theme',
        'Theme name should match'
      )
      test.assertEqual(
        retrievedTheme.version,
        '2.0.0',
        'Theme version should match'
      )
      test.assertEqual(
        retrievedTheme.creator,
        'TestCreator',
        'Theme creator should match'
      )
    }
    db.close()
  })

  await test.test('Get non-existent theme', () => {
    const db = new DockStatDB()
    const retrievedTheme = db.getTheme('non-existent-theme')
    test.assertEqual(
      retrievedTheme,
      null,
      'Should return null for non-existent theme'
    )
    db.close()
  })

  await test.test('Get all themes', () => {
    const db = new DockStatDB()
    db.addOrUpdateTheme(customTheme)

    const secondTheme: THEME.THEME_config = {
      ...customTheme,
      name: 'second-theme',
      version: '1.5.0',
    }
    db.addOrUpdateTheme(secondTheme)

    const themes = db.getThemes()
    test.assert(Array.isArray(themes), 'Should return array of themes')
    test.assert(themes.length >= 2, 'Should have at least 2 themes')

    const themeNames = themes.map((t) => t.name)
    test.assert(
      themeNames.includes('custom-theme'),
      'Should include custom-theme'
    )
    test.assert(
      themeNames.includes('second-theme'),
      'Should include second-theme'
    )
    test.assert(themeNames.includes('default'), 'Should include default theme')

    db.close()
  })

  await test.test('Set current theme', () => {
    const db = new DockStatDB()
    db.addOrUpdateTheme(customTheme)

    const result = db.setTheme('custom-theme')
    test.assert(
      result !== null && result !== undefined,
      'Should successfully set theme'
    )

    const currentTheme = db.getCurrentTheme()
    test.assertEqual(
      currentTheme.name,
      'custom-theme',
      'Current theme should be updated'
    )

    const currentThemeName = db.getCurrentThemeName()
    test.assertEqual(
      currentThemeName,
      'custom-theme',
      'Current theme name should be updated'
    )

    db.close()
  })

  await test.test('Set non-existent theme', () => {
    const db = new DockStatDB()
    const currentThemeBefore = db.getCurrentTheme()

    const result = db.setTheme('non-existent-theme')
    test.assertEqual(result, null, 'Should return null for non-existent theme')

    const currentThemeAfter = db.getCurrentTheme()
    test.assertEqual(
      currentThemeAfter.name,
      currentThemeBefore.name,
      'Current theme should remain unchanged when setting non-existent theme'
    )

    db.close()
  })

  await test.test('Update existing theme (OR REPLACE)', () => {
    const db = new DockStatDB()
    db.addOrUpdateTheme(customTheme)

    const updatedTheme: THEME.THEME_config = {
      ...customTheme,
      version: '3.0.0',
      creator: 'UpdatedCreator',
    }

    db.addOrUpdateTheme(updatedTheme)
    const retrievedTheme = db.getTheme('custom-theme')

    test.assert(
      retrievedTheme !== null && retrievedTheme !== undefined,
      'Should retrieve updated theme'
    )
    if (retrievedTheme) {
      test.assertEqual(
        retrievedTheme.version,
        '3.0.0',
        'Theme version should be updated'
      )
      test.assertEqual(
        retrievedTheme.creator,
        'UpdatedCreator',
        'Theme creator should be updated'
      )
    }

    db.close()
  })

  // INTEGRATION SCENARIOS
  test.section('INTEGRATION SCENARIOS')

  await test.test('Docker client integration pattern', () => {
    const db = new DockStatDB()

    // 1. DockStatDB manages themes
    db.addOrUpdateTheme(customTheme)
    const setResult = db.setTheme('custom-theme')
    test.assert(setResult !== null, 'setTheme should succeed')

    const currentTheme = db.getCurrentTheme()
    test.assertEqual(
      currentTheme.name,
      'custom-theme',
      'getCurrentTheme should return custom-theme'
    )

    // 2. Get raw DB for docker client integration
    const rawDB = db.getDB()
    test.assert(rawDB !== null, 'Should provide raw DB for docker client')
    test.assert(
      typeof rawDB.table === 'function',
      'Raw DB should have table method'
    )

    // 3. Docker client can use the same database for its operations
    // (This would be done by docker-client package, we're just verifying access)
    test.assert(
      typeof rawDB.createTable === 'function',
      'Raw DB should allow table creation'
    )

    db.close()
  })

  await test.test('Persistent theme configuration', () => {
    // First instance
    let db = new DockStatDB()
    db.addOrUpdateTheme(customTheme)
    db.setTheme('custom-theme')
    db.close()

    // Second instance - should load existing data
    db = new DockStatDB()

    const currentTheme = db.getCurrentTheme()
    test.assertEqual(
      currentTheme.name,
      'custom-theme',
      'Theme should persist across instances'
    )

    const currentThemeName = db.getCurrentThemeName()
    test.assertEqual(
      currentThemeName,
      'custom-theme',
      'Theme name should persist across instances'
    )

    const themes = db.getThemes()
    const customThemeExists = themes.some((t) => t.name === 'custom-theme')
    test.assert(customThemeExists, 'Custom theme should persist in database')

    db.close()
  })

  await test.test('Theme data serialization integrity', () => {
    const db = new DockStatDB()

    // Add theme with complex nested structure
    const complexTheme: THEME.THEME_config = {
      name: 'complex-theme',
      version: '1.0.0',
      creator: 'TestCreator',
      license: 'MIT',
      vars: {
        background_effect: {
          Aurora: {
            colorList: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'],
          },
        },
        components: {
          Card: {
            accent: '#ffffff',
            border: true,
            border_size: 3,
            border_color: '#cccccc',
            title: {
              font: 'Roboto',
              color: '#333333',
              font_size: 16,
              font_weight: 600,
            },
            sub_title: {
              font: 'Roboto',
              color: '#666666',
              font_size: 14,
              font_weight: 400,
            },
            content: {
              font: 'Roboto',
              color: '#999999',
              font_size: 12,
              font_weight: 300,
            },
          },
        },
      },
    }

    db.addOrUpdateTheme(complexTheme)
    const retrieved = db.getTheme('complex-theme')

    test.assert(retrieved !== null, 'Should retrieve complex theme')
    if (retrieved) {
      // Verify complex nested structures are preserved
      test.assert(
        'Aurora' in retrieved.vars.background_effect,
        'Should preserve Aurora effect'
      )
      test.assertArrayLength(
        (
          retrieved.vars.background_effect as {
            Aurora: { colorList: string[] }
          }
        ).Aurora.colorList,
        4,
        'Should preserve color array length'
      )
      test.assertEqual(
        (
          retrieved.vars.background_effect as {
            Aurora: { colorList: string[] }
          }
        ).Aurora.colorList[0],
        '#ff0000',
        'Should preserve first color'
      )
      test.assertEqual(
        retrieved.vars.components.Card.title.font_weight,
        600,
        'Should preserve font weight'
      )
    }

    db.close()
  })

  await test.test('Database utility methods', () => {
    const db = new DockStatDB()

    // Test database path
    const dbPath = db.getDatabasePath()
    test.assertEqual(
      dbPath,
      'dockstat.sqlite',
      'Should return correct database path'
    )

    // Test schema access
    const schema = db.getSchema()
    test.assert(schema !== null, 'Should return database schema')

    db.close()
  })

  test.printSummary()

  // Final cleanup
  await cleanupDatabase()
}

// Run tests if this file is executed directly
if (import.meta.main) {
  runComprehensiveTests().catch(console.error)
}

export { runComprehensiveTests, TestRunner }
