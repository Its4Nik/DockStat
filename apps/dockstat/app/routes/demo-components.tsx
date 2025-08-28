import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Chart,
  Dropdown,
  DropdownItem,
  HoverCard,
  Input,
  Modal,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Toaster,
  ToggleSwitch,
} from '@dockstat/ui'

export default function Demo() {
  return (
    <div>
      <Table>
      <TableHead>
        <TableRow>
          <TableCell header={true}>Header 1</TableCell>
          <TableCell header={true}>Header 2</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>Data 1</TableCell>
          <TableCell>Data 2</TableCell>
        </TableRow>
      </TableBody>
      </Table>
    </div>
  )
}
