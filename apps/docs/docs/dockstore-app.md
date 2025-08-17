# DockStore Application

DockStore is a community marketplace and template generator for Docker stacks, themes, and plugins within the DockStat ecosystem. It serves as a centralized hub for sharing and distributing community-created content.

## 🏗️ Architecture

### Tech Stack

- **Runtime**: Bun native
- **Language**: TypeScript
- **Build System**: Bun build
- **Module System**: ESNext modules
- **Template Engine**: Custom generator system

### Key Features

- **Stack Templates**: Docker Compose stack templates
- **Theme Marketplace**: UI themes for DockStat frontend
- **Plugin Distribution**: Community plugins and extensions
- **Template Generator**: Automated template creation tools
- **Community Content**: User-contributed resources

## 📁 Project Structure

```
apps/dockstore/
├── .generator/              # Template generation tools
│   ├── convert.ts          # Template conversion utilities
│   └── schemas/            # Template validation schemas
├── templates/              # Stack templates library
│   ├── basic/             # Basic application stacks
│   ├── databases/         # Database stacks
│   ├── monitoring/        # Monitoring solutions
│   └── web-servers/       # Web server configurations
├── themes/                # UI themes collection
│   ├── dark/              # Dark mode themes
│   ├── light/             # Light mode themes
│   └── custom/            # Community themes
├── plugins/               # Plugin marketplace
│   ├── monitoring/        # Monitoring plugins
│   ├── notifications/     # Notification plugins
│   └── integrations/      # Third-party integrations
├── index.ts               # Main application entry
├── types.ts               # Type definitions
└── package.json           # Dependencies and scripts
```

## 🚀 Core Functionality

### Stack Templates

DockStore provides a comprehensive library of Docker Compose stack templates:

#### Template Categories

1. **Basic Applications**
   - Static websites
   - Simple web applications
   - Development environments

2. **Databases**
   - PostgreSQL configurations
   - MySQL setups
   - Redis cache systems
   - MongoDB deployments

3. **Monitoring Solutions**
   - Prometheus + Grafana
   - ELK Stack
   - Custom monitoring setups

4. **Web Servers**
   - Nginx configurations
   - Apache setups
   - Reverse proxy templates

#### Template Structure

```typescript
interface StackTemplate {
  name: string;
  version: string;
  description: string;
  category: string;
  author: string;
  tags: string[];
  compose: ComposeSpec;
  variables?: TemplateVariable[];
  documentation?: string;
  examples?: string[];
}
```

### Template Generator

The generator system converts raw templates into usable stack configurations:

```typescript
// .generator/convert.ts
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export class TemplateGenerator {
  async convertTemplate(templatePath: string): Promise<StackTemplate> {
    const composeFile = await readFile(join(templatePath, 'docker-compose.yml'), 'utf-8');
    const metadata = await this.parseMetadata(templatePath);
    
    return {
      name: metadata.name,
      version: metadata.version,
      description: metadata.description,
      category: metadata.category,
      author: metadata.author,
      tags: metadata.tags,
      compose: this.parseCompose(composeFile),
      variables: metadata.variables,
      documentation: await this.loadDocumentation(templatePath),
      examples: await this.loadExamples(templatePath)
    };
  }
  
  private async parseMetadata(templatePath: string) {
    const metaFile = await readFile(join(templatePath, 'template.json'), 'utf-8');
    return JSON.parse(metaFile);
  }
  
  private parseCompose(composeContent: string): ComposeSpec {
    // YAML to JSON conversion logic
    return parseYaml(composeContent);
  }
}
```

## 🎨 Theme System

### Theme Structure

```typescript
interface DockStatTheme {
  name: string;
  version: string;
  author: string;
  description: string;
  preview?: string;
  styles: {
    colors: ThemeColors;
    typography: ThemeTypography;
    components: ComponentStyles;
  };
  compatibility: string[];
}

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  status: {
    running: string;
    stopped: string;
    error: string;
    warning: string;
  };
}
```

### Theme Categories

1. **Dark Themes**
   - High contrast dark modes
   - Low-light optimized
   - Developer-friendly color schemes

2. **Light Themes**
   - Clean minimal designs
   - High readability
   - Professional appearances

3. **Custom Themes**
   - Brand-specific themes
   - Specialized use cases
   - Community contributions

### Theme Installation

```typescript
// Theme installation and activation
export class ThemeManager {
  async installTheme(themePath: string): Promise<void> {
    const theme = await this.loadTheme(themePath);
    await this.validateTheme(theme);
    await this.copyThemeAssets(theme);
    await this.registerTheme(theme);
  }
  
  async activateTheme(themeName: string): Promise<void> {
    const theme = await this.getTheme(themeName);
    await this.applyThemeStyles(theme);
    await this.updateConfiguration(themeName);
  }
}
```

## 🔌 Plugin Marketplace

### Plugin Architecture

```typescript
interface DockStatPlugin {
  name: string;
  version: string;
  author: string;
  description: string;
  category: PluginCategory;
  entry: string;
  dependencies?: string[];
  permissions: PluginPermission[];
  hooks: PluginHook[];
  configuration?: PluginConfig;
}

type PluginCategory = 
  | 'monitoring'
  | 'notifications'
  | 'integrations'
  | 'ui-extensions'
  | 'data-processing';

interface PluginHook {
  event: string;
  handler: string;
  priority?: number;
}
```

### Plugin Categories

1. **Monitoring Plugins**
   - Custom metrics collection
   - Advanced alerting systems
   - Performance analysis tools

2. **Notification Plugins**
   - Slack integrations
   - Email notifications
   - Custom webhook handlers

3. **Integration Plugins**
   - CI/CD pipeline integration
   - Cloud provider connectivity
   - Third-party service connections

4. **UI Extensions**
   - Custom dashboard widgets
   - Additional view components
   - Enhanced user interfaces

### Plugin Development

```typescript
// Example plugin structure
export default class MonitoringPlugin implements DockStatPlugin {
  name = 'Advanced Monitoring';
  version = '1.0.0';
  author = 'Community';
  description = 'Enhanced monitoring capabilities';
  category = 'monitoring';
  
  async onContainerStart(container: Container): Promise<void> {
    // Custom monitoring logic
    await this.startMonitoring(container);
  }
  
  async onContainerStop(container: Container): Promise<void> {
    // Cleanup monitoring
    await this.stopMonitoring(container);
  }
  
  private async startMonitoring(container: Container): Promise<void> {
    // Implementation details
  }
}
```

## 🛠️ Development

### Setup

```bash
cd apps/dockstore
bun install
```

### Development Server

```bash
bun run dev
```

### Template Generation

```bash
bun run make
```

This runs the template generator to convert raw templates into the proper format.

### Building

```bash
bun run build
```

Creates optimized bundles in the `dist/` directory.

## 📦 Template Development

### Creating New Templates

1. **Create Template Directory**
   ```bash
   mkdir templates/my-stack
   ```

2. **Add Docker Compose File**
   ```yaml
   # templates/my-stack/docker-compose.yml
   version: '3.8'
   services:
     web:
       image: nginx:latest
       ports:
         - "80:80"
       volumes:
         - ./html:/usr/share/nginx/html
   ```

3. **Add Template Metadata**
   ```json
   {
     "name": "My Stack",
     "version": "1.0.0",
     "description": "A simple web server stack",
     "category": "web-servers",
     "author": "Your Name",
     "tags": ["nginx", "web", "simple"],
     "variables": [
       {
         "name": "PORT",
         "description": "Web server port",
         "default": "80",
         "type": "number"
       }
     ]
   }
   ```

4. **Add Documentation**
   ```markdown
   # My Stack
   
   This template provides a simple Nginx web server.
   
   ## Usage
   
   1. Deploy the stack
   2. Place your HTML files in the `html/` directory
   3. Access your site at http://localhost
   ```

5. **Generate Template**
   ```bash
   bun run make
   ```

### Template Validation

```typescript
// Template validation schema
const templateSchema = {
  type: 'object',
  required: ['name', 'version', 'description', 'category', 'author'],
  properties: {
    name: { type: 'string' },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    description: { type: 'string' },
    category: { 
      type: 'string',
      enum: ['basic', 'databases', 'monitoring', 'web-servers']
    },
    author: { type: 'string' },
    tags: {
      type: 'array',
      items: { type: 'string' }
    },
    variables: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'description', 'type'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          default: {},
          type: { 
            type: 'string',
            enum: ['string', 'number', 'boolean', 'array']
          }
        }
      }
    }
  }
};
```

## 🎨 Theme Development

### Creating Custom Themes

1. **Theme Directory Structure**
   ```
   themes/my-theme/
   ├── theme.json          # Theme metadata
   ├── colors.json         # Color definitions
   ├── components.css      # Component styles
   ├── preview.png         # Theme preview image
   └── README.md           # Theme documentation
   ```

2. **Theme Configuration**
   ```json
   {
     "name": "My Custom Theme",
     "version": "1.0.0",
     "author": "Your Name",
     "description": "A beautiful custom theme",
     "compatibility": ["dockstat@^3.0.0"],
     "preview": "preview.png"
   }
   ```

3. **Color Definitions**
   ```json
   {
     "colors": {
       "primary": "#007acc",
       "secondary": "#6c757d",
       "background": "#ffffff",
       "surface": "#f8f9fa",
       "text": {
         "primary": "#212529",
         "secondary": "#6c757d",
         "disabled": "#adb5bd"
       },
       "status": {
         "running": "#28a745",
         "stopped": "#dc3545",
         "error": "#dc3545",
         "warning": "#ffc107"
       }
     }
   }
   ```

## 🔌 Plugin Development

### Plugin Template

```typescript
// plugins/my-plugin/index.ts
import { Plugin, Container, HostStats } from '@dockstat/typings';

export default class MyPlugin implements Plugin {
  name = 'My Plugin';
  version = '1.0.0';
  author = 'Your Name';
  description = 'A custom plugin for DockStat';
  
  async onContainerStart(container: Container): Promise<void> {
    console.log(`Container ${container.name} started`);
  }
  
  async onContainerStop(container: Container): Promise<void> {
    console.log(`Container ${container.name} stopped`);
  }
  
  async onHostUnreachable(host: HostStats): Promise<void> {
    console.log(`Host ${host.name} is unreachable`);
  }
}
```

### Plugin Registration

```typescript
// Plugin registration system
export class PluginRegistry {
  private plugins = new Map<string, Plugin>();
  
  async loadPlugin(pluginPath: string): Promise<void> {
    const plugin = await import(pluginPath);
    await this.validatePlugin(plugin.default);
    this.plugins.set(plugin.default.name, plugin.default);
  }
  
  async executeHook(hookName: string, ...args: any[]): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (typeof plugin[hookName] === 'function') {
        await plugin[hookName](...args);
      }
    }
  }
}
```

## 📊 Community Features

### Content Submission

1. **Template Submission**
   - Fork repository
   - Add template files
   - Submit pull request
   - Community review process

2. **Theme Submission**
   - Create theme package
   - Include preview images
   - Add documentation
   - Submit for review

3. **Plugin Submission**
   - Develop plugin following guidelines
   - Include comprehensive testing
   - Document usage and API
   - Submit to marketplace

### Content Discovery

```typescript
// Content discovery and filtering
export class ContentBrowser {
  async searchTemplates(query: string, filters: SearchFilters): Promise<StackTemplate[]> {
    return this.templates
      .filter(template => this.matchesQuery(template, query))
      .filter(template => this.matchesFilters(template, filters))
      .sort((a, b) => this.rankTemplate(b) - this.rankTemplate(a));
  }
  
  async getPopularContent(type: ContentType): Promise<Content[]> {
    return this.getContent(type)
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 10);
  }
  
  async getFeaturedContent(): Promise<Content[]> {
    return this.getContent('all')
      .filter(content => content.featured)
      .sort((a, b) => b.rating - a.rating);
  }
}
```

## 🚀 Distribution

### Package Publishing

```bash
# Build for distribution
bun run build

# Package templates
bun run package:templates

# Package themes
bun run package:themes

# Package plugins
bun run package:plugins
```

### Installation System

```typescript
// Content installation manager
export class InstallationManager {
  async installTemplate(templateId: string): Promise<void> {
    const template = await this.downloadTemplate(templateId);
    await this.validateTemplate(template);
    await this.installTemplateFiles(template);
    await this.registerTemplate(template);
  }
  
  async installTheme(themeId: string): Promise<void> {
    const theme = await this.downloadTheme(themeId);
    await this.validateTheme(theme);
    await this.installThemeAssets(theme);
    await this.registerTheme(theme);
  }
}
```

## 🤝 Contributing

### Development Workflow

1. Set up development environment
2. Create or modify templates/themes/plugins
3. Run generation tools: `bun run make`
4. Test locally with DockStat
5. Submit pull request

### Content Guidelines

- **Templates**: Must be well-documented and tested
- **Themes**: Should support both light and dark modes
- **Plugins**: Must follow security best practices
- **Documentation**: Include usage examples and configuration options

### Quality Standards

- All code must pass TypeScript type checking
- Templates must include proper documentation
- Themes must provide preview images
- Plugins must include comprehensive testing

DockStore serves as the central hub for community-driven content in the DockStat ecosystem, enabling users to easily discover, install, and share Docker stacks, themes, and plugins.