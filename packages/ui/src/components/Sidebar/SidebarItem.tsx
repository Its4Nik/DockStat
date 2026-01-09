import { Pin } from "lucide-react"
import { Divider } from "../Divider/Divider"
import { LinkWithIcon } from "../Link/Link"

type PathItem = {
  slug: string
  path: string
  isPinned?: boolean
  children?: PathItem[]
}

type SidebarItemProps = {
  item: PathItem
  depth?: number
  handleTogglePin: (item: PathItem) => void
  isLoading: boolean
}

export const SidebarItem = ({ item, depth = 0, handleTogglePin, isLoading }: SidebarItemProps) => {
  const onToggle = () => handleTogglePin(item)

  return (
    <div className="flex flex-col gap-1">
      <div className="group flex items-center pr-1">
        <LinkWithIcon
          href={item.path}
          navLinkActive={({ isActive }) =>
            `flex-1 rounded-md py-1.5 text-sm font-medium transition-all duration-300 ${
              isActive ? "bg-main-bg text-muted-text" : "text-secondary-text hover:bg-main-bg/20"
            }`
          }
          style={{ paddingLeft: `${depth * 0.75 + 0.5}rem` }}
        >
          {item.slug}
        </LinkWithIcon>

        <button
          type="button"
          disabled={isLoading}
          onClick={onToggle}
          className={`${
            item.isPinned ? "opacity-100" : ""
          } ml-2 shrink-0 rounded-md bg-main-bg p-1.5 text-muted-foreground opacity-0 transition-all duration-200 hover:bg-main-bg/30 hover:text-accent focus:opacity-100 disabled:cursor-not-allowed group-hover:opacity-100 group-focus-within:opacity-100`}
          title={item.isPinned ? "Unpin" : "Pin"}
        >
          <Pin
            size={14}
            className={`rotate-30 transition-colors duration-200 hover:animate-wave ${
              item.isPinned ? "fill-accent text-accent" : ""
            }`}
          />
        </button>
      </div>

      {item.children?.length ? (
        <div className="flex flex-col gap-1">
          {item.children.map((child) => (
            <SidebarItem
              key={child.slug}
              item={child}
              depth={depth + 1}
              handleTogglePin={handleTogglePin}
              isLoading={isLoading}
            />
          ))}
        </div>
      ) : null}

      {depth === 0 && <Divider variant="dotted" />}
    </div>
  )
}
