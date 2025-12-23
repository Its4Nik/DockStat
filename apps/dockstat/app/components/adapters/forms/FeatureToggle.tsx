import { Card, CardBody, Toggle } from "@dockstat/ui"
import { motion } from "framer-motion"
import { itemVariants } from "./consts"

interface FeatureToggleProps {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function FeatureToggle({ icon, label, description, checked, onChange }: FeatureToggleProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card size="sm" variant="outlined" className="p-3">
        <CardBody className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="my-auto text-accent">{icon}</div>
            <div className="flex flex-col">
              <span className="font-medium leading-none">{label}</span>
              <span className="mt-1 text-sm text-muted-text">{description}</span>
            </div>
          </div>
          <Toggle checked={checked} onChange={onChange} size="sm" />
        </CardBody>
      </Card>
    </motion.div>
  )
}
