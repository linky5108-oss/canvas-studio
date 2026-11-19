import { useEffect, useRef, useState, type ReactNode } from "react";
import { toPng } from "html-to-image";
import {
  Undo2, Redo2, Plus, Layers, Play, Share, SlidersHorizontal, Type, Square, Circle, Image as ImageIcon,
  Star, TextCursorInput, ToggleRight, CreditCard, RectangleHorizontal, Copy, Trash2, Lock, Unlock, Eye, EyeOff,
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Grid3x3, Smartphone, X, Maximize, AlignLeft, AlignCenter, AlignRight,
} from "lucide-react";
import { useEditor, DEVICES, elStyle, type El, type ElType } from "./store";
import { Group, Row, Slider, Num, Color, Toggle, Segmented, Sheet } from "./Controls";

const ADD: { t: ElType; l: string; i: ReactNode }[] = [
  { t: "text", l: "Texto", i: <Type /> }, { t: "button", l: "Botón", i: <RectangleHorizontal /> },
  { t: "image", l: "Imagen", i: <ImageIcon /> }, { t: "rect", l: "Rectángulo", i: <Square /> },
  { t: "circle", l: "Círculo", i: <Circle /> }, { t: "icon", l: "Icono", i: <Star /> },
  { t: "input", l: "Campo", i: <TextCursorInput /> }, { t: "switch", l: "Interruptor", i: <ToggleRight /> },
  { t: "card", l: "Tarjeta", i: <CreditCard /> },
];
const KEY = "ui-editor-v1";

function Content({ e }: { e: El }) {
  if (e.type === "image") return e.src ? <img src={e.src} alt="" draggable={false} className="h-full w-full object-cover" style={{ borderRadius: e.radius }} crossOrigin="anonymous" /> : null;
  if (e.type === "switch") return <span className="absolute right-[2px] top-[2px] rounded-full bg-card shadow" style={{ width: e.h - 4, height: e.h - 4 }} />;
  if (e.type === "card") return <span className="whitespace-pre-wrap px-4">{e.text}</span>;
  return <span className={`w-full whitespace-pre-wrap ${e.type === "input" ? "px-4" : "px-1"}`}>{e.text}</span>;
}

export default function Editor() {
  const s = useEditor();
  const device = DEVICES.find((d) => d.id === s.device)!;
  const sel = s.els.find((e) => e.id === s.sel) || null;
  const wrap = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const [sheet, setSheet] = useState<null | "add" | "props" | "layers" | "device">(null);
  const [tab, setTab] = useState<"layout" | "style" | "text" | "layer">("layout");
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });
  const [loaded, setLoaded] = useState(false);

  // persistence
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const d = JSON.parse(raw); useEditor.getState().set({ device: d.device, bg: d.bg }); useEditor.getState().load(d.els); }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(KEY, JSON.stringify({ els: s.els, device: s.device, bg: s.bg }));
  }, [s.els, s.device, s.bg, loaded]);

  const fit = () => {
    const el = wrap.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const z = Math.min((r.width - 32) / device.w, (r.height - 180) / device.h, 1.5);
    s.set({ zoom: z, pan: { x: (r.width - device.w * z) / 2, y: 70 + (r.height - 180 - device.h * z) / 2 } });
  };
  useEffect(fit, [s.device]);

  // gestures
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const g = useRef<any>(null);

  const onDown = (ev: React.PointerEvent) => {
    if (s.preview) return;
    wrap.current!.setPointerCapture(ev.pointerId);
    ptrs.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    const st = useEditor.getState();
    if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()] as { x: number; y: number }[];
      g.current = { mode: "pinch", d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, zoom: st.zoom, pan: st.pan };
      setGuides({ v: [], h: [] });
      return;
    }
    const t = ev.target as HTMLElement;
    const handle = t.closest("[data-handle]")?.getAttribute("data-handle");
    const id = t.closest("[data-el]")?.getAttribute("data-el");
    const e = st.els.find((x) => x.id === (handle ? st.sel : id));
    if (e && !e.locked) {
      st.commit();
      if (id !== st.sel && !handle) st.set({ sel: e.id });
      g.current = { mode: handle || "move", sx: ev.clientX, sy: ev.clientY, e: { ...e }, moved: false };
    } else if (e && e.locked) {
      st.set({ sel: e.id }); g.current = null;
    } else {
      g.current = { mode: "pan", sx: ev.clientX, sy: ev.clientY, pan: st.pan, moved: false };
    }
  };

  const onMove = (ev: React.PointerEvent) => {
    if (!ptrs.current.has(ev.pointerId)) return;
    ptrs.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    const G = g.current; if (!G) return;
    const st = useEditor.getState();
    const rect = wrap.current!.getBoundingClientRect();
    if (G.mode === "pinch") {
      const [a, b] = [...ptrs.current.values()]; if (!a || !b) return;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const z = Math.min(4, Math.max(0.15, G.zoom * (d / G.d)));
      const cx = (a.x + b.x) / 2 - rect.left, cy = (a.y + b.y) / 2 - rect.top;
      const ox = G.cx - rect.left, oy = G.cy - rect.top;
      const k = z / G.zoom;
      st.set({ zoom: z, pan: { x: cx - (ox - G.pan.x) * k, y: cy - (oy - G.pan.y) * k } });
      return;
    }
    const dx = (ev.clientX - G.sx) / st.zoom, dy = (ev.clientY - G.sy) / st.zoom;
    if (Math.abs(dx) + Math.abs(dy) > 2) G.moved = true;
    if (G.mode === "pan") { st.set({ pan: { x: G.pan.x + ev.clientX - G.sx, y: G.pan.y + ev.clientY - G.sy } }); return; }
    const e: El = G.e;
    if (G.mode === "move") {
      let x = e.x + dx, y = e.y + dy;
      const th = 6 / st.zoom;
      const vs = [0, device.w / 2, device.w], hs = [0, device.h / 2, device.h];
      st.els.forEach((o) => { if (o.id !== e.id && !o.hidden) { vs.push(o.x, o.x + o.w / 2, o.x + o.w); hs.push(o.y, o.y + o.h / 2, o.y + o.h); } });
      const gv: number[] = [], gh: number[] = [];
      for (const off of [0, e.w / 2, e.w]) { const m = vs.find((v) => Math.abs(x + off - v) < th); if (m !== undefined && !gv.length) { x = m - off; gv.push(m); } }
      for (const off of [0, e.h / 2, e.h]) { const m = hs.find((v) => Math.abs(y + off - v) < th); if (m !== undefined && !gh.length) { y = m - off; gh.push(m); } }
      setGuides({ v: gv, h: gh });
      st.update(e.id, { x: Math.round(x), y: Math.round(y) });
    } else if (G.mode === "rot") {
      const br = board.current!.getBoundingClientRect();
      const cx = br.left + (e.x + e.w / 2) * st.zoom, cy = br.top + (e.y + e.h / 2) * st.zoom;
      let a = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
      for (const sn of [0, 90, 180, 270, -90, 360]) if (Math.abs(a - sn) < 5) a = sn;
      st.update(e.id, { rotation: Math.round(((a % 360) + 360) % 360) });
    } else {
      let { x, y, w, h } = e;
      if (G.mode.includes("e")) w = e.w + dx;
      if (G.mode.includes("s")) h = e.h + dy;
      if (G.mode.includes("w")) { w = e.w - dx; x = e.x + dx; }
      if (G.mode.includes("n")) { h = e.h - dy; y = e.y + dy; }
      if (e.lockRatio && G.mode.length === 2) { const r = e.w / e.h; h = w / r; if (G.mode.includes("n")) y = e.y + e.h - h; }
      w = Math.max(8, w); h = Math.max(8, h);
      st.update(e.id, { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
    }
  };

  const onUp = (ev: React.PointerEvent) => {
    ptrs.current.delete(ev.pointerId);
    const G = g.current;
    if (G && !G.moved && G.mode === "pan") useEditor.getState().set({ sel: null });
    if (G?.mode === "move" && !G.moved && G.wasSel) setSheet("props");
    if (ptrs.current.size === 0) { g.current = null; setGuides({ v: [], h: [] }); }
    else if (G?.mode === "pinch") g.current = null;
  };

  // desktop wheel
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const fn = (e: WheelEvent) => {
      e.preventDefault();
      const st = useEditor.getState();
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        const z = Math.min(4, Math.max(0.15, st.zoom * Math.exp(-e.deltaY * 0.01)));
        const px = e.clientX - r.left, py = e.clientY - r.top, k = z / st.zoom;
        st.set({ zoom: z, pan: { x: px - (px - st.pan.x) * k, y: py - (py - st.pan.y) * k } });
      } else st.set({ pan: { x: st.pan.x - e.deltaX, y: st.pan.y - e.deltaY } });
    };
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, []);

  const exportPng = async () => {
    const prev = s.sel; s.set({ sel: null });
    await new Promise((r) => setTimeout(r, 50));
    try {
      const url = await toPng(board.current!, { pixelRatio: 3, width: device.w, height: device.h, style: { transform: "none" } });
      const a = document.createElement("a"); a.href = url; a.download = "diseno.png"; a.click();
    } catch { alert("No se pudo exportar la imagen (alguna imagen externa lo bloquea)."); }
    s.set({ sel: prev });
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ device: s.device, bg: s.bg, els: s.els }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "diseno.json"; a.click();
  };

  const up = (p: Partial<El>) => sel && s.update(sel.id, p);
  const C = () => s.commit();
  const z = s.zoom;

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-canvas text-foreground">
      {/* canvas */}
      <div ref={wrap} className="absolute inset-0 touch-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${s.pan.x}px, ${s.pan.y}px) scale(${z})` }}>
          <div ref={board} className="relative overflow-hidden rounded-[28px] shadow-board" style={{ width: device.w, height: device.h, background: s.bg }}>
            {s.grid && !s.preview && <div className="bg-grid pointer-events-none absolute inset-0" />}
            {s.els.map((e) => !e.hidden && (
              <div key={e.id} data-el={e.id}
                className="absolute flex items-center overflow-hidden"
                style={{ left: e.x, top: e.y, width: e.w, height: e.h, transform: `rotate(${e.rotation}deg)`, ...elStyle(e) }}>
                <Content e={e} />
              </div>
            ))}
            {guides.v.map((v, i) => <div key={"v" + i} className="pointer-events-none absolute top-0 h-full bg-guide" style={{ left: v, width: 1 / z }} />)}
            {guides.h.map((h, i) => <div key={"h" + i} className="pointer-events-none absolute left-0 w-full bg-guide" style={{ top: h, height: 1 / z }} />)}
          </div>
          {sel && !s.preview && !sel.hidden && (
            <div className="pointer-events-none absolute" style={{ left: sel.x, top: sel.y, width: sel.w, height: sel.h, transform: `rotate(${sel.rotation}deg)` }}>
              <div className="absolute inset-0 border-primary" style={{ borderWidth: 1.5 / z }} />
              {!sel.locked && <>
                {["nw", "ne", "sw", "se", "n", "s", "e", "w"].map((h) => {
                  const size = 22 / z;
                  const pos: React.CSSProperties = {
                    left: h.includes("w") ? -size / 2 : h.includes("e") ? sel.w - size / 2 : sel.w / 2 - size / 2,
                    top: h.includes("n") ? -size / 2 : h.includes("s") ? sel.h - size / 2 : sel.h / 2 - size / 2,
                    width: size, height: size,
                  };
                  return (
                    <div key={h} data-handle={h} className="pointer-events-auto absolute flex items-center justify-center" style={pos}>
                      <span className="rounded-full border-primary bg-card" style={{ width: (h.length === 2 ? 11 : 8) / z, height: (h.length === 2 ? 11 : 8) / z, borderWidth: 1.5 / z }} />
                    </div>
                  );
                })}
                <div data-handle="rot" className="pointer-events-auto absolute flex items-center justify-center rounded-full bg-primary text-primary-foreground"
                  style={{ left: sel.w / 2 - 14 / z, top: -44 / z, width: 28 / z, height: 28 / z, fontSize: 14 / z }}>↻</div>
              </>}
              <div className="absolute left-1/2 whitespace-nowrap rounded-md bg-primary px-1.5 py-0.5 font-medium text-primary-foreground"
                style={{ top: sel.h + 10 / z, transform: `translateX(-50%) scale(${1 / z})`, transformOrigin: "top center", fontSize: 11 }}>
                {Math.round(sel.w)} × {Math.round(sel.h)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* top bar */}
      <div className="glass absolute inset-x-0 top-0 z-30 flex items-center justify-between px-3 pb-2 pt-[max(env(safe-area-inset-top),10px)]">
        {s.preview ? (
          <button onClick={() => s.set({ preview: false })} className="flex items-center gap-1 text-[17px] font-medium text-primary"><X size={20} /> Salir</button>
        ) : (
          <div className="flex items-center gap-1">
            <IconBtn onClick={s.undo} disabled={!s.past.length} label="Deshacer"><Undo2 size={20} /></IconBtn>
            <IconBtn onClick={s.redo} disabled={!s.future.length} label="Rehacer"><Redo2 size={20} /></IconBtn>
          </div>
        )}
        <button onClick={() => setSheet("device")} className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[14px] font-semibold">
          <Smartphone size={15} /> {device.label} · {Math.round(z * 100)}%
        </button>
        <div className="flex items-center gap-1">
          {!s.preview && <IconBtn onClick={() => { s.set({ preview: true, sel: null }); }} label="Vista previa"><Play size={20} /></IconBtn>}
          <IconBtn onClick={exportPng} label="Exportar"><Share size={20} /></IconBtn>
        </div>
      </div>

      {/* bottom dock */}
      {!s.preview && (
        <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center pb-[max(env(safe-area-inset-bottom),14px)]">
          <div className="glass flex items-center gap-1 rounded-full p-1.5 shadow-sheet">
            <Dock onClick={() => setSheet("layers")} label="Capas"><Layers size={22} /></Dock>
            <Dock onClick={() => s.set({ grid: !s.grid })} label="Cuadrícula" active={s.grid}><Grid3x3 size={22} /></Dock>
            <button onClick={() => setSheet("add")} aria-label="Añadir" className="mx-1 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elegant active:scale-95 transition-transform"><Plus size={28} /></button>
            <Dock onClick={fit} label="Ajustar"><Maximize size={22} /></Dock>
            <Dock onClick={() => sel && setSheet("props")} label="Propiedades" disabled={!sel} active={!!sel}><SlidersHorizontal size={22} /></Dock>
          </div>
        </div>
      )}

      {/* quick action bar for selection */}
      {sel && !s.preview && !sheet && (
        <div className="absolute inset-x-0 bottom-[100px] z-20 flex justify-center">
          <div className="glass flex items-center gap-0.5 rounded-2xl p-1 shadow-sheet">
            <Quick onClick={() => { setTab("layout"); setSheet("props"); }}>Editar</Quick>
            <Quick onClick={() => s.duplicate(sel.id)}><Copy size={18} /></Quick>
            <Quick onClick={() => s.update(sel.id, { locked: !sel.locked }, true)}>{sel.locked ? <Lock size={18} /> : <Unlock size={18} />}</Quick>
            <Quick onClick={() => s.move(sel.id, "top")}><ChevronsUp size={18} /></Quick>
            <Quick onClick={() => s.remove(sel.id)} danger><Trash2 size={18} /></Quick>
          </div>
        </div>
      )}

      {/* empty hint */}
      {loaded && !s.els.length && !s.preview && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center">
          <p className="text-[17px] font-semibold">Empieza tu diseño</p>
          <p className="text-[14px] text-muted-foreground">Toca + para añadir elementos · Pellizca para hacer zoom</p>
        </div>
      )}

      {/* ADD */}
      <Sheet open={sheet === "add"} onClose={() => setSheet(null)} title="Añadir elemento">
        <div className="grid grid-cols-3 gap-3 pb-4">
          {ADD.map((a) => (
            <button key={a.t} onClick={() => { s.add(a.t); setSheet(null); }}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl bg-card text-[13px] font-medium active:scale-95 transition-transform">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">{a.i}</span>{a.l}
            </button>
          ))}
        </div>
      </Sheet>

      {/* DEVICE */}
      <Sheet open={sheet === "device"} onClose={() => setSheet(null)} title="Pantalla">
        <Group title="Dispositivo">
          {DEVICES.map((d) => (
            <button key={d.id} onClick={() => s.set({ device: d.id })} className="flex w-full items-center justify-between px-4 py-3 text-left text-[15px]">
              <span>{d.label} <span className="text-muted-foreground">{d.w}×{d.h}</span></span>
              {s.device === d.id && <span className="text-primary">✓</span>}
            </button>
          ))}
        </Group>
        <Group title="Fondo"><Row label="Color de fondo"><Color value={s.bg} onChange={(v) => s.set({ bg: v })} /></Row></Group>
        <Group title="Zoom"><Slider label="Zoom" value={Math.round(z * 100)} min={15} max={400} suffix="%" onChange={(v) => s.set({ zoom: v / 100 })} /></Group>
        <Group title="Exportar">
          <button onClick={exportPng} className="w-full px-4 py-3 text-left text-[15px] text-primary">Exportar imagen PNG</button>
          <button onClick={exportJson} className="w-full px-4 py-3 text-left text-[15px] text-primary">Exportar JSON</button>
          <button onClick={() => { if (confirm("¿Borrar todo el diseño?")) { s.commit(); s.set({ els: [], sel: null }); } }} className="w-full px-4 py-3 text-left text-[15px] text-destructive">Borrar todo</button>
        </Group>
      </Sheet>

      {/* LAYERS */}
      <Sheet open={sheet === "layers"} onClose={() => setSheet(null)} title="Capas">
        {s.els.length === 0 && <p className="py-8 text-center text-muted-foreground">Sin elementos todavía</p>}
        {s.els.length > 0 && (
          <Group>
            {[...s.els].reverse().map((e) => (
              <div key={e.id} className={`flex items-center gap-2 px-3 py-2 ${e.id === s.sel ? "bg-primary/10" : ""}`}>
                <button onClick={() => s.set({ sel: e.id })} className="flex flex-1 items-center gap-3 text-left">
                  <span className="h-7 w-7 rounded-md border border-border" style={{ background: e.fill }} />
                  <span className={`text-[15px] ${e.hidden ? "text-muted-foreground" : ""}`}>{e.name}</span>
                </button>
                <LBtn onClick={() => s.move(e.id, "up")}><ArrowUp size={16} /></LBtn>
                <LBtn onClick={() => s.move(e.id, "down")}><ArrowDown size={16} /></LBtn>
                <LBtn onClick={() => s.update(e.id, { hidden: !e.hidden }, true)}>{e.hidden ? <EyeOff size={16} /> : <Eye size={16} />}</LBtn>
                <LBtn onClick={() => s.update(e.id, { locked: !e.locked }, true)}>{e.locked ? <Lock size={16} /> : <Unlock size={16} />}</LBtn>
              </div>
            ))}
          </Group>
        )}
      </Sheet>

      {/* PROPERTIES */}
      <Sheet open={sheet === "props" && !!sel} onClose={() => setSheet(null)} title={sel?.name ?? ""}>
        {sel && <>
          <div className="sticky top-0 z-10 bg-sheet pb-3">
            <Segmented value={tab} onChange={setTab} options={[{ v: "layout", l: "Diseño" }, { v: "style", l: "Estilo" }, { v: "text", l: "Texto" }, { v: "layer", l: "Capa" }]} />
          </div>
          {tab === "layout" && <>
            <Group title="Posición">
              <Row label="X"><Num value={sel.x} onStart={C} onChange={(v) => up({ x: v })} /></Row>
              <Row label="Y"><Num value={sel.y} onStart={C} onChange={(v) => up({ y: v })} /></Row>
            </Group>
            <Group title="Tamaño">
              <Row label="Ancho"><Num value={sel.w} onStart={C} onChange={(v) => up(sel.lockRatio ? { w: v, h: v * sel.h / sel.w } : { w: v })} /></Row>
              <Row label="Alto"><Num value={sel.h} onStart={C} onChange={(v) => up(sel.lockRatio ? { h: v, w: v * sel.w / sel.h } : { h: v })} /></Row>
              <Row label="Bloquear proporción"><Toggle checked={sel.lockRatio} onChange={(v) => s.update(sel.id, { lockRatio: v }, true)} /></Row>
            </Group>
            <Group title="Rotación"><Slider label="Ángulo" value={sel.rotation} min={0} max={360} suffix="°" onStart={C} onChange={(v) => up({ rotation: v })} /></Group>
            <Group title="Alinear en pantalla">
              <div className="grid grid-cols-3 gap-px bg-border">
                {[["Izquierda", { x: 0 }], ["Centro H", { x: Math.round((device.w - sel.w) / 2) }], ["Derecha", { x: device.w - sel.w }],
                  ["Arriba", { y: 0 }], ["Centro V", { y: Math.round((device.h - sel.h) / 2) }], ["Abajo", { y: device.h - sel.h }]].map(([l, p]) => (
                  <button key={l as string} onClick={() => s.update(sel.id, p as Partial<El>, true)} className="bg-card py-3 text-[13px] text-primary">{l as string}</button>
                ))}
              </div>
            </Group>
          </>}
          {tab === "style" && <>
            <Group title="Relleno">
              <Row label="Color"><Color value={sel.fill} onStart={C} onChange={(v) => up({ fill: v })} /></Row>
              <Row label="Sin relleno"><Toggle checked={sel.fill === "transparent"} onChange={(v) => s.update(sel.id, { fill: v ? "transparent" : "#e5e5ea", gradient: false }, true)} /></Row>
              <Row label="Degradado"><Toggle checked={sel.gradient} onChange={(v) => s.update(sel.id, { gradient: v }, true)} /></Row>
              {sel.gradient && <>
                <Row label="Color final"><Color value={sel.fill2} onStart={C} onChange={(v) => up({ fill2: v })} /></Row>
                <Slider label="Ángulo" value={sel.gradAngle} min={0} max={360} suffix="°" onStart={C} onChange={(v) => up({ gradAngle: v })} />
              </>}
            </Group>
            <Group title="Apariencia">
              <Slider label="Opacidad" value={Math.round(sel.opacity * 100)} min={0} max={100} suffix="%" onStart={C} onChange={(v) => up({ opacity: v / 100 })} />
              <Slider label="Radio de esquinas" value={Math.min(sel.radius, 200)} min={0} max={200} onStart={C} onChange={(v) => up({ radius: v })} />
              <Slider label="Desenfoque" value={sel.blur} min={0} max={30} onStart={C} onChange={(v) => up({ blur: v })} />
            </Group>
            <Group title="Borde">
              <Slider label="Grosor" value={sel.borderWidth} min={0} max={20} onStart={C} onChange={(v) => up({ borderWidth: v })} />
              <Row label="Color"><Color value={sel.borderColor} onStart={C} onChange={(v) => up({ borderColor: v })} /></Row>
            </Group>
            <Group title="Sombra">
              <Slider label="Intensidad" value={sel.shadow} min={0} max={60} onStart={C} onChange={(v) => up({ shadow: v })} />
              <Row label="Color"><Color value={sel.shadowColor} onStart={C} onChange={(v) => up({ shadowColor: v + "55" })} /></Row>
            </Group>
            {sel.type === "image" && <Group title="Imagen">
              <div className="px-4 py-2"><input value={sel.src} onFocus={C} onChange={(e) => up({ src: e.target.value })} placeholder="URL de la imagen" className="w-full rounded-lg bg-muted px-3 py-2 text-[15px] outline-none" /></div>
              <label className="block px-4 py-3 text-[15px] text-primary">Elegir de la galería
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => s.update(sel.id, { src: r.result as string }, true); r.readAsDataURL(f); }} />
              </label>
            </Group>}
          </>}
          {tab === "text" && <>
            <Group title="Contenido">
              <div className="px-4 py-2"><textarea rows={2} value={sel.text} onFocus={C} onChange={(e) => up({ text: e.target.value })} placeholder="Escribe aquí" className="w-full resize-none rounded-lg bg-muted px-3 py-2 text-[15px] outline-none" /></div>
            </Group>
            <Group title="Tipografía">
              <Row label="Fuente">
                <select value={sel.fontFamily} onFocus={C} onChange={(e) => up({ fontFamily: e.target.value })} className="rounded-lg bg-muted px-2 py-1.5 text-[15px] outline-none">
                  <option value="system-ui">Sistema</option><option value="Georgia, serif">Serif</option><option value="ui-monospace, monospace">Mono</option><option value="'Avenir Next', 'Trebuchet MS', sans-serif">Redondeada</option>
                </select>
              </Row>
              <Slider label="Tamaño" value={sel.fontSize} min={8} max={120} onStart={C} onChange={(v) => up({ fontSize: v })} />
              <Slider label="Peso" value={sel.fontWeight} min={100} max={900} step={100} onStart={C} onChange={(v) => up({ fontWeight: v })} />
              <Slider label="Interlineado" value={sel.lineHeight} min={0.8} max={3} step={0.05} onStart={C} onChange={(v) => up({ lineHeight: v })} />
              <Slider label="Espaciado" value={sel.letterSpacing} min={-5} max={20} step={0.5} onStart={C} onChange={(v) => up({ letterSpacing: v })} />
              <Row label="Color"><Color value={sel.color} onStart={C} onChange={(v) => up({ color: v })} /></Row>
              <Row label="Alineación">
                <Segmented value={sel.align} onChange={(v) => s.update(sel.id, { align: v }, true)} options={[{ v: "left", l: <AlignLeft size={16} /> }, { v: "center", l: <AlignCenter size={16} /> }, { v: "right", l: <AlignRight size={16} /> }]} />
              </Row>
            </Group>
          </>}
          {tab === "layer" && <>
            <Group title="Nombre"><div className="px-4 py-2"><input value={sel.name} onFocus={C} onChange={(e) => up({ name: e.target.value })} className="w-full rounded-lg bg-muted px-3 py-2 text-[15px] outline-none" /></div></Group>
            <Group title="Orden">
              <div className="grid grid-cols-4 gap-px bg-border">
                {([["top", <ChevronsUp key="a" size={18} />], ["up", <ArrowUp key="b" size={18} />], ["down", <ArrowDown key="c" size={18} />], ["bottom", <ChevronsDown key="d" size={18} />]] as const).map(([d, i]) => (
                  <button key={d} onClick={() => s.move(sel.id, d)} className="flex justify-center bg-card py-3 text-primary">{i}</button>
                ))}
              </div>
            </Group>
            <Group>
              <Row label="Bloqueado"><Toggle checked={sel.locked} onChange={(v) => s.update(sel.id, { locked: v }, true)} /></Row>
              <Row label="Oculto"><Toggle checked={sel.hidden} onChange={(v) => s.update(sel.id, { hidden: v }, true)} /></Row>
            </Group>
            <Group>
              <button onClick={() => s.duplicate(sel.id)} className="w-full px-4 py-3 text-left text-[15px] text-primary">Duplicar</button>
              <button onClick={() => { s.remove(sel.id); setSheet(null); }} className="w-full px-4 py-3 text-left text-[15px] text-destructive">Eliminar</button>
            </Group>
          </>}
        </>}
      </Sheet>
    </div>
  );
}

function IconBtn({ children, onClick, disabled, label }: { children: ReactNode; onClick: () => void; disabled?: boolean; label: string }) {
  return <button aria-label={label} onClick={onClick} disabled={disabled} className="flex h-10 w-10 items-center justify-center rounded-full text-primary disabled:text-muted-foreground/40 active:bg-muted">{children}</button>;
}
function Dock({ children, onClick, label, active, disabled }: { children: ReactNode; onClick: () => void; label: string; active?: boolean; disabled?: boolean }) {
  return <button aria-label={label} onClick={onClick} disabled={disabled} className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors disabled:opacity-30 ${active ? "text-primary" : "text-foreground"} active:bg-muted`}>{children}</button>;
}
function Quick({ children, onClick, danger }: { children: ReactNode; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-[15px] font-medium active:bg-muted ${danger ? "text-destructive" : "text-primary"}`}>{children}</button>;
}
function LBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground active:bg-muted">{children}</button>;
}
