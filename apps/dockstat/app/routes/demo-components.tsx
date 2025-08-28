import React, { useMemo, useState } from 'react'
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
import { useLoaderData } from 'react-router'

interface ChartData {
  name: string
  value: number
}

export async function loader() {
  const { themeHandler } = await import('~/.server')
  return themeHandler.getActiveTheme()
}

export default function Demo() {
  const activeTheme = useLoaderData<typeof loader>()
  // UI state
  const [modalOpen, setModalOpen] = useState(false)
  const [toggle, setToggle] = useState(false)
  const [progress, setProgress] = useState(45)
  const [toasts, setToasts] = useState<
    { id: string; title: string; message?: string }[]
  >([])

  // Simple fallback toaster renderer (in case Toaster API differs).
  // We still render <Toaster /> (from your library) so library-specific toasts show up too.
  function pushToast(title: string, message?: string) {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 7)
    setToasts((t) => [{ id, title, message }, ...t])
    // auto-remove
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3500)
  }

  // Example chart data (adapt if your Chart component expects different shape)
  const chartData: ChartData[] = useMemo(
    () => [
      { name: 'Jan', value: 12 },
      { name: 'Feb', value: 19 },
      { name: 'Mar', value: 7 },
      { name: 'Apr', value: 14 },
      { name: 'May', value: 9 },
      { name: 'Jun', value: 17 },
    ],
    []
  )

  // Example dropdown items
  function onSelectItem(value: string) {
    pushToast('Dropdown', `Selected: ${value}`)
  }

  return (
    <div className="min-h-screen bg-card-bg p-6">
      {/* Library toaster + fallback toasts */}
      <Toaster position='top-center' />
      <div
        aria-hidden
        className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto rounded-card-radius px-4 py-3 shadow-card-shadow bg-sonner-bg border border-sonner-border text-sonner-color"
          >
            <div className="font-semibold">{t.title}</div>
            {t.message && <div className="text-sm opacity-80">{t.message}</div>}
          </div>
        ))}
      </div>

      <header className="max-w-7xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-card-title-color">
          DockStat — Component Demo
        </h1>
        <p className="text-sm text-card-sub_title-color">
          Visual playground for badges, buttons, cards, tables, and more.
        </p>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: controls & badges */}
        <section className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Badges & Toggles</h3>
                <Badge>{toggle ? 'live' : 'idle'}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge>Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="warning">Warning</Badge>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <ToggleSwitch
                  enabled={toggle}
                  onChange={(v: boolean) => {
                    setToggle(v)
                    pushToast('Toggle', `Switch is now ${v ? 'ON' : 'OFF'}`)
                  }}
                />
                <div className="text-sm text-card-content-font-color">
                  Auto-updates: <strong>{toggle ? 'On' : 'Off'}</strong>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setModalOpen(true)
                  }}
                >
                  Open Modal
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    pushToast('Hello', 'This is a demo toast')
                  }}
                >
                  Toast
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Inputs</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Input placeholder="Search tasks..." />
                <div className="flex gap-2">
                  <Input placeholder="Small" />
                  <Button onClick={() => pushToast('Search', 'Searching...')}>
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Middle column: charts & table */}
        <section className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Charts</h3>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <Chart data={chartData} dataKey='value' />
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-3 w-full">
                <div className="flex-1">
                  <Progress value={progress} />
                </div>
                <div className="w-28 text-right text-sm">
                  <span className="font-medium">{progress}%</span>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Button onClick={() => setProgress((p) => Math.min(100, p + 5))}>
                  +5%
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setProgress((p) => Math.max(0, p - 5))}
                >
                  -5%
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Data Table</h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell header>Service</TableCell>
                      <TableCell header>Uptime</TableCell>
                      <TableCell header>Status</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    <TableRow>
                      <TableCell>API</TableCell>
                      <TableCell>99.9%</TableCell>
                      <TableCell>
                        <Badge variant="success">Running</Badge>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>DB</TableCell>
                      <TableCell>99.5%</TableCell>
                      <TableCell>
                        <Badge variant="warning">Degraded</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Right column: dropdowns, hovercard, modal preview */}
        <section className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Dropdown & Hover</h3>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col gap-3">
                <Dropdown trigger={<Button>Open Actions</Button>}>
                  <div className="mt-2 w-56">
                    <DropdownItem onClick={() => onSelectItem('restart')}>
                      Restart
                    </DropdownItem>
                    <DropdownItem onClick={() => onSelectItem('scale')}>
                      Scale cluster
                    </DropdownItem>
                    <DropdownItem onClick={() => onSelectItem('logs')}>
                      View logs
                    </DropdownItem>
                  </div>
                </Dropdown>

                <HoverCard>
                  <HoverCard.Trigger>
                    <Button variant="secondary">Hover me</Button>
                  </HoverCard.Trigger>
                  <div className="text-sm">
                    Quick actions: <strong>Inspect</strong>, <strong>Open</strong>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button onClick={() => pushToast('Inspect', 'Inspecting')}>
                      Inspect
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => pushToast('Open', 'Opening')}
                    >
                      Open
                    </Button>
                  </div>
                </HoverCard>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Modal Preview</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-card-content-font-color">
                Modals can contain forms, confirmations or more complex UIs.
              </p>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => setModalOpen(true)}>Show Modal</Button>
                <Button variant="secondary" onClick={() => pushToast('Saved')}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Misc</h3>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div>
                  <strong>Switch size/visual:</strong>
                  <div className="mt-2">
                    <ToggleSwitch
                      enabled={toggle}
                      onChange={(v: boolean) => setToggle(v)}
                    />
                  </div>
                </div>

                <div>
                  <strong>Inline controls:</strong>
                  <div className="mt-2 flex gap-2">
                    <Button onClick={() => pushToast('Small', 'Clicked')}>
                      Small
                    </Button>
                    <Button variant="secondary">
                      Secondary
                    </Button>
                    <Button
                      onClick={() => {
                        pushToast('Link', 'Pretend navigation')
                      }}
                    >
                      Link
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Demo modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="w-full max-w-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Demo Modal</h2>
          <p className="text-sm text-card-content-font-color mb-4">
            This is a preview of the modal content. Add forms, charts, or anything.
          </p>

          <div className="space-y-3">
            <Input placeholder="Modal input" />
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setModalOpen(false)}>Close</Button>
              <Button
                variant="primary"
                onClick={() => {
                  pushToast('Saved', 'Modal changes saved')
                  setModalOpen(false)
                }}
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      <div>
        <p>Active Theme config:</p>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <p>Theme Name</p>
              </TableCell>
              <TableCell>
                <p>Description</p>
              </TableCell>
              <TableCell>
                <p>Creator</p>
              </TableCell>
              <TableCell>
                <p>License</p>
              </TableCell>
              <TableCell>
                <p>Version</p>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <p>{activeTheme?.name}</p>
              </TableCell>
              <TableCell>
                <p>{activeTheme?.description}</p>
              </TableCell>
              <TableCell>
                <p>{activeTheme?.creator}</p>
              </TableCell>
              <TableCell>
                <p>{activeTheme?.license}</p>
              </TableCell>
              <TableCell>
                <p>{activeTheme?.version}</p>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p>{JSON.stringify(activeTheme?.vars) }</p>
      </div>
    </div>
  )
}
