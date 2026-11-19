import type { ReactNode } from "react";

export function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      {title && <div className="mb-1.5 px-4 text-[13px] uppercase tracking-wide text-muted-foreground">{title}</div>}
      <div className="divide-y divide-border overflow-hidden rounded-xl bg-card">{children}</div>
    </div>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 px-4 py-2">
      <span className="shrink-0 text-[15px]">{label}</span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">{children}</div>
    </div>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, onStart, suffix = "" }: {
  label: string; value: number; min: number; max: number; step?: number; suffix?: string;
  onChange: (v: number) => void; onStart?: () => void;
}) {
  return (
    <div className="px-4 py-2.5">
      <div className="mb-1 flex justify-between text-[15px]">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">{Math.round(value * 100) / 100}{suffix}</span>
      </div>
      <input type="range" className="ios-range w-full" min={min} max={max} step={step} value={value}
        onPointerDown={onStart} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

export function Num({ value, onChange, onStart }: { value: number; onChange: (v: number) => void; onStart?: () => void }) {
  return (
    <input type="number" inputMode="decimal" value={Math.round(value)} onFocus={onStart}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-20 rounded-lg bg-muted px-2 py-1.5 text-right text-[15px] tabular-nums outline-none" />
  );
}

export function Color({ value, onChange, onStart }: { value: string; onChange: (v: string) => void; onStart?: () => void }) {
  const hex = /^#[0-9a-f]{6}/i.test(value) ? value.slice(0, 7) : "#ffffff";
  return (
    <label className="flex items-center gap-2">
      <span className="font-mono text-[13px] text-muted-foreground">{value === "transparent" ? "ninguno" : hex}</span>
      <span className="relative h-8 w-8 overflow-hidden rounded-full border border-border" style={{ background: value }}>
        <input type="color" value={hex} onFocus={onStart} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0" />
      </span>
    </label>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} aria-pressed={checked}
      className={`relative h-[31px] w-[51px] rounded-full transition-colors ${checked ? "bg-ios-green" : "bg-muted-foreground/30"}`}>
      <span className={`absolute top-0.5 h-[27px] w-[27px] rounded-full bg-card shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-[9px] bg-muted p-0.5">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className={`flex-1 rounded-[7px] px-3 py-1.5 text-[13px] font-medium transition-all ${value === o.v ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function Sheet({ open, onClose, title, children, right }: { open: boolean; onClose: () => void; title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-foreground/20 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <div className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[62vh] max-w-xl flex-col rounded-t-[22px] bg-sheet shadow-sheet transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}>
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        <div className="flex items-center justify-between px-4 pb-2 pt-2">
          <span className="text-[17px] font-semibold">{title}</span>
          <div className="flex items-center gap-3">{right}<button onClick={onClose} className="text-[17px] font-semibold text-primary">OK</button></div>
        </div>
        <div className="overflow-y-auto overscroll-contain px-3 pb-[max(env(safe-area-inset-bottom),16px)]">{children}</div>
      </div>
    </>
  );
}
