// Sidebar.tsx
import React, { useEffect, useState } from "react";

export type NavItem = {
  key: string;
  label?: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  badge?: string | number;
};

type Props = {
  items: NavItem[];
  position?: "left" | "right";
  initialPinned?: boolean;
  hoverToExpand?: boolean;
  initialCollapsed?: boolean;
  mobileBreakpointClass?: string; // e.g. "md" => "md:hidden" used internally; default "md"
  className?: string;
  onPinChange?: (pinned: boolean) => void;
};

const ICON_SIZE = 20;
const COLLAPSED_WIDTH = "w-16"; // 4rem
const EXPANDED_WIDTH = "w-64";  // 16rem

export default function Sidebar({
  items,
  position = "left",
  initialPinned = false,
  hoverToExpand = true,
  initialCollapsed = false,
  mobileBreakpointClass = "md",
  className,
  onPinChange,
}: Props) {
  const [pinned, setPinned] = useState<boolean>(initialPinned);
  const [collapsed, setCollapsed] = useState<boolean>(initialCollapsed);
  const [hovered, setHovered] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    onPinChange?.(pinned);
  }, [pinned, onPinChange]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const isExpanded = pinned || (!collapsed && (hoverToExpand && hovered || !hoverToExpand && !collapsed) ) || mobileOpen;

  const basePositionClasses =
    position === "left" ? "left-0 rounded-r-lg" : "right-0 rounded-l-lg";

  const mobileBreakpoint = mobileBreakpointClass || "md";
  // For class building like "md:hidden" we assemble:
  const desktopHideClass = `${mobileBreakpoint}:hidden`;
  const desktopShowClass = `${mobileBreakpoint}:flex`;

  const containerWidthClass = isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

  return (
    <>
      {/* Desktop / wide screens: fixed sidebar (collapsed or expanded) */}
      <div
        aria-hidden={false}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={[
          "fixed top-4 bottom-4 z-40 flex flex-col bg-base-200 shadow-lg transition-all duration-200 overflow-hidden",
          basePositionClasses,
          containerWidthClass,
          desktopShowClass,
          className ?? "",
        ].join(" ")}
        style={{ boxSizing: "border-box" }}
      >
        {/* Header area: pin / collapse controls */}
        <div className="flex items-center justify-between p-3 gap-2 border-b border-base-300">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold">{isExpanded ? "App" : "A"}</div>
            {isExpanded && <div className="text-sm opacity-70">Panel</div>}
          </div>

          <div className="flex items-center gap-1">
            {/* Pin Button */}
            <button
              aria-pressed={pinned}
              aria-label={pinned ? "Unpin sidebar" : "Pin sidebar"}
              title={pinned ? "Unpin sidebar" : "Pin sidebar"}
              onClick={() => setPinned((s) => !s)}
              className="btn btn-ghost btn-sm"
            >
              {/* pin icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`${pinned ? "text-primary" : ""}`}>
                <path d="M14 3l3 3-9 9v4h-3v-4L14 3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 21l-6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Collapse/Expand Button */}
            <button
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
              className="btn btn-ghost btn-sm"
              onClick={() => setCollapsed((c) => !c)}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d={isExpanded ? "M19 12H5" : "M12 5v14"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-auto">
          <ul className="menu p-2 gap-1">
            {items.map((it) => (
              <li key={it.key}>
                <a
                  href={it.href}
                  onClick={(e) => {
                    if (it.onClick) {
                      e.preventDefault();
                      it.onClick();
                      setMobileOpen(false);
                    }
                  }}
                  className="flex items-center gap-3 px-2 py-2 rounded hover:bg-base-100"
                >
                  <div className="shrink-0" style={{ width: ICON_SIZE, height: ICON_SIZE }}>
                    {it.icon ?? null}
                  </div>

                  <div className={`${isExpanded ? "block" : "hidden"} truncate`}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{it.label}</span>
                      {it.badge && <span className="badge badge-xs">{it.badge}</span>}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-base-300">
          <div className={`${isExpanded ? "block" : "hidden"} text-xs opacity-80`}>
            Signed in as <strong className="block">user@example.com</strong>
          </div>
          <div className="mt-2 flex gap-2 justify-center">
            <button className="btn btn-sm btn-outline" onClick={() => alert("action")}>
              Action
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: hamburger to open drawer */}
      <div className={`fixed z-50 top-4 ${position === "left" ? "left-4" : "right-4"} ${mobileBreakpoint}:hidden`}>
        <button
          aria-label="Open sidebar"
          className="btn btn-primary btn-circle"
          onClick={() => setMobileOpen(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            className={[
              "fixed top-0 bottom-0 z-50 flex flex-col bg-base-200 shadow-lg transition-all",
              position === "left" ? "left-0" : "right-0",
              "w-72",
              "p-2",
            ].join(" ")}
          >
            <div className="flex items-center justify-between p-2">
              <div className="text-lg font-semibold">Navigation</div>
              <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={() => setMobileOpen(false)} aria-label="Close">
                  ✕
                </button>
              </div>
            </div>

            <nav className="flex-1 overflow-auto">
              <ul className="menu p-2 gap-1">
                {items.map((it) => (
                  <li key={it.key}>
                    <a
                      href={it.href}
                      onClick={(e) => {
                        if (it.onClick) {
                          e.preventDefault();
                          it.onClick();
                        }
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-3 px-2 py-2 rounded hover:bg-base-100"
                    >
                      <div style={{ width: ICON_SIZE, height: ICON_SIZE }}>{it.icon ?? null}</div>
                      <span>{it.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
