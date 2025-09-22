import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { Button } from "./Button";
import { X } from "lucide-react";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP)

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  dismissible?: boolean; // allows click outside + ESC to close
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
  dismissible = true,
}: ModalProps) {
  const mountedRef = useRef(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  // Visible controls whether the modal is rendered (so we can animate out)
  const [isVisible, setIsVisible] = useState(open);

  // Ensure we don't render on SSR
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // When `open` becomes false, run exit animation and only after it completes remove from DOM.
  useGSAP(() => {
    if (open) {
      // start render+enter
      setIsVisible(true);

      // kill any existing tweens to avoid conflicts
      gsap.killTweensOf([panelRef.current, backdropRef.current]);

      // small timeout to ensure DOM nodes exist
      requestAnimationFrame(() => {
        if (!panelRef.current || !backdropRef.current) return;

        // set initial state then animate in
        gsap.set([backdropRef.current, panelRef.current], { clearProps: "all" });
        gsap.fromTo(
          backdropRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.32, ease: "power3.inOut" }
        );
        gsap.fromTo(
          panelRef.current,
          { y: 14, autoAlpha: 0, scale: 0.985 },
          { y: 0, autoAlpha: 1, scale: 1, duration: 0.36, ease: "power3.inOut" }
        );
      });
    } else if (!open && isVisible) {
      // exit animation: animate then hide
      gsap.killTweensOf([panelRef.current, backdropRef.current]);
      const tl = gsap.timeline({
        defaults: { ease: "bounce.inOut" },
      });
      if (backdropRef.current) {
        tl.to(backdropRef.current, { autoAlpha: 0, duration: 0.22 }, 0);
      }
      if (panelRef.current) {
        tl.to(
          panelRef.current,
          { y: 12, scale: 0.99, autoAlpha: 0, duration: 0.22 },
          0
        );
      }
      tl.call(() => {
        setIsVisible(false);
      });
    }
  }, [open]);

  // Focus handling, scroll lock, and keyboard trap while modal is visible.
  useEffect(() => {
    if (!isVisible) return;

    lastActiveRef.current = document.activeElement as HTMLElement | null;

    // focus first focusable element inside modal, or the container
    setTimeout(() => {
      const modalEl = panelRef.current;
      if (!modalEl) return;
      const first = modalEl.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (first ?? modalEl).focus();
    }, 0);

    // lock scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (!dismissible) return;
      if (e.key === "Escape") {
        onClose?.();
      } else if (e.key === "Tab") {
        const modalEl = panelRef.current;
        if (!modalEl) return;
        const focusables = Array.from(
          modalEl.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      // cleanup only after exit animation finished (because isVisible remains true until then)
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);
      lastActiveRef.current?.focus?.();
    };
  }, [isVisible, dismissible, onClose]);

  if (!mountedRef.current) return null;
  if (typeof document === "undefined") return null;
  if (!isVisible) return null;

  const overlay = (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      aria-hidden={false}
    // outer container used to catch focus and for stacking
    >
      {/* backdrop (lower z) */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity z-40"
        onMouseDown={() => dismissible && onClose?.()}
        // start hidden to avoid flash until gsap runs
        style={{ opacity: 0 }}
      />

      {/* modal panel (above backdrop) */}
      <div
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className={`relative z-50 max-w-3xl w-fit mx-4 sm:mx-6 rounded-lg p-6 shadow-xl bg-main-bg/90 border border-border ${className}`}
        style={{ opacity: 0 }}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          {title ? <h2 className="text-lg text-text-primary font-semibold">{title}</h2> : <div />}
          <div className="ml-auto">
            <Button
              onClick={() => onClose?.()}
              aria-label="Close dialog"
              variant="ghost"
              size="md"
              className="p-1 rounded-md hover:bg-main-bg/10 focus:outline-none"
            >
              <X />
            </Button>
          </div>
        </div>

        {/* body */}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
