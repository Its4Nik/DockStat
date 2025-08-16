import DockStatDB from "./index";
import { rm, exists } from "node:fs/promises";
import type { DATABASE, THEME } from "@dockstat/typings";
import { darkDockStatTheme } from "./default_theme";

interface TestResult {
  section: string;
  name: string;
  success: boolean;
  error?: string;
}
if (await exists("dockstat.sqlite")) await rm("dockstat.sqlite");

class TestRunner {
  private results: TestResult[] = [];
  private currentSection = "";

  addError(section: string, name: string, error: string) {
    this.results.push({ section, name, success: false, error });
    console.log(`❌ ${section} - ${name}: ${error}`);
  }

  section(name: string) {
    this.currentSection = name;
    console.log(`\n📁 ${name}`);
  }

  test(name: string, fn: () => void | Promise<void>) {
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result
          .then(() => {
            this.results.push({
              section: this.currentSection,
              name,
              success: true,
            });
            console.log(`✅ ${name}`);
          })
          .catch((error) => {
            this.addError(this.currentSection, name, error.message);
          });
      }
      this.results.push({
        section: this.currentSection,
        name,
        success: true,
      });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.addError(
        this.currentSection,
        name,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  expectError(name: string, fn: () => void) {
    try {
      fn();
      this.addError(
        this.currentSection,
        name,
        "Expected error but none thrown",
      );
    } catch (_) {
      this.results.push({
        section: this.currentSection,
        name,
        success: true,
      });
      console.log(`✅ ${name}`);
    }
  }

  assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual<T>(actual: T, expected: T, message?: string) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertArrayLength<T>(array: T[], expectedLength: number, message?: string) {
    if (array.length !== expectedLength) {
      throw new Error(
        message ||
          `Expected array length ${expectedLength}, got ${array.length}`,
      );
    }
  }

  assertObjectEqual<T>(actual: T, expected: T, message?: string) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(message || `Expected ${expectedStr}, got ${actualStr}`);
    }
  }

  printSummary() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter((r) => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`\n${"=".repeat(60)}`);
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(
      `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`,
    );

    if (failedTests > 0) {
      console.log("\n❌ FAILED TESTS:");
      this.results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  ${r.section} - ${r.name}: ${r.error}`);
        });
    }

    console.log("=".repeat(60));
  }
}

async function runComprehensiveTests() {
  const test = new TestRunner();

  console.log("🧪 Starting DockStatDB Comprehensive Tests");
  console.log("=".repeat(60));

  // Sample test data
  const sampleHostConfig: DATABASE.DB_target_host = {
    host: "192.168.1.100",
    secure: true,
    name: "test-host",
    id: 1,
  };

  const sampleConfig: DATABASE.DB_config = {
    fetch_interval: 10,
    target_hosts: [sampleHostConfig],
    theme_config: darkDockStatTheme,
  };

  const customTheme: THEME.THEME_config = {
    name: "custom-theme",
    version: "2.0.0",
    creator: "TestCreator",
    license: "GPL-3.0",
    vars: {
      background_effect: {
        Gradient: {
          from: "#ff0000",
          to: "#0000ff",
          direction: "l-t",
        },
      },
      components: {
        Card: {
          accent: "#00ff00",
          border: false,
          border_size: 2,
          border_color: "#ff00ff",
          title: {
            font: "Helvetica",
            color: "#000000",
            font_size: 14,
            font_weight: 700,
          },
          sub_title: {
            font: "Helvetica",
            color: "#333333",
            font_size: 12,
            font_weight: 500,
          },
          content: {
            font: "Helvetica",
            color: "#666666",
            font_size: 10,
            font_weight: 300,
          },
        },
      },
    },
  };

  // DATABASE INITIALIZATION
  test.section("DATABASE INITIALIZATION");

  test.test("Create DockStatDB instance", () => {
    const db = new DockStatDB();
    test.assert(db instanceof DockStatDB, "Should create DockStatDB instance");
  });

  test.test("Initialize with default config", () => {
    const db = new DockStatDB();
    const config = db.getConfig();
    test.assertEqual(
      config.fetch_interval,
      5,
      "Default fetch interval should be 5",
    );
    test.assertArrayLength(
      config.target_hosts,
      0,
      "Default target hosts should be empty",
    );
    test.assertEqual(
      config.theme_config.name,
      "default",
      "Default theme name should be 'default'",
    );
  });

  // CONFIG OPERATIONS
  test.section("CONFIG OPERATIONS");

  test.test("Set and get config", () => {
    const db = new DockStatDB();
    db.setConfig(sampleConfig);
    const retrievedConfig = db.getConfig();

    test.assertEqual(
      retrievedConfig.fetch_interval,
      10,
      "Fetch interval should be updated",
    );
    test.assertArrayLength(
      retrievedConfig.target_hosts,
      1,
      "Should have one target host",
    );
    test.assertEqual(
      retrievedConfig.target_hosts[0].host,
      "192.168.1.100",
      "Host should match",
    );
    test.assertEqual(
      retrievedConfig.target_hosts[0].name,
      "test-host",
      "Host name should match",
    );
  });

  test.test("Update config with multiple hosts", () => {
    const db = new DockStatDB();
    const multiHostConfig: DATABASE.DB_config = {
      ...sampleConfig,
      target_hosts: [
        sampleHostConfig,
        {
          host: "192.168.1.101",
          secure: false,
          name: "test-host-2",
          id: 2,
        },
      ],
    };

    db.setConfig(multiHostConfig);
    const config = db.getConfig();
    test.assertArrayLength(
      config.target_hosts,
      2,
      "Should have two target hosts",
    );
    test.assertEqual(
      config.target_hosts[1].host,
      "192.168.1.101",
      "Second host should match",
    );
  });

  test.test("Update fetch interval", () => {
    const db = new DockStatDB();
    const updatedConfig: DATABASE.DB_config = {
      ...sampleConfig,
      fetch_interval: 30,
    };

    db.setConfig(updatedConfig);
    const config = db.getConfig();
    test.assertEqual(
      config.fetch_interval,
      30,
      "Fetch interval should be updated to 30",
    );
  });

  // THEME OPERATIONS
  test.section("THEME OPERATIONS");

  test.test("Add custom theme", () => {
    const db = new DockStatDB();
    const result = db.addOrUpdateTheme(customTheme);
    test.assert(
      result !== null && result !== undefined,
      "Should successfully add theme",
    );
  });

  test.test("Get theme by name", () => {
    const db = new DockStatDB();
    db.addOrUpdateTheme(customTheme);
    const retrievedTheme = db.getTheme("custom-theme");

    test.assert(
      retrievedTheme !== null && retrievedTheme !== undefined,
      "Should retrieve theme",
    );
    if (retrievedTheme) {
      test.assertEqual(
        retrievedTheme.name,
        "custom-theme",
        "Theme name should match",
      );
      test.assertEqual(
        retrievedTheme.version,
        "2.0.0",
        "Theme version should match",
      );
      test.assertEqual(
        retrievedTheme.creator,
        "TestCreator",
        "Theme creator should match",
      );
    }
  });

  test.test("Get non-existent theme", () => {
    const db = new DockStatDB();
    const retrievedTheme = db.getTheme("non-existent-theme");
    test.assert(
      retrievedTheme === null || retrievedTheme === undefined,
      "Should return null for non-existent theme",
    );
  });

  test.test("Get all themes", () => {
    const db = new DockStatDB();
    db.addOrUpdateTheme(customTheme);

    const secondTheme: THEME.THEME_config = {
      ...customTheme,
      name: "second-theme",
      version: "1.5.0",
    };
    db.addOrUpdateTheme(secondTheme);

    const themes = db.getThemes();
    test.assert(Array.isArray(themes), "Should return array of themes");
    test.assert(themes.length >= 2, "Should have at least 2 themes");

    const themeNames = themes.map((t) => t.name);
    test.assert(
      themeNames.includes("custom-theme"),
      "Should include custom-theme",
    );
    test.assert(
      themeNames.includes("second-theme"),
      "Should include second-theme",
    );
  });

  test.test("Update existing theme (OR REPLACE)", () => {
    const db = new DockStatDB();
    db.addOrUpdateTheme(customTheme);

    const updatedTheme: THEME.THEME_config = {
      ...customTheme,
      version: "3.0.0",
      creator: "UpdatedCreator",
    };

    db.addOrUpdateTheme(updatedTheme);
    const retrievedTheme = db.getTheme("custom-theme");

    test.assert(
      retrievedTheme !== null && retrievedTheme !== undefined,
      "Should retrieve updated theme",
    );
    if (retrievedTheme) {
      test.assertEqual(
        retrievedTheme.version,
        "3.0.0",
        "Theme version should be updated",
      );
      test.assertEqual(
        retrievedTheme.creator,
        "UpdatedCreator",
        "Theme creator should be updated",
      );
    }
  });

  test.test("Set theme in config", () => {
    const db = new DockStatDB();
    db.addOrUpdateTheme(customTheme);

    const result = db.setTheme("custom-theme");
    test.assert(
      result !== null && result !== undefined,
      "Should successfully set theme",
    );

    const config = db.getConfig();
    test.assertEqual(
      config.theme_config.name,
      "custom-theme",
      "Config should use custom theme",
    );
    test.assertEqual(
      config.theme_config.version,
      "2.0.0",
      "Theme version should match",
    );
  });

  test.test("Set non-existent theme", () => {
    const db = new DockStatDB();
    // Get the current config before attempting to set non-existent theme
    const configBefore = db.getConfig();

    const result = db.setTheme("non-existent-theme");
    test.assert(
      result === null || result === undefined,
      "Should return null for non-existent theme",
    );

    const configAfter = db.getConfig();
    test.assertEqual(
      configAfter.theme_config.name,
      configBefore.theme_config.name,
      "Config should remain unchanged when setting non-existent theme",
    );
  });

  // COMPLEX OPERATIONS
  test.section("COMPLEX OPERATIONS");

  test.test("Complete workflow: add theme, set config, use theme", () => {
    const db = new DockStatDB();

    // Add custom theme
    db.addOrUpdateTheme(customTheme);

    // Create config with multiple hosts
    const complexConfig: DATABASE.DB_config = {
      fetch_interval: 15,
      target_hosts: [
        {
          host: "prod.example.com",
          secure: true,
          name: "production",
          id: 1,
        },
        {
          host: "staging.example.com",
          secure: true,
          name: "staging",
          id: 2,
        },
        {
          host: "192.168.1.100",
          secure: false,
          name: "development",
          id: 3,
        },
      ],
      theme_config: darkDockStatTheme, // Will be updated
    };

    // Set config
    db.setConfig(complexConfig);

    // Set custom theme
    db.setTheme("custom-theme");

    // Verify everything
    const finalConfig = db.getConfig();
    test.assertEqual(
      finalConfig.fetch_interval,
      15,
      "Fetch interval should be preserved",
    );
    test.assertArrayLength(
      finalConfig.target_hosts,
      3,
      "Should have 3 target hosts",
    );
    test.assertEqual(
      finalConfig.theme_config.name,
      "custom-theme",
      "Should use custom theme",
    );

    // Verify hosts
    const prodHost = finalConfig.target_hosts.find(
      (h) => h.name === "production",
    );
    test.assert(prodHost !== undefined, "Should have production host");
    if (prodHost) {
      test.assertEqual(prodHost.secure, true, "Production should be secure");
    }
  });

  test.test("Theme with different background effects", () => {
    const db = new DockStatDB();

    const auroraTheme: THEME.THEME_config = {
      name: "aurora-theme",
      version: "1.0.0",
      creator: "TestCreator",
      license: "MIT",
      vars: {
        background_effect: {
          Aurora: {
            colorList: ["#ff0000", "#00ff00", "#0000ff"],
          },
        },
        components: customTheme.vars.components,
      },
    };

    db.addOrUpdateTheme(auroraTheme);
    const retrievedTheme = db.getTheme("aurora-theme");

    test.assert(retrievedTheme !== null, "Should retrieve aurora theme");
    if (retrievedTheme) {
      const vars = JSON.parse(JSON.stringify(retrievedTheme.vars));
      test.assert(
        "Aurora" in vars.background_effect,
        "Should have Aurora background effect",
      );
      test.assertArrayLength(
        vars.background_effect.Aurora.colorList,
        3,
        "Should have 3 colors",
      );
    }
  });

  test.test("Config persistence across multiple operations", () => {
    const db = new DockStatDB();

    // Set initial config
    db.setConfig(sampleConfig);
    let config = db.getConfig();
    test.assertEqual(
      config.fetch_interval,
      10,
      "Initial fetch interval should be 10",
    );

    // Add theme and set it
    db.addOrUpdateTheme(customTheme);
    db.setTheme("custom-theme");

    // Verify config is maintained except for theme
    config = db.getConfig();
    test.assertEqual(
      config.fetch_interval,
      10,
      "Fetch interval should be preserved",
    );
    test.assertArrayLength(
      config.target_hosts,
      1,
      "Target hosts should be preserved",
    );
    test.assertEqual(
      config.theme_config.name,
      "custom-theme",
      "Theme should be updated",
    );
  });

  // DATA INTEGRITY
  test.section("DATA INTEGRITY");

  test.test("Theme data serialization/deserialization", () => {
    const db = new DockStatDB();
    db.addOrUpdateTheme(customTheme);

    const retrievedTheme = db.getTheme("custom-theme");
    test.assert(retrievedTheme !== null, "Should retrieve theme");

    if (retrievedTheme) {
      // Verify that complex nested data is preserved
      const vars = JSON.parse(JSON.stringify(retrievedTheme.vars));
      test.assert(
        "Gradient" in vars.background_effect,
        "Should preserve Gradient background effect",
      );
      test.assertEqual(
        vars.background_effect.Gradient.from,
        "#ff0000",
        "Should preserve gradient from color",
      );
      test.assertEqual(
        vars.background_effect.Gradient.direction,
        "l-t",
        "Should preserve gradient direction",
      );
      test.assertEqual(
        vars.components.Card.title.font_weight,
        700,
        "Should preserve font weight",
      );
    }
  });

  test.test("Config data serialization with complex hosts", () => {
    const db = new DockStatDB();

    const complexConfig: DATABASE.DB_config = {
      fetch_interval: 25,
      target_hosts: [
        {
          host: "api.example.com",
          secure: true,
          name: "api-server",
          id: 100,
        },
      ],
      theme_config: customTheme,
    };

    db.setConfig(complexConfig);
    const retrievedConfig = db.getConfig();

    test.assertEqual(
      retrievedConfig.target_hosts[0].id,
      100,
      "Should preserve host ID",
    );
    test.assertEqual(
      retrievedConfig.target_hosts[0].host,
      "api.example.com",
      "Should preserve host address",
    );
    test.assertEqual(
      retrievedConfig.theme_config.name,
      "custom-theme",
      "Should preserve theme config",
    );
  });

  try {
    await Promise.all([]);
    test.printSummary();
  } catch (error) {
    test.addError(
      "RUNTIME",
      "Test execution",
      error instanceof Error ? error.message : String(error),
    );
    test.printSummary();
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  runComprehensiveTests().catch(console.error);
}

export { runComprehensiveTests, TestRunner };
