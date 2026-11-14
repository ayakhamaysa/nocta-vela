import { motion } from "framer-motion";
import { brand, find, groups, money, totalPrice } from "../data/car";
import { ui } from "../data/ui";

// Text that rises softly into view
function Rise({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3 }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// One full-screen "shot". data-stage tells the 3D camera which shot to show
function Section({ id, children, className = "" }) {
  return (
    <section id={id} data-stage className={`relative min-h-svh flex px-5 md:px-[6vw] ${className}`}>
      {children}
    </section>
  );
}

const Label = ({ children }) => <p className="label">{children}</p>;

// Text column on one side (start = left in English, right in Arabic)
function Side({ id, side = "start", label, title, text, children }) {
  return (
    <Section id={id} className="items-end md:items-center pb-10 md:pb-0">
      <div className={`w-full md:w-[36%] ${side === "end" ? "md:ms-auto" : ""}`}>
        <Rise className="glass-sm rounded-2xl p-5 md:p-0">
          <Label>{label}</Label>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.02] mt-4">{title}</h2>
          <p className="text-mist mt-5 leading-relaxed max-w-md text-sm md:text-base">{text}</p>
          {children}
        </Rise>
      </div>
    </Section>
  );
}

export function Hero({ lang }) {
  const t = ui[lang];
  return (
    <Section id="top" className="flex-col items-center justify-between pt-24 pb-10 text-center">
      {/* The first screen does not wait for any script: it slides in with plain CSS (fast first paint) */}
      <div className="hero-in">
        <Label>{t.heroLabel}</Label>
        <h1 className="font-display text-[19vw] md:text-[8vw] leading-[0.85] mt-3 tracking-[0.06em] chrome" dir="ltr">
          {brand.model}
        </h1>
      </div>
      <div className="hero-in [animation-delay:0.25s]">
        <p className="font-display text-xl md:text-2xl">{t.heroText}</p>
        <p className="label mt-5 opacity-70">{t.scroll} ↓</p>
      </div>
    </Section>
  );
}

export function Design({ lang }) {
  const t = ui[lang];
  return (
    <Side id="design" label={t.designLabel} title={t.designTitle} text={t.designText}>
      <dl className="grid grid-cols-3 gap-4 mt-8 border-t border-line pt-5">
        {t.designPoints.map(([v, k]) => (
          <div key={k}>
            <dt className="font-display text-2xl md:text-3xl">{v}</dt>
            <dd className="text-mist text-xs mt-1">{k}</dd>
          </div>
        ))}
      </dl>
    </Side>
  );
}

export function Light({ lang }) {
  const t = ui[lang];
  return <Side id="light" label={t.lightLabel} title={t.lightTitle} text={t.lightText} />;
}

export function Drive({ lang }) {
  const t = ui[lang];
  return (
    <Side id="drive" side="end" label={t.driveLabel} title={t.driveTitle} text={t.driveText}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 mt-8 border-t border-line pt-6">
        {t.stats.map(([v, u, k]) => (
          <div key={k}>
            <dt className="font-display text-4xl md:text-5xl" dir="ltr">
              {v}
              <span className="text-gold text-lg ms-1">{u}</span>
            </dt>
            <dd className="text-mist text-xs mt-1">{k}</dd>
          </div>
        ))}
      </dl>
    </Side>
  );
}

export function Cabin({ lang }) {
  const t = ui[lang];
  return <Side id="cabin" label={t.cabinLabel} title={t.cabinTitle} text={t.cabinText} />;
}

// One row of choices: round swatches with the name of the chosen one
function Choice({ title, list, value, onPick, lang, paint }) {
  const picked = find(list, value);
  return (
    <div className="py-2.5 border-b border-line last:border-0">
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-mist">{title}</span>
        <span className="text-end">
          {picked[lang]}
          {picked.price > 0 && <span className="text-gold ms-2 text-xs" dir="ltr">+{money(picked.price)}</span>}
        </span>
      </div>
      <div className="flex flex-wrap gap-2.5 mt-2">
        {list.map((o) => {
          const on = o.id === value;
          const color = o.color ?? paint; // "Body colour" shows the paint
          return (
            <button
              key={o.id}
              onClick={() => onPick(o.id)}
              aria-label={o[lang]}
              aria-pressed={on}
              title={o[lang]}
              className={`relative w-8 h-8 rounded-full transition-transform hover:scale-110 ${on ? "scale-110" : ""}`}
            >
              <span
                className="absolute inset-0 rounded-full ring-1 ring-white/15"
                style={{ background: `radial-gradient(circle at 30% 25%, #ffffff55, transparent 50%), ${color}` }}
              />
              {on && <motion.span layoutId={`ring-${title}`} className="absolute -inset-[5px] rounded-full border border-gold" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Build({ lang, config, set, override, setOverride }) {
  const t = ui[lang];
  const paint = find(groups[0].list, config.paint).color;
  const toggle = (key, onValue) => setOverride({ ...override, [key]: override[key] === onValue ? undefined : onValue });
  return (
    <Section id="build" className="items-end md:items-center pb-6 md:pb-0 md:pt-16">
      <div className="w-full md:w-[30%] md:min-w-[340px] md:ms-auto">
        <Rise className="hidden md:block">
          <Label>{t.buildLabel}</Label>
          <h2 className="font-display text-4xl mt-2">{t.buildTitle}</h2>
        </Rise>
        <Rise delay={0.1} className="glass rounded-2xl px-5 py-1 mt-4 max-h-[52svh] md:max-h-[calc(100svh-11rem)] overflow-y-auto">
          {groups.map((g) => (
            <Choice
              key={g.key}
              title={t.groups[g.key]}
              list={g.list}
              value={config[g.key]}
              onPick={(v) => set(g.key, v)}
              lang={lang}
              paint={paint}
            />
          ))}
          <div className="flex gap-2 py-3">
            <button onClick={() => toggle("doors", 1)} aria-pressed={override.doors === 1} className="chip">
              {t.doors}
            </button>
            <button onClick={() => toggle("lights", 0)} aria-pressed={override.lights !== 0} className="chip">
              {t.lights}
            </button>
          </div>
          <div className="flex items-end justify-between pt-3 pb-3 border-t border-line">
            <span className="text-mist text-sm">{t.total}</span>
            <motion.span key={totalPrice(config)} initial={{ opacity: 0.3, y: -5 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl" dir="ltr">
              {money(totalPrice(config))}
            </motion.span>
          </div>
        </Rise>
      </div>
    </Section>
  );
}

export function Reserve({ lang, config }) {
  const t = ui[lang];
  const lines = groups.map((g) => `• ${t.groups[g.key]}: ${find(g.list, config[g.key])[lang]}`);
  const link = `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(t.message(lines, money(totalPrice(config))))}`;
  return (
    <Section id="reserve" className="flex-col items-center justify-end pb-16 text-center">
      <Rise>
        <Label>{t.orderLabel}</Label>
        <h2 className="font-display text-4xl md:text-6xl mt-3">{t.orderTitle}</h2>
        <p className="text-mist mt-4 max-w-lg mx-auto text-sm md:text-base">{t.orderText}</p>
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-3 mt-8 rounded-full bg-pearl text-night px-8 py-4 font-semibold hover:bg-white transition-colors"
        >
          {t.send} · <span dir="ltr">{money(totalPrice(config))}</span>
        </a>
        <p className="text-mist text-xs mt-4">{t.deposit}</p>
      </Rise>
    </Section>
  );
}
