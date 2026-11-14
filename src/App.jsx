import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import { Build, Cabin, Design, Drive, Hero, Light, Reserve } from "./components/Sections";
import { brand, defaults } from "./data/car";
import { ui } from "./data/ui";

// The 3D showroom (three.js) is big, so it loads in its own file AFTER the text has appeared
const Stage = lazy(() => import("./components/Stage"));

export default function App() {
  const lang = "en"; // the site is in English
  const t = ui[lang];

  // Dark or light showroom. Remembered in this browser (if the browser allows it).
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("theme") !== "light";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // storage blocked: the choice just isn't remembered
    }
  }, [dark]);
  const [config, setConfig] = useState(defaults);
  const set = (key, value) => setConfig((c) => ({ ...c, [key]: value }));
  const stage = useRef(0); // which shot is on screen (2.5 = halfway between shots 2 and 3)

  // Doors / lights buttons in the configurator. The 3D reads them from a ref every frame.
  const [override, setOverrideState] = useState({});
  const overrideRef = useRef({});
  const setOverride = (o) => {
    overrideRef.current = o;
    setOverrideState(o);
  };

  // A dark curtain that lifts when the 3D studio is ready
  const [ready, setReady] = useState(false);

  // Follow the scroll and work out the shot number
  useEffect(() => {
    const update = () => {
      const tops = [...document.querySelectorAll("[data-stage]")].map((s) => s.offsetTop);
      const y = window.scrollY;
      let i = 0;
      while (i < tops.length - 1 && y >= tops[i + 1]) i++;
      const next = tops[i + 1] ?? tops[i] + window.innerHeight;
      stage.current = i + Math.min(1, Math.max(0, (y - tops[i]) / (next - tops[i])));
      // leaving the configurator gives the doors and lights back to the film
      if (Math.round(stage.current) !== 5 && Object.keys(overrideRef.current).length) setOverride({});
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <header className="fixed top-0 inset-x-0 z-40 h-16 flex items-center justify-between px-5 md:px-[4vw] bg-gradient-to-b from-night/80 to-transparent">
        <a href="#top" className="font-display text-xl tracking-[0.5em]" dir="ltr">
          {brand.name}
        </a>
        <nav className="hidden md:flex gap-9 text-[13px] tracking-wide text-mist">
          {Object.entries(t.nav).map(([id, label]) => (
            <a key={id} href={`#${id}`} className="hover:text-pearl transition-colors">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark(!dark)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
            className="grid place-items-center w-9 h-9 rounded-full text-mist hover:text-pearl transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {dark ? (
                <>
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
                </>
              ) : (
                <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
              )}
            </svg>
          </button>
          <a href="#reserve" className="whitespace-nowrap text-sm rounded-full border border-pearl/40 px-4 py-1.5 hover:bg-pearl hover:text-night transition-colors">
            {t.reserve}
          </a>
        </div>
      </header>

      <Suspense fallback={null}>
        <Stage stage={stage} config={config} dark={dark} override={overrideRef} onReady={() => setTimeout(() => setReady(true), 600)} />
      </Suspense>

      {/* Curtain: black, with the brand name, until the studio is ready */}
      <div
        className={`fixed inset-0 z-[15] bg-night grid place-items-end pb-[12svh] transition-opacity duration-[1600ms] pointer-events-none ${ready ? "opacity-0" : "opacity-100"}`}
      >
        <p className="label animate-pulse">{t.loading}</p>
      </div>

      {/* Text above the 3D. The mouse passes through (to drag the car); controls catch it */}
      <main className="relative z-20 pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_.glass]:pointer-events-auto">
        <Hero lang={lang} />
        <Design lang={lang} />
        <Light lang={lang} />
        <Drive lang={lang} />
        <Cabin lang={lang} />
        <Build lang={lang} config={config} set={set} override={override} setOverride={setOverride} />
        <Reserve lang={lang} config={config} />
      </main>

      <footer className="relative z-20 border-t border-line bg-night">
        <div className="px-5 md:px-[4vw] py-7 flex flex-wrap gap-3 justify-between text-xs text-mist">
          <span>
            <span dir="ltr" className="font-display text-pearl tracking-[0.4em] text-sm">
              {brand.name}
            </span>{" "}
            · {t.concept} · {t.credit}
          </span>
          <span>
            {t.madeBy}{" "}
            <a href="https://www.instagram.com/oneclick.ps" target="_blank" rel="noreferrer" className="font-semibold text-pearl">
              One Click
            </a>
          </span>
        </div>
      </footer>
    </MotionConfig>
  );
}
