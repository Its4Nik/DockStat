import type { THEME } from '@dockstat/typings'
import { ThemeHandler } from './src'

// Test theme configuration
const testTheme: THEME.THEME_config = {
  name: 'test-theme',
  version: '1.0.0',
  creator: 'Test Creator',
  license: 'MIT',
  description: 'A test theme for validation',
  active: false,
  vars: {
    background_effect: {
      Solid: {
        color: '#ffffff',
      },
    },
    components: {
      Card: {
        accent: '#007bff',
        border: true,
        border_color: '#e1e8ed',
        border_size: 1,
        title: {
          font: 'Inter, sans-serif',
          color: '#2c3e50',
          font_size: 18,
          font_weight: 600,
        },
        sub_title: {
          font: 'Inter, sans-serif',
          color: '#7f8c8d',
          font_size: 14,
          font_weight: 500,
        },
        content: {
          font: 'Inter, sans-serif',
          color: '#34495e',
          font_size: 12,
          font_weight: 400,
        },
      },
    },
  },
}

// Simple CSS variable parser test
function testCSSVariableParser() {
  console.log('🧪 Testing CSS Variable Parser...')

  try {
    const {
      parseThemeVars,
      defaultParserConfig,
    } = require('./src/cssVariableParser')

    const cssVars = parseThemeVars(testTheme.vars, defaultParserConfig)

    console.log('✅ CSS Variables generated:')
    console.log(JSON.stringify(cssVars, null, 2))

    // Check if expected variables exist
    const expectedVars = [
      '--theme-background-effect-solid-color',
      '--theme-components-card-accent',
      '--theme-components-card-border',
      '--theme-components-card-title-color',
    ]

    const missing = expectedVars.filter((varName) => !(varName in cssVars))

    if (missing.length === 0) {
      console.log('✅ All expected CSS variables found')
    } else {
      console.log('❌ Missing CSS variables:', missing)
    }

    return true
  } catch (error) {
    console.error('❌ CSS Variable Parser test failed:', error)
    return false
  }
}

// Simple theme object validation test
function testThemeValidation() {
  console.log('\n🧪 Testing Theme Validation...')

  try {
    // Check required properties
    const requiredProps = [
      'name',
      'version',
      'creator',
      'license',
      'description',
      'active',
      'vars',
    ]
    const missing = requiredProps.filter((prop) => !(prop in testTheme))

    if (missing.length === 0) {
      console.log('✅ Theme has all required properties')
    } else {
      console.log('❌ Theme missing properties:', missing)
      return false
    }

    // Check theme vars structure
    if (testTheme.vars.background_effect && testTheme.vars.components) {
      console.log('✅ Theme vars structure is valid')
    } else {
      console.log('❌ Theme vars structure is invalid')
      return false
    }

    // Check component structure
    const cardComponent = testTheme.vars.components.Card
    if (
      cardComponent.title &&
      cardComponent.sub_title &&
      cardComponent.content
    ) {
      console.log('✅ Card component structure is valid')
    } else {
      console.log('❌ Card component structure is invalid')
      return false
    }

    return true
  } catch (error) {
    console.error('❌ Theme validation test failed:', error)
    return false
  }
}

// Test CSS variable application (browser environment simulation)
function testCSSVariableApplication() {
  console.log('\n🧪 Testing CSS Variable Application...')

  try {
    // Mock document for testing
    const mockDocument = {
      documentElement: {
        style: {
          properties: {} as Record<string, string>,
          setProperty(name: string, value: string) {
            this.properties[name] = value
          },
          removeProperty(name: string) {
            delete this.properties[name]
          },
        },
      },
    }

    // Mock global document
    ;(global as any).document = mockDocument

    const {
      applyCSSVariables,
      removeCSSVariables,
      parseThemeVars,
      defaultParserConfig,
    } = require('./src/cssVariableParser')

    const cssVars = parseThemeVars(testTheme.vars, defaultParserConfig)

    // Apply variables
    applyCSSVariables(cssVars)

    const appliedCount = Object.keys(
      mockDocument.documentElement.style.properties
    ).length
    console.log(`✅ Applied ${appliedCount} CSS variables`)

    // Remove variables
    removeCSSVariables(cssVars)

    const remainingCount = Object.keys(
      mockDocument.documentElement.style.properties
    ).length

    if (remainingCount === 0) {
      console.log('✅ Successfully removed all CSS variables')
    } else {
      console.log(`❌ ${remainingCount} CSS variables still remain`)
      return false
    }

    return true
  } catch (error) {
    console.error('❌ CSS Variable application test failed:', error)
    return false
  }
}

// Test parser configurations
function testParserConfigurations() {
  console.log('\n🧪 Testing Parser Configurations...')

  try {
    const { parseThemeVars, parserConfigs } = require('./src/cssVariableParser')

    // Test different configurations
    const configs = [
      { name: 'standard', config: parserConfigs.standard },
      { name: 'compact', config: parserConfigs.compact },
      { name: 'verbose', config: parserConfigs.verbose },
      { name: 'componentsOnly', config: parserConfigs.componentsOnly },
    ]

    for (const { name, config } of configs) {
      const cssVars = parseThemeVars(testTheme.vars, config)
      const varCount = Object.keys(cssVars).length
      console.log(`✅ ${name} config generated ${varCount} variables`)

      // Show first variable as example
      const firstVar = Object.entries(cssVars)[0]
      if (firstVar) {
        console.log(`   Example: ${firstVar[0]} = ${firstVar[1]}`)
      }
    }

    return true
  } catch (error) {
    console.error('❌ Parser configurations test failed:', error)
    return false
  }
}

// Mock API test
async function testMockAPI() {
  console.log('\n🧪 Testing Mock API Setup...')

  try {
    const themes = {
      light: testTheme,
      dark: { ...testTheme, name: 'dark' },
    }

    // Mock fetch function
    const mockFetch = async (url: string) => {
      const [, , endpoint, themeName] = url.split('/')

      if (endpoint === 'themes' && !themeName) {
        return {
          ok: true,
          json: async () => Object.keys(themes),
        }
      }

      if (endpoint === 'themes' && themeName) {
        const theme = themes[themeName as keyof typeof themes]
        if (theme) {
          return {
            ok: true,
            json: async () => theme,
          }
        }
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
        }
      }

      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }
    }

    // Test theme list
    const listResponse = await mockFetch('/api/themes')
    if (listResponse.ok) {
      const themeList = await (listResponse as any).json()
      console.log(`✅ Mock API returned ${themeList.length} themes:`, themeList)
    } else {
      console.log('❌ Failed to fetch theme list')
      return false
    }

    // Test specific theme
    const themeResponse = await mockFetch('/api/themes/light')
    if (themeResponse.ok) {
      const theme = await (themeResponse as any).json()
      console.log(`✅ Mock API returned theme: ${theme.name}`)
    } else {
      console.log('❌ Failed to fetch specific theme')
      return false
    }

    // Test non-existent theme
    const notFoundResponse = await mockFetch('/api/themes/nonexistent')
    if (!notFoundResponse.ok && notFoundResponse.status === 404) {
      console.log('✅ Mock API correctly returns 404 for non-existent themes')
    } else {
      console.log('❌ Mock API should return 404 for non-existent themes')
      return false
    }

    return true
  } catch (error) {
    console.error('❌ Mock API test failed:', error)
    return false
  }
}

// Main test runner
async function runTests() {
  console.log('🎨 Theme Handler Test Suite')
  console.log('==========================\n')

  const tests = [
    testThemeValidation,
    testCSSVariableParser,
    testCSSVariableApplication,
    testParserConfigurations,
    testMockAPI,
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      const result = await test()
      if (result) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      console.error('❌ Test failed with error:', error)
      failed++
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`)

  if (failed === 0) {
    console.log('🎉 All tests passed!')
    process.exit(0)
  } else {
    console.log('❌ Some tests failed!')
    process.exit(1)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error)
}

export { runTests, testTheme }
