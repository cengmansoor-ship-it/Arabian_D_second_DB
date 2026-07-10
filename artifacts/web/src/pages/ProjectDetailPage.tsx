import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  api,
  type Project,
  type Block,
  type BlockWithFloors,
  type UnitType,
  type FloorType,
  type Unit,
  type UnitStatus,
  type UnitPurpose,
} from "../lib/api";

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

function statusColor(status: UnitStatus) {
  switch (status) {
    case "available": return "bg-green-100 text-green-700 border-green-300";
    case "sold": return "bg-red-100 text-red-700 border-red-300";
    case "rented": return "bg-blue-100 text-blue-700 border-blue-300";
    case "reserved": return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "blocked": case "cancelled": case "inactive": return "bg-gray-200 text-gray-500 border-gray-300";
    default: return "bg-white text-[var(--muted)] border-[var(--border)]";
  }
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const qc = useQueryClient();

  const { data: project } = useQuery({ queryKey: ["project", projectId], queryFn: () => api.get<Project>(`/projects/${projectId}`) });
  const { data: unitMap } = useQuery({
    queryKey: ["unit-map", projectId],
    queryFn: () => api.get<BlockWithFloors[]>(`/projects/${projectId}/unit-map`),
  });
  const { data: unitTypes } = useQuery({ queryKey: ["unit-types"], queryFn: () => api.get<UnitType[]>("/unit-types") });

  const [blockForm, setBlockForm] = useState({ name: "", code: "" });
  const [floorTarget, setFloorTarget] = useState<number | null>(null);
  const [floorForm, setFloorForm] = useState({ name: "", levelNumber: 0, floorType: "residential" as FloorType });
  const [unitTarget, setUnitTarget] = useState<{ blockId: number; floorId: number } | null>(null);
  const [unitForm, setUnitForm] = useState({ unitNumber: "", unitTypeId: 0, purpose: "not_available" as UnitPurpose });
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const createBlock = useMutation({
    mutationFn: () => api.post<Block>(`/projects/${projectId}/blocks`, blockForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unit-map", projectId] });
      setBlockForm({ name: "", code: "" });
    },
  });

  const createFloor = useMutation({
    mutationFn: (blockId: number) => api.post(`/projects/${projectId}/blocks/${blockId}/floors`, floorForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unit-map", projectId] });
      setFloorTarget(null);
      setFloorForm({ name: "", levelNumber: 0, floorType: "residential" });
    },
  });

  const createUnit = useMutation({
    mutationFn: () =>
      api.post(
        `/projects/${projectId}/blocks/${unitTarget!.blockId}/floors/${unitTarget!.floorId}/units`,
        unitForm,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unit-map", projectId] });
      setUnitTarget(null);
      setUnitForm({ unitNumber: "", unitTypeId: 0, purpose: "not_available" });
    },
  });

  const updateUnit = useMutation({
    mutationFn: ({ unitId, patch }: { unitId: number; patch: Partial<Pick<Unit, "status" | "purpose">> }) =>
      api.put(`/units/${unitId}`, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unit-map", projectId] });
      setSelectedUnit(null);
    },
  });

  if (!project) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{project.name}</h1>
        <p className="text-sm text-[var(--muted)]">کوډ: {project.code}</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 font-semibold">نوی بلاک</h2>
        <div className="flex flex-wrap gap-3">
          <input
            placeholder="نوم"
            value={blockForm.name}
            onChange={(e) => setBlockForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
          <input
            placeholder="کوډ"
            value={blockForm.code}
            onChange={(e) => setBlockForm((f) => ({ ...f, code: e.target.value }))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
          <button
            onClick={() => createBlock.mutate()}
            disabled={!blockForm.name.trim() || !blockForm.code.trim() || createBlock.isPending}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            جوړول
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {unitMap?.map((block) => (
          <div key={block.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{block.name} <span className="text-xs text-[var(--muted)]">({block.code})</span></h3>
              <button
                onClick={() => setFloorTarget(floorTarget === block.id ? null : block.id)}
                className="text-xs font-medium text-[var(--primary)] hover:underline"
              >
                + نوې طبقه
              </button>
            </div>

            {floorTarget === block.id && (
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-[var(--bg)] p-3">
                <input
                  placeholder="نوم"
                  value={floorForm.name}
                  onChange={(e) => setFloorForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm outline-none"
                />
                <input
                  type="number"
                  placeholder="کچه"
                  value={floorForm.levelNumber}
                  onChange={(e) => setFloorForm((f) => ({ ...f, levelNumber: Number(e.target.value) }))}
                  className="w-24 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm outline-none"
                />
                <select
                  value={floorForm.floorType}
                  onChange={(e) => setFloorForm((f) => ({ ...f, floorType: e.target.value as FloorType }))}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm outline-none"
                >
                  {Object.entries(FLOOR_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <button
                  onClick={() => createFloor.mutate(block.id)}
                  disabled={!floorForm.name.trim() || createFloor.isPending}
                  className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  زیاتول
                </button>
              </div>
            )}

            <div className="space-y-3">
              {block.floors.map((floor) => (
                <div key={floor.id} className="rounded-lg border border-[var(--border)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {floor.name} <span className="text-xs text-[var(--muted)]">({FLOOR_TYPE_LABELS[floor.floorType]})</span>
                    </span>
                    <button
                      onClick={() =>
                        setUnitTarget(
                          unitTarget?.floorId === floor.id ? null : { blockId: block.id, floorId: floor.id },
                        )
                      }
                      className="text-xs font-medium text-[var(--primary)] hover:underline"
                    >
                      + نوی واحد
                    </button>
                  </div>

                  {unitTarget?.floorId === floor.id && (
                    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-[var(--bg)] p-3">
                      <input
                        placeholder="د واحد شمېره"
                        value={unitForm.unitNumber}
                        onChange={(e) => setUnitForm((f) => ({ ...f, unitNumber: e.target.value }))}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm outline-none"
                      />
                      <select
                        value={unitForm.unitTypeId}
                        onChange={(e) => setUnitForm((f) => ({ ...f, unitTypeId: Number(e.target.value) }))}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm outline-none"
                      >
                        <option value={0}>ډول وټاکئ</option>
                        {unitTypes?.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <select
                        value={unitForm.purpose}
                        onChange={(e) => setUnitForm((f) => ({ ...f, purpose: e.target.value as UnitPurpose }))}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm outline-none"
                      >
                        {Object.entries(UNIT_PURPOSE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => createUnit.mutate()}
                        disabled={!unitForm.unitNumber.trim() || !unitForm.unitTypeId || createUnit.isPending}
                        className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        زیاتول
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {floor.units.map((unit) => (
                      <button
                        key={unit.id}
                        onClick={() => setSelectedUnit(unit)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium ${statusColor(unit.status)}`}
                        title={`${unit.unitType?.name ?? ""} — ${UNIT_STATUS_LABELS[unit.status]}`}
                      >
                        {unit.unitNumber}
                      </button>
                    ))}
                    {floor.units.length === 0 && <span className="text-xs text-[var(--muted)]">هیڅ واحد نشته</span>}
                  </div>
                </div>
              ))}
              {block.floors.length === 0 && <p className="text-xs text-[var(--muted)]">هیڅ طبقه نشته</p>}
            </div>
          </div>
        ))}
        {unitMap?.length === 0 && <p className="text-sm text-[var(--muted)]">تر اوسه هیڅ بلاک نشته.</p>}
      </div>

      {selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedUnit(null)}>
          <div className="w-80 rounded-xl bg-[var(--surface)] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 font-semibold">واحد {selectedUnit.unitNumber}</h3>
            <label className="mb-1 block text-xs text-[var(--muted)]">حالت</label>
            <select
              value={selectedUnit.status}
              onChange={(e) =>
                updateUnit.mutate({ unitId: selectedUnit.id, patch: { status: e.target.value as UnitStatus } })
              }
              className="mb-3 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
            >
              {Object.entries(UNIT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value} disabled={!MANUAL_STATUSES.includes(value as UnitStatus) && value !== selectedUnit.status}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--muted)]">
              حالتونه لکه "پلورل شوی" یا "کرایه شوی" یوازې د خرڅلاو/کرایې قراردادونو له لارې اتومات ټاکل کیږي.
            </p>
            <button onClick={() => setSelectedUnit(null)} className="mt-4 w-full rounded-lg bg-[var(--bg)] px-3 py-2 text-sm">
              بندول
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
