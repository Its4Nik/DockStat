import type { ThemeOptions } from "./database";

export type TemplateEntry = {
  name: string;
  icon: string; // URL to the icon (svg/png) or empty string
  path: string; // URL to the template.json
  version: string; // Template version
  source: string; // Typically a GitHub repo or source link
};

export type ThemeEntry = {
  name: string; // Directory name (used as theme name)
  icon: string; // HEX color of the accent
  options: ThemeOptions;
  cssFile: string; // URL to the theme.css
  owner: string; // Extracted from @owner in CSS
  tags: string[];
};

export type IndexJson = {
  templates: TemplateEntry[];
  themes: ThemeEntry[];
};
