import { Switch } from '@headlessui/react'

interface ToggleSwitchProps {
  enabled: boolean
  onChange: (value: boolean) => void
  className?: string
}

export const ToggleSwitch = ({
  enabled,
  onChange,
  className = '',
}: ToggleSwitchProps) => (
  <Switch
    checked={enabled}
    onChange={onChange}
    className={`${
      enabled ? 'bg-switch-enabled-bg' : 'bg-switch-bg'
    } relative inline-flex h-switch-height w-switch-width items-center rounded-switch-radius transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-switch-focus-ring ${className}`}
  >
    <span
      className={`${
        enabled
          ? 'translate-x-switch-thumb-enabled-transform'
          : 'translate-x-0'
      } inline-block h-switch-thumb-size w-switch-thumb-size transform rounded-switch-thumb-radius bg-switch-thumb-bg transition-transform`}
    />
  </Switch>
)
