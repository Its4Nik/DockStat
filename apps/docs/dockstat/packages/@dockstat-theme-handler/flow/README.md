---
id: c4955c6c-2184-493e-bb07-12757a457289
title: Flow
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: b4148ac3-5b60-4223-aa0d-48111649b91f
updatedAt: 2025-08-28T12:36:27.384Z
urlId: 9ndQsUblrd
---

# CSSVariableParser

```mermaidjs
flowchart TB

    %% Entry Points
    A["parseThemeVars(themeVars, config?)"] --> B["flattenThemeVars(obj, config, path)"]
    A -->|Merges| AC[defaultParserConfig]

    %% flattenThemeVars process
    B -->|Checks nested objects| B1{"value is object?"}
    B1 -->|Yes| B2["Recurse flattenThemeVars"]
    B1 -->|No| B3{"shouldInclude?"}

    B3 -->|No| Bskip[Skip value]
    B3 -->|Yes| B4["transformKey + transformValue"]

    B4 --> B5[Build CSS Var Name]
    B5 --> B6["Assign to result{}"]

    B2 --> B6
    B6 --> Bout["Return Record<string,string>"]

    %% Usage
    AC --> A
    Bout --> C["applyCSSVariables(variables)"]
    Bout --> D["removeCSSVariables(variables)"]

    %% Apply CSS Vars Flow
    C --> C1[Iterate variables]
    C1 --> C2["document.documentElement.style.setProperty"]
    C2 --> C3["Verify via getComputedStyle"]

    %% Remove CSS Vars Flow
    D --> D1[Iterate keys]
    D1 --> D2["document.documentElement.style.removeProperty"]

    %% Parser Configs
    subgraph Configurations
      AC
      E1[parserConfigs.standard]
      E2[parserConfigs.compact]
      E3[parserConfigs.verbose]
      E4[parserConfigs.componentsOnly]
    end

    AC -.base config.-> E1
    AC -.base config.-> E2
    AC -.base config.-> E3
    AC -.base config.-> E4
```

# ThemeProvider.tsx

```mermaidjs
flowchart TD

    %% Entry
    A[ThemeProvider] --> S1["Initialize State + Refs"]
    A --> M1["Merge CSS Parser Config (useMemo)"]
    A --> L1["useLayoutEffect - Apply Initial Theme"]
    A --> E1["useEffect - Initialize Theme + Load Available Themes"]

    %% Config
    M1 --> M2{"themeNamespace?"}
    M2 -->|"components"| C1[parserConfigs.componentsOnly]
    M2 -->|"background"| C2[parserConfigs.standard]
    M2 -->|"else"| C3[parserConfigs.standard]
    M2 --> M3["Enable Tailwind Variables?"]

    %% Theme Loading
    E1 --> LA[loadAvailableThemes]
    E1 --> ST["setThemeName(initialThemeName)"]

    ST --> LT["loadTheme(name, attempt?)"]
    LT -->|"ThemeHandler"| H1["themeHandler.getTheme(name)"]
    LT -->|"API"| H2["fetch /themes/:name"]
    LT -->|"Retry"| LT
    LT -->|"Success"| AT["applyThemeVariables(themeConfig)"]
    LT -->|"Fail"| Fallback["Try fallbackThemeName"]

    %% Apply Variables
    AT --> RV["removeCSSVariables(currentCSSVars)"]
    AT --> PV["parseThemeVars(themeConfig.vars, finalConfig)"]
    PV --> AV["applyCSSVariables(cssVars)"]
    AV --> UV["Update currentCSSVars + setThemeVars"]

    %% State Updates + Events
    AT --> SU["Update state: theme, themeName, isThemeLoaded"]
    SU --> EH["Call onThemeChange / onThemeLoaded"]
    Fallback --> SU
    LT -->|"Error"| EH2["onThemeLoadError"]

    %% Refresh
    A --> R1[refreshTheme] --> ST

    %% Context
    A --> P1[ThemeContext.Provider]
    P1 --> O1[ThemeLoadingOverlay]
    P1 --> Children[children]

    %% Subgraphs
    subgraph "Hooks & Lifecycle"
      L1
      E1
      R1
    end

    subgraph "Theme Ops"
      LA
      LT
      AT
      RV
      PV
      AV
    end

    subgraph "State Mgmt"
      SU
      EH
      EH2
    end
```


\