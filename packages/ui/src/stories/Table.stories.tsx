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
  component: Table,
  parameters: {
    layout: "padded",
  },
  title: "Components/Table",
}

export default meta
type Story = StoryObj<typeof Table<User>>

const sampleData: User[] = [
  { email: "john@example.com", id: 1, name: "John Doe", role: "Admin", status: "active" },
  { email: "jane@example.com", id: 2, name: "Jane Smith", role: "User", status: "active" },
  { email: "bob@example.com", id: 3, name: "Bob Johnson", role: "Editor", status: "inactive" },
]

const columns = [
  { key: "id", title: "ID", width: 50 },
  { key: "name", title: "Name" },
  { key: "email", title: "Email" },
  { key: "role", title: "Role" },
  {
    key: "status",
    render: (value: string) => (
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          value === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {value}
      </span>
    ),
    title: "Status",
  },
]

export const Basic: Story = {
  args: {
    columns: columns,
    data: sampleData,
  },
}

export const Striped: Story = {
  args: {
    columns: columns,
    data: sampleData,
    striped: true,
  },
}

export const Bordered: Story = {
  args: {
    bordered: true,
    columns: columns,
    data: sampleData,
  },
}

export const Hoverable: Story = {
  args: {
    columns: columns,
    data: sampleData,
    hoverable: true,
  },
}
