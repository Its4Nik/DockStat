import type {
  BaseMeta,
  ContentItem,
  PluginMeta,
  StackMeta,
  ThemeMeta,
} from "../..";

function addHeader(body: string) {
  return `# DockStore

Welcome to DockStore! Here you can browse Plugins, themes and more. Currently only this GitHub based viewing is supported.

${body}`;
}

function addFooter(body: string) {
  return `${addHeader(body)}
---

> generated on the ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
`;
}

export function generateMarkdown(manifest: {
  plugins: PluginMeta[];
  themes: ThemeMeta[];
  stacks: StackMeta[];
}): string {
  let md = "";

  const renderSection = (title: string, items: Array<ContentItem>) => {
    if (!items.length) return "";
    md += `## ${title}\n\n`;
    for (const item of items) {
      md += `### ${item.name}\n\n`;
      md += `**Type**: ${item.type}  \n`;
      md += `**Description**: ${item.description}  \n`;
      md += `**Version**: ${item.version}  \n`;
      md += `**License**: ${item.license}  \n`;
      md += `**Author**: ${item.author.name}${
        item.author.website ? ` ([website](${item.author.website}))` : ""
      }  \n`;
      if (item.tags?.length) md += `**Tags**: ${item.tags.join(", ")}  \n`;
      if (item.repository)
        md += `**Repository**: [${item.repository}](${item.repository})  \n`;
      md += `**Path**: \`${item.path}\`  \n`;
      if ((item as PluginMeta).builtPath)
        md += `**Built**: \`${(item as PluginMeta).builtPath}\`  \n`;
      if ((item as StackMeta).composePath)
        md += `**Compose**: \`${(item as StackMeta).composePath}\`  \n`;
    }
  };

  renderSection("Plugins", manifest.plugins);
  renderSection("Themes", manifest.themes);
  renderSection("Stacks", manifest.stacks);

  const data = addFooter(md);

  return data;
}
