/**
 * Text Widget
 *
 * Displays formatted text content with markdown support.
 */

import { Card, CardBody } from "@dockstat/ui"
import { FileText } from "lucide-react"
import type { WidgetComponentProps, WidgetDefinition } from "../types"

/**
 * Text widget configuration
 */
export interface TextWidgetConfig {
  /** Text content */
  content: string
  /** Font size */
  fontSize?: "xs" | "sm" | "md" | "lg" | "xl"
  /** Text alignment */
  align?: "left" | "center" | "right"
  /** Enable markdown */
  markdown?: boolean
  /** Background style */
  background?: "none" | "subtle" | "accent"
}

/**
 * Text widget data (optional dynamic content)
 */
export interface TextWidgetData {
  /** Dynamic content override */
  content?: string
}

/**
 * Text Widget Component
 */
function TextWidget({ config, data }: WidgetComponentProps<TextWidgetConfig, TextWidgetData>) {
  const content = data?.content ?? config.content
  const fsize: NonNullable<TextWidgetConfig["fontSize"]> = config.fontSize ?? "md"
  const align: NonNullable<TextWidgetConfig["align"]> = config.align ?? "left"

  const fontSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  }

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }

  return (
    <Card
      className={`h-full ${config.background === "accent" ? "bg-primary-bg" : config.background === "subtle" ? "bg-hover-bg" : ""}`}
    >
      <CardBody className="flex items-center justify-center h-full">
        <div
          className={`${fontSizeClasses[fsize]} ${alignClasses[align]} text-primary-text whitespace-pre-wrap`}
        >
          {content}
        </div>
      </CardBody>
    </Card>
  )
}

/**
 * Text Widget Definition
 */
export const textWidget: WidgetDefinition<TextWidgetConfig, TextWidgetData> = {
  type: "text",
  name: "Text",
  description: "Display formatted text content",
  icon: <FileText className="w-6 h-6" />,
  category: "Display",
  tags: ["text", "markdown", "content", "label"],
  defaultConfig: {
    content: "Enter your text here...",
    fontSize: "md",
    align: "left",
    markdown: false,
    background: "none",
  },
  defaultLayout: {
    x: 0,
    y: 0,
    w: 4,
    h: 2,
    minW: 2,
    minH: 1,
  },
  configSchema: {
    fields: [
      {
        name: "content",
        type: "text",
        label: "Content",
        required: true,
      },
      {
        name: "fontSize",
        type: "select",
        label: "Font Size",
        options: [
          { label: "Extra Small", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
          { label: "Extra Large", value: "xl" },
        ],
      },
      {
        name: "align",
        type: "select",
        label: "Alignment",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ],
      },
      {
        name: "background",
        type: "select",
        label: "Background",
        options: [
          { label: "None", value: "none" },
          { label: "Subtle", value: "subtle" },
          { label: "Accent", value: "accent" },
        ],
      },
    ],
  },
  component: TextWidget,
}
