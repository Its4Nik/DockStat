import type { Meta, StoryObj } from "@storybook/react-vite"
import { Table } from "../components/Table/Table"

interface User extends Record<string, unknown> {
  id: number
  name: string
  email: string
  role: string
  status: "active" | "inactive"
}

const meta: Meta<typeof Table> = {
  title: "Components/Table",
  component: Table,
  parameters: {
    layout: "padded",
  },
}

export default meta
type Story = StoryObj<typeof Table<User>>

const sampleData: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "active" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User", status: "active" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Editor", status: "inactive" },
]

const columns = [
  { key: "id", title: "ID", width: 50 },
  { key: "name", title: "Name" },
  { key: "email", title: "Email" },
  { key: "role", title: "Role" },
  {
    key: "status",
    title: "Status",
    render: (value: string) => (
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          value === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {value}
      </span>
    ),
  },
]

export const Basic: Story = {
  args: {
    data: sampleData,
    columns: columns,
  },
}

export const Striped: Story = {
  args: {
    data: sampleData,
    columns: columns,
    striped: true,
  },
}

export const Bordered: Story = {
  args: {
    data: sampleData,
    columns: columns,
    bordered: true,
  },
}

export const Hoverable: Story = {
  args: {
    data: sampleData,
    columns: columns,
    hoverable: true,
  },
}
