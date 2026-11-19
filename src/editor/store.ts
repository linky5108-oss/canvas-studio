import { create } from "zustand";

export type ElType = "text" | "button" | "image" | "rect" | "circle" | "icon" | "input" | "switch" | "card";

export interface El {
  id: string; type: ElType; name: string;
  x: number; y: number; w: number; h: number; rotation: number;
  fill: string; gradient: boolean; fill2: string; gradAngle: number;
  opacity: number; radius: number;
  borderWidth: number; borderColor: string;
  shadow: number; shadowColor: string; blur: number;
  text: string; fontSize: number; fontWeight: number; fontFamily: string;
  align: "left" | "center" | "right"; lineHeight: number; color: string; letterSpacing: number;
  src: string; locked: boolean; hidden: boolean; lockRatio: boolean;
}

export const DEVICES = [
  { id: "iphone", label: "iPhone 15", w: 393, h: 852 },
  { id: "iphonese", label: "iPhone SE", w: 375, h: 667 },
  { id: "android", label: "Android", w: 412, h: 915 },
  { id: "ipad", label: "iPad", w: 820, h: 1180 },
];

let n = 0;
const uid = () => `el_${Date.now().toString(36)}_${(n++).toString(36)}`;

const base = (): Omit<El, "id" | "type" | "name"> => ({
  x: 40, y: 120, w: 200, h: 60, rotation: 0,
  fill: "#e5e5ea", gradient: false, fill2: "#0a84ff", gradAngle: 135,
  opacity: 1, radius: 12, borderWidth: 0, borderColor: "#c7c7cc",
  shadow: 0, shadowColor: "#00000040", blur: 0,
  text: "", fontSize: 17, fontWeight: 400, fontFamily: "system-ui",
  align: "center", lineHeight: 1.3, color: "#000000", letterSpacing: 0,
  src: "", locked: false, hidden: false, lockRatio: false,
});

export function makeEl(type: ElType, x: number, y: number): El {
  const b = { ...base(), id: uid(), type, name: type };
  const p: Record<ElType, Partial<El>> = {
    text: { name: "Texto", text: "Hola mundo", fill: "transparent", w: 220, h: 44, fontSize: 28, fontWeight: 700, align: "left" },
    button: { name: "Botón", text: "Continuar", fill: "#0a84ff", color: "#ffffff", fontWeight: 600, w: 280, h: 52, radius: 14 },
    image: { name: "Imagen", w: 240, h: 160, radius: 16, src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600", fill: "#d1d1d6" },
    rect: { name: "Rectángulo", w: 160, h: 120, fill: "#34c759" },
    circle: { name: "Círculo", w: 100, h: 100, radius: 999, fill: "#ff9f0a", lockRatio: true },
    icon: { name: "Icono", text: "★", w: 56, h: 56, fill: "#ff375f", color: "#ffffff", fontSize: 28, radius: 14 },
    input: { name: "Campo", text: "Correo electrónico", fill: "#ffffff", color: "#8e8e93", align: "left", w: 300, h: 48, borderWidth: 1, borderColor: "#d1d1d6", radius: 12 },
    switch: { name: "Interruptor", w: 52, h: 32, radius: 999, fill: "#34c759" },
    card: { name: "Tarjeta", w: 300, h: 180, fill: "#ffffff", radius: 20, shadow: 20, text: "" },
  };
  return { ...b, ...p[type], x, y } as El;
}

interface S {
  els: El[]; sel: string | null; past: El[][]; future: El[][];
  device: string; bg: string; zoom: number; pan: { x: number; y: number };
  grid: boolean; preview: boolean;
  set: (p: Partial<S>) => void;
  commit: () => void;
  add: (t: ElType) => void;
  update: (id: string, p: Partial<El>, history?: boolean) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  move: (id: string, dir: "up" | "down" | "top" | "bottom") => void;
  undo: () => void; redo: () => void;
  load: (els: El[]) => void;
}

export const useEditor = create<S>((set, get) => ({
  els: [], sel: null, past: [], future: [],
  device: "iphone", bg: "#f2f2f7", zoom: 0.8, pan: { x: 0, y: 0 }, grid: true, preview: false,
  set: (p) => set(p),
  commit: () => set((s) => ({ past: [...s.past.slice(-60), s.els], future: [] })),
  add: (t) => {
    get().commit();
    const d = DEVICES.find((d) => d.id === get().device)!;
    const e = makeEl(t, 0, 0);
    e.x = Math.round((d.w - e.w) / 2); e.y = Math.round(d.h / 3);
    set((s) => ({ els: [...s.els, e], sel: e.id }));
  },
  update: (id, p, history) => {
    if (history) get().commit();
    set((s) => ({ els: s.els.map((e) => (e.id === id ? { ...e, ...p } : e)) }));
  },
  remove: (id) => { get().commit(); set((s) => ({ els: s.els.filter((e) => e.id !== id), sel: null })); },
  duplicate: (id) => {
    const e = get().els.find((e) => e.id === id); if (!e) return;
    get().commit();
    const c = { ...e, id: uid(), x: e.x + 16, y: e.y + 16, name: e.name + " copia" };
    set((s) => ({ els: [...s.els, c], sel: c.id }));
  },
  move: (id, dir) => {
    get().commit();
    set((s) => {
      const a = [...s.els]; const i = a.findIndex((e) => e.id === id); if (i < 0) return {};
      const [e] = a.splice(i, 1);
      const j = dir === "top" ? a.length : dir === "bottom" ? 0 : dir === "up" ? Math.min(a.length, i + 1) : Math.max(0, i - 1);
      a.splice(j, 0, e); return { els: a };
    });
  },
  undo: () => set((s) => s.past.length ? { els: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.els, ...s.future] } : {}),
  redo: () => set((s) => s.future.length ? { els: s.future[0], future: s.future.slice(1), past: [...s.past, s.els] } : {}),
  load: (els) => set({ els, past: [], future: [], sel: null }),
}));

export function elStyle(e: El): React.CSSProperties {
  return {
    background: e.gradient ? `linear-gradient(${e.gradAngle}deg, ${e.fill}, ${e.fill2})` : e.fill,
    opacity: e.opacity, borderRadius: e.radius,
    border: e.borderWidth ? `${e.borderWidth}px solid ${e.borderColor}` : undefined,
    boxShadow: e.shadow ? `0 ${e.shadow / 2}px ${e.shadow}px ${e.shadowColor}` : undefined,
    filter: e.blur ? `blur(${e.blur}px)` : undefined,
    color: e.color, fontSize: e.fontSize, fontWeight: e.fontWeight, fontFamily: e.fontFamily,
    textAlign: e.align, lineHeight: e.lineHeight, letterSpacing: e.letterSpacing,
    justifyContent: e.align === "left" ? "flex-start" : e.align === "right" ? "flex-end" : "center",
  };
}
