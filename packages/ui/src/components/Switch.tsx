import { Switch } from '@headlessui/react'

export const ToggleSwitch = ({ enabled, onChange, className = '' }) => {
  return (
    <Switch
      checked={enabled}
      onChange={onChange}
      className={`${
        enabled ? 'bg-components-switch-enabled-bg' : 'bg-components-switch-bg'
      } relative inline-flex h-components-switch-height w-components-switch-width items-center rounded-components-switch-radius transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-components-switch-focus-ring ${className}`}
    >
      <span
        className={`${
          enabled
            ? 'translate-x-components-switch-thumb-enabled-transform'
            : 'translate-x-0'
        } inline-block h-components-switch-thumb-size w-components-switch-thumb-size transform rounded-components-switch-thumb-radius bg-components-switch-thumb-bg transition-transform`}
      />
    </Switch>
  )
}
