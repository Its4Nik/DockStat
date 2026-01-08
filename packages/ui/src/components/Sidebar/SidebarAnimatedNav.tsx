import { motion } from "framer-motion"

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
}

type SidebarAnimatedNavProps = {
  children: React.ReactNode
}

export function SidebarAnimatedNav({ children }: SidebarAnimatedNavProps) {
  return (
    <motion.nav
      variants={listVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="flex flex-1 flex-col gap-1 mt-4"
    >
      {children}
    </motion.nav>
  )
}

export function SidebarAnimatedItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={itemVariants} transition={{ duration: 0.2 }}>
      {children}
    </motion.div>
  )
}
