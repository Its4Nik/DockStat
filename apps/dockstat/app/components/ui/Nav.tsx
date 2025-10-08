import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "./Button";
import { Book, Github, Navigation } from "lucide-react";
import { Link, useLoaderData } from "react-router";
import Modal from "./Modal";
import NavCards from "./NavCards";
import { NavItems } from "~/utils/NavItem";

gsap.registerPlugin(useGSAP)

/**
 * Navbar behavior:
 * - at top of page: centered, slightly narrower bar (brand on left, links on right)
 * - scrolled away from top: shrinks into a floating pill at top-left
 *
 * TailwindCSS required.
 */

export default function Nav({ links }: { links: { href: string, slug: string }[] }) {
  const navRef = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false)

  // toggle scrolled state
  useEffect(() => {
    const onScroll = () => {
      // threshold to treat as "not at top"
      setScrolled(window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // optional GSAP tween for extra polish (falls back to Tailwind transitions)
  useGSAP(() => {
    if (!navRef.current) return;
    const el = navRef.current;

    if (scrolled) {
      // small pill at top-left
      gsap.to(el, {
        duration: 0.32,
        top: 16,
        left: 16,
        width: 48,
        height: "16vh",
        borderRadius: 999,
        ease: "power2.out",
      });
    } else {
      // centered, slightly narrower top bar
      // NOTE: left and width are set so the bar is centered and not full-width
      gsap.to(el, {
        duration: 0.32,
        top: 8,
        left: "5%",
        width: "90%",
        height: 80,
        borderRadius: 24,
        ease: "power2.out",
      });
    }
  }, [scrolled]);

  const navBaseClass =
    "bg-main-bg/40 hover:shadow-glow shadow-2xl border border-border hover:border-accent backdrop-blur-md rounded-full shadow-md flex items-center transition-all duration-300 ease-in-out";

  return (
    <>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Navigation">
        <NavCards cards={NavItems}
        />
      </Modal>
      <div
        ref={navRef}
        // set an initial inline style so GSAP has numeric start values to animate from
        style={{
          top: 8,
          left: "5%",
          width: "90%",
          height: 60,
        }}
        className="fixed z-50"
        aria-hidden={false}
      >
        {/* the visible bar / pill */}
        <nav
          className={`${navBaseClass} ${scrolled ? "h-full px-0 py-0 overflow-hidden" : "px-6 py-2"}`}
          aria-label="Main navigation"
        >
          {!scrolled ? (
            // full navbar content (centered, slightly narrower)
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Link to="/">
                  <img alt="DockStat Logo" src="/_assets/DockStat-Logo.png" className="w-10 h-10" />
                </Link>
                <div className="text-xl text-text-secondary font-black">DockStat</div>
              </div>

              <div>
                {links.map((link) => {
                  return (
                    <Link key={JSON.stringify(link)} to={link.href}>
                      {link.slug}
                    </Link>
                  )
                })}
              </div>

              <div className="hidden md:flex items-center gap-6 text-md text-accent">
                <a
                  href="https://github.com/its4nik/dockstat"
                  className="hover:underline flex flex-row gap-1"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github className="w-5" />
                  GitHub
                </a>
                <a
                  href="https://outline.itsnik.de/s/9d88c471-373e-4ef2-a955-b1058eb7dc99"
                  className="hover:underline flex flex-row gap-1"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Book className="w-5" />
                  Docs
                </a>
                <Button variant="ghost" size="xs" aria-label="open navigation" onClick={() => setIsModalOpen(true)} >
                  <Navigation className="w-5" />
                </Button>
              </div>
            </div>
          ) : (
            // pill content (small, compact)
            <div className="flex items-center justify-center w-full h-full ">
              <div className="flex flex-col gap-4">
                <Link to={"/"}>
                  <img alt="DockStat Logo" src="/_assets/DockStat-Logo.png" className="w-7 h-7 mx-auto" />
                </Link>
                <Button variant="ghost" size="xs" aria-label="open navigation" onClick={() => setIsModalOpen(true)}>
                  <Navigation className="w-5" />
                </Button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
