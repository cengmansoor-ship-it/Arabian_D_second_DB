import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { api, type Project, type Block, type BlockWithFloors, type UnitType, type FloorType, type Unit, type UnitStatus, type UnitPurpose } from "../lib/api";
import { ArrowRight, Plus, X } from "lucide-react";

const FLOOR_TYPE_LABELS: Record<FloorType, string> = {
  basement: "تحته", ground: "لاندنۍ طبقه", mezzanine: "مېزانین", residential: "استوګنیز",
  commercial: "تجارتي", parking: "پارکینګ", roof: "چت", other: "نور",
};

const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  draft: "مسوده", available: "خالي", reserved: "بک شوی", sold: "پلورل شوی",
  rented: "کرایه شوی", blocked: "بند شوی", cancelled: "لغوه شوی", inactive: "غیرفعال",
};

const MANUAL_STATUSES: UnitStatus[] = ["draft", "available", "blocked", "cancelled", "inactive"];

const UNIT_PURPOSE_LABELS: Record<UnitPurpose, string> = {
  for_sale: "د پلور لپاره", for_rent: "د کرایې لپاره", both: "دواړه", not_available: "نامیسر",
};

function unitBg(status: UnitStatus): React.CSSProperties {
  switch (status) {
    case "available": return { background: "var(--success-light)", color: "#065F46", borderColor: "#6EE7B7" };
    case "sold":      return { background: "var(--danger-light)",  color: "#991B1B", borderColor: "#FCA5A5" };
    case "rented":    return { background: "var(--info-light)",    color: "#1D4ED8", borderColor: "#93C5FD" };
    case "reserved":  return { background: "var(--warning-light)", color: "#92400E", borderColor: "#FCD34D" };
    default:          return { background: "var(--surface-2)",     color: "var(--muted)", borderColor: "var(--border)" };
  }
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const qc = useQueryClient();

  const { data: project } = useQuery({ queryKey: ["project", projectId], queryFn: () => api.get<Project>(`/projects/${projectId}`) });
  const { data: unitMap } = useQuery({ queryKey: ["unit-map", projectId], queryFn: () => api.get<BlockWithFloors[]>(`/projects/${projectId}/unit-map`) });
  const { data: unitTypes } = useQuery({ queryKey: ["unit-types"], queryFn: () => api.get<UnitType[]>("/unit-types") });

  const [blockForm, setBlockForm] = useState({ name: "", code: "" });
  const [floorTarget, setFloorTarget] = useState<number | null>(null);
  const [floorForm, setFloorForm] = useState({ name: "", levelNumber: 0, floorType: "residential" as FloorType });
  const [unitTarget, setUnitTarget] = useState<{ blockId: number; floorId: number } | null>(null);
  const [unitForm, setUnitForm] = useState({ unitNumber: "", unitTypeId: 0, purpose: "not_available" as UnitPurpose });
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const createBlock = useMutation({
    mutationFn: () => api.post<Block>(`/projects/${projectId}/blocks`, blockForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["unit-map", projectId] }); setBlockForm({ name: "", code: "" }); },
  });
  const createFloor = useMutation({
    mutationFn: (blockId: number) => api.post(`/projects/${projectId}/blocks/${blockId}/floors`, floorForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["unit-map", projectId] }); setFloorTarget(null); setFloorForm({ name: "", levelNumber: 0, floorType: "residential" }); },
  });
  const createUnit = useMutation({
    mutationFn: () => api.post(`/projects/${projectId}/blocks/${unitTarget!.blockId}/floors/${unitTarget!.floorId}/units`, unitForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["unit-map", projectId] }); setUnitTarget(null); setUnitForm({ unitNumber: "", unitTypeId: 0, purpose: "not_available" }); },
  });
  const updateUnit = useMutation({
    mutationFn: ({ unitId, patch }: { unitId: number; patch: Partial<Pick<Unit, "status" | "purpose">> }) => api.put(`/units/${unitId}`, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["unit-map", projectId] }); setSelectedUnit(null); },
  });

  if (!project) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Link to="/projects" style={{ color: "var(--muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
          پروژې <ArrowRight size={13} />
        </Link>
        <span style={{ color: "var(--muted)" }}>/</span>
        <span style={{ fontSize: 13 }}>{project.name}</span>
      </div>
      <p className="page-title">{project.name}</p>
      <p className="page-sub">کوډ: {project.code}</p>

      {/* New block */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={15} />نوی بلاک
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input className="form-input" placeholder="نوم" value={blockForm.name} onChange={(e) => setBlockForm((f) => ({ ...f, name: e.target.value }))} style={{ width: 180 }} />
          <input className="form-input" placeholder="کوډ" value={blockForm.code} onChange={(e) => setBlockForm((f) => ({ ...f, code: e.target.value }))} style={{ width: 100 }} />
          <button className="btn btn-primary" onClick={() => createBlock.mutate()} disabled={!blockForm.name.trim() || !blockForm.code.trim() || createBlock.isPending}>جوړول</button>
        </div>
      </div>

      {/* Blocks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {unitMap?.map((block) => (
          <div key={block.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {block.name} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 12 }}>({block.code})</span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setFloorTarget(floorTarget === block.id ? null : block.id)}>
                <Plus size={13} />طبقه
              </button>
            </div>

            {/* Add floor inline */}
            {floorTarget === block.id && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 12, background: "var(--surface-2)", borderRadius: 4, marginBottom: 14, alignItems: "center" }}>
                <input className="form-input" placeholder="نوم" value={floorForm.name} onChange={(e) => setFloorForm((f) => ({ ...f, name: e.target.value }))} style={{ width: 140 }} />
                <input className="form-input" type="number" placeholder="کچه" value={floorForm.levelNumber} onChange={(e) => setFloorForm((f) => ({ ...f, levelNumber: Number(e.target.value) }))} style={{ width: 90 }} />
                <select className="form-select" value={floorForm.floorType} onChange={(e) => setFloorForm((f) => ({ ...f, floorType: e.target.value as FloorType }))} style={{ width: 140 }}>
                  {Object.entries(FLOOR_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <button className="btn btn-primary btn-sm" onClick={() => createFloor.mutate(block.id)} disabled={!floorForm.name.trim() || createFloor.isPending}>زیاتول</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setFloorTarget(null)}><X size={14} /></button>
              </div>
            )}

            {/* Floors */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {block.floors.map((floor) => (
                <div key={floor.id} style={{ border: "1px solid var(--border)", borderRadius: 4, padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {floor.name} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11 }}>({FLOOR_TYPE_LABELS[floor.floorType]})</span>
                    </span>
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--primary)" }} onClick={() => setUnitTarget(unitTarget?.floorId === floor.id ? null : { blockId: block.id, floorId: floor.id })}>
                      <Plus size={13} />واحد
                    </button>
                  </div>

                  {unitTarget?.floorId === floor.id && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 10, background: "var(--surface-2)", borderRadius: 4, marginBottom: 10, alignItems: "center" }}>
                      <input className="form-input" placeholder="شمېره" value={unitForm.unitNumber} onChange={(e) => setUnitForm((f) => ({ ...f, unitNumber: e.target.value }))} style={{ width: 100 }} />
                      <select className="form-select" value={unitForm.unitTypeId} onChange={(e) => setUnitForm((f) => ({ ...f, unitTypeId: Number(e.target.value) }))} style={{ width: 140 }}>
                        <option value={0}>ډول وټاکئ</option>
                        {unitTypes?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <select className="form-select" value={unitForm.purpose} onChange={(e) => setUnitForm((f) => ({ ...f, purpose: e.target.value as UnitPurpose }))} style={{ width: 150 }}>
                        {Object.entries(UNIT_PURPOSE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <button className="btn btn-primary btn-sm" onClick={() => createUnit.mutate()} disabled={!unitForm.unitNumber.trim() || !unitForm.unitTypeId || createUnit.isPending}>زیاتول</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setUnitTarget(null)}><X size={14} /></button>
                    </div>
                  )}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {floor.units.map((unit) => (
                      <button
                        key={unit.id}
                        onClick={() => setSelectedUnit(unit)}
                        title={`${unit.unitType?.name ?? ""} — ${UNIT_STATUS_LABELS[unit.status]}`}
                        style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", ...unitBg(unit.status) }}
                      >
                        {unit.unitNumber}
                      </button>
                    ))}
                    {floor.units.length === 0 && <span style={{ fontSize: 12, color: "var(--muted)" }}>هیڅ واحد نشته</span>}
                  </div>
                </div>
              ))}
              {block.floors.length === 0 && <p style={{ fontSize: 13, color: "var(--muted)" }}>هیڅ طبقه نشته</p>}
            </div>
          </div>
        ))}
        {unitMap?.length === 0 && <div style={{ textAlign: "center", padding: 48, color: "var(--muted)", fontSize: 14 }}>تر اوسه هیڅ بلاک نشته.</div>}
      </div>

      {/* Unit modal */}
      {selectedUnit && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={() => setSelectedUnit(null)}>
          <div className="card" style={{ width: 340, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>واحد {selectedUnit.unitNumber}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedUnit(null)}><X size={16} /></button>
            </div>
            <span className={`badge ${unitBg(selectedUnit.status).background === "var(--success-light)" ? "badge-success" : "badge-muted"}`} style={{ marginBottom: 14, ...unitBg(selectedUnit.status) }}>
              {UNIT_STATUS_LABELS[selectedUnit.status]}
            </span>
            <label className="form-label" style={{ marginTop: 10 }}>حالت بدلول</label>
            <select className="form-select" value={selectedUnit.status} onChange={(e) => updateUnit.mutate({ unitId: selectedUnit.id, patch: { status: e.target.value as UnitStatus } })} style={{ marginBottom: 12 }}>
              {Object.entries(UNIT_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v} disabled={!MANUAL_STATUSES.includes(v as UnitStatus) && v !== selectedUnit.status}>{l}</option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              "پلورل شوی" او "کرایه شوی" یوازې د قراردادونو له لارې اتومات ټاکل کیږي.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
