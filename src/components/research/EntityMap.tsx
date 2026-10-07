"use client";

import { useMemo, useState } from "react";
import { Network, Puzzle } from "lucide-react";

import { Badge, Panel } from "@/components/ui/Surface";
import { EmptyState } from "@/components/ui/States";
import { ProjectPicker } from "@/components/research/SourceList";
import { useApp } from "@/lib/store/provider";
import { cn } from "@/lib/utils";
import { ENTITY_TYPES, type Entity, type EntityEdge, type EntityType } from "@/lib/types";

/**
 * Entity map.
 *
 * A deterministic layered layout — companies and people on the outer ring,
 * events and money in the middle — computed from the data itself. No physics
 * simulation, no extra dependency, and the same graph always renders the same
 * way, which matters when you are reading evidence off it.
 */

const TYPE_STYLE: Record<EntityType, { label: string; color: string; ring: string }> = {
  company: { label: "شركة", color: "#4c8dff", ring: "#4c8dff33" },
  person: { label: "شخص", color: "#a78bfa", ring: "#a78bfa33" },
  product: { label: "منتج", color: "#22d3ee", ring: "#22d3ee33" },
  event: { label: "حدث", color: "#f5a524", ring: "#f5a52433" },
  location: { label: "موقع", color: "#34d399", ring: "#34d39933" },
  money: { label: "مالي", color: "#f2545b", ring: "#f2545b33" },
  concept: { label: "مفهوم", color: "#9fb0c7", ring: "#9fb0c74d" },
};

const SIZE = 520;

interface Placed extends Entity {
  x: number;
  y: number;
}

/** Ring layout: nodes are ordered by degree so the connected ones sit together. */
function layout(entities: Entity[], edges: EntityEdge[]): Placed[] {
  if (entities.length === 0) return [];
  if (entities.length === 1) {
    return [{ ...entities[0], x: SIZE / 2, y: SIZE / 2 }];
  }

  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.fromId, (degree.get(e.fromId) ?? 0) + 1);
    degree.set(e.toId, (degree.get(e.toId) ?? 0) + 1);
  }
  const ordered = [...entities].sort(
    (a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) || a.name.localeCompare(b.name, "ar"),
  );

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  // Keep short graphs in one ring, long ones in two so labels stay legible.
  const rings = ordered.length <= 8 ? [1] : [1, 0.62];
  const out: Placed[] = [];
  let idx = 0;

  for (const ringScale of rings) {
    const count = Math.ceil(ordered.length * (ringScale === 1 ? 1 : 0.45));
    if (count <= 0) continue;
    const slice = ordered.slice(idx, idx + count);
    idx += count;
    const r = (SIZE / 2 - 62) * ringScale;
    slice.forEach((e, i) => {
      // Start at -90° so the first (highest-degree) node sits at the top.
      const angle = -Math.PI / 2 + (i / slice.length) * Math.PI * 2;
      out.push({ ...e, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    });
  }
  return out;
}

export function EntityMap({ entities, edges, showProject }: { entities: Entity[]; edges: EntityEdge[]; showProject?: boolean }) {
  const { state } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<EntityType | "all">("all");

  const visible = useMemo(
    () => (typeFilter === "all" ? entities : entities.filter((e) => e.type === typeFilter)),
    [entities, typeFilter],
  );

  const placed = useMemo(() => layout(visible, edges), [visible, edges]);
  const pos = useMemo(() => new Map(placed.map((p) => [p.id, p])), [placed]);

  const selectedEntity = entities.find((e) => e.id === selected) ?? null;
  const selectedEdges = selected ? edges.filter((e) => e.fromId === selected || e.toId === selected) : [];

  if (entities.length === 0) {
    return (
      <EmptyState
        icon={<Puzzle className="size-4" />}
        title="لا كيانات بعد"
        description="الكيانات هي الأشخاص والشركات والأحداث. تظهر بعد تشغيل بحث — وهي ما يربط المصادر ببعضها."
      />
    );
  }

  const presentTypes = [...new Set(entities.map((e) => e.type))];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
      <div>
        {/* Type legend doubles as the filter — no separate control. */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            aria-pressed={typeFilter === "all"}
            className={cn(
              "rounded-md border px-2.5 py-1 text-2xs transition-colors",
              typeFilter === "all" ? "border-accent/40 bg-accent-tint text-accent-soft" : "border-line text-ink-mute hover:text-ink",
            )}
          >
            الكل ({entities.length})
          </button>
          {presentTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
              aria-pressed={typeFilter === t}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-2xs transition-colors",
                typeFilter === t ? "border-accent/40 bg-accent-tint text-accent-soft" : "border-line text-ink-mute hover:text-ink",
              )}
            >
              <span className="size-1.5 rounded-full" style={{ background: TYPE_STYLE[t].color }} aria-hidden />
              {TYPE_STYLE[t].label} ({entities.filter((e) => e.type === t).length})
            </button>
          ))}
        </div>

        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="h-auto w-full min-w-[420px]"
              role="img"
              aria-label={`خريطة علاقات ${entities.length} كيانًا`}
            >
              {/* Edges first so nodes always sit on top. */}
              <g>
                {edges.map((e) => {
                  const a = pos.get(e.fromId);
                  const b = pos.get(e.toId);
                  if (!a || !b) return null;
                  const active = selected === e.fromId || selected === e.toId;
                  return (
                    <line
                      key={e.id}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={active ? "var(--color-accent)" : "var(--color-line-strong)"}
                      strokeWidth={active ? 1.6 : 1}
                      opacity={selected && !active ? 0.25 : 1}
                    />
                  );
                })}
              </g>

              <g>
                {placed.map((e) => {
                  const style = TYPE_STYLE[e.type];
                  const active = selected === e.id;
                  const dim = selected !== null && !active && !selectedEdges.some((x) => x.fromId === e.id || x.toId === e.id);
                  return (
                    <g
                      key={e.id}
                      onClick={() => setSelected(active ? null : e.id)}
                      className="cursor-pointer"
                      opacity={dim ? 0.35 : 1}
                      role="button"
                      tabIndex={0}
                      aria-label={`${e.name} — ${TYPE_STYLE[e.type].label}`}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          setSelected(active ? null : e.id);
                        }
                      }}
                    >
                      <circle
                        cx={e.x}
                        cy={e.y}
                        r={active ? 15 : 12}
                        fill={style.ring}
                        stroke={style.color}
                        strokeWidth={active ? 2 : 1.2}
                      />
                      <circle cx={e.x} cy={e.y} r={active ? 5 : 3.5} fill={style.color} />
                      <text
                        x={e.x}
                        y={e.y + 27}
                        textAnchor="middle"
                        className="fill-current text-[9px]"
                        style={{ fill: "var(--color-ink-soft)", fontSize: 9 }}
                      >
                        {e.name.length > 20 ? `${e.name.slice(0, 19)}…` : e.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
          <p className="border-t border-line px-3.5 py-2 text-[10px] text-ink-faint">
            انقر على أي عقدة لعرض تفاصيلها وأدلتها. التخطيط ثابت حسب درجة الاتصال — لا عشوائية.
          </p>
        </Panel>
      </div>

      {/* --- detail panel --------------------------------------------------- */}
      <aside>
        {selectedEntity ? (
          <Panel className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">{selectedEntity.name}</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="إغلاق"
                className="text-ink-faint hover:text-ink"
              >
                ×
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge
                tone="neutral"
                icon={
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: TYPE_STYLE[selectedEntity.type].color }}
                    aria-hidden
                  />
                }
              >
                {TYPE_STYLE[selectedEntity.type].label}
              </Badge>
            </div>
            <p className="mt-2.5 text-2xs leading-relaxed text-ink-mute">{selectedEntity.role}</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">{selectedEntity.description}</p>

            {selectedEdges.length > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <h4 className="label mb-2">العلاقات</h4>
                <ul className="space-y-2">
                  {selectedEdges.map((e) => {
                    const other = entities.find((x) => x.id === (e.fromId === selectedEntity.id ? e.toId : e.fromId));
                    if (!other) return null;
                    return (
                      <li key={e.id} className="text-2xs">
                        <span className="text-ink-faint">
                          {e.fromId === selectedEntity.id ? "←" : "→"} {e.relation}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelected(other.id)}
                          className="ms-1.5 text-accent-soft hover:underline"
                        >
                          {other.name}
                        </button>
                        {e.evidence && <p className="mt-0.5 leading-relaxed text-ink-mute">{e.evidence}</p>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {selectedEntity.sourceIds.length > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <h4 className="label mb-1.5">الأدلة</h4>
                <ul className="space-y-1">
                  {selectedEntity.sourceIds.map((sid) => {
                    const s = state.sources.find((x) => x.id === sid);
                    return (
                      <li key={sid} className="truncate text-2xs text-ink-mute">
                        {s ? s.title : sid}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Panel>
        ) : (
          <Panel className="p-4">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
              <Network className="size-3.5" aria-hidden />
              الأنواع
            </h3>
            <ul className="mt-3 space-y-1.5">
              {presentTypes.map((t) => (
                <li key={t} className="flex items-center gap-2 text-2xs text-ink-mute">
                  <span className="size-2 rounded-full" style={{ background: TYPE_STYLE[t].color }} aria-hidden />
                  {TYPE_STYLE[t].label}
                  <span className="num ms-auto text-ink-faint">{entities.filter((e) => e.type === t).length}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-2xs leading-relaxed text-ink-faint">
              اختر عقدة لعرض علاقاتها وأدلتها.
            </p>
          </Panel>
        )}
      </aside>
    </div>
  );
}

export function CrossProjectEntityMap() {
  const { state } = useApp();
  const [picked, setPicked] = useState("");
  const entities = state.entities.filter((e) => !picked || e.projectId === picked);
  const edges = state.entityEdges.filter((e) => !picked || e.projectId === picked);

  return (
    <div className="space-y-5">
      <ProjectPicker value={picked} onChange={setPicked} />
      <EntityMap entities={entities} edges={edges} showProject={!picked} />
    </div>
  );
}

export { ENTITY_TYPES, Puzzle };
