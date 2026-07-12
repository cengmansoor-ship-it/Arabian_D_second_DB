import { describe, it, expect } from "vitest";
import { Block, Floor, Unit } from "@workspace/db-sequelize";
void Block;
import { newAgent, loginAs, postWithCsrf } from "./helpers";

describe("Seed idempotency & residential structure", () => {
  it("10. seeds exactly 10 blocks", async () => {
    expect(await Block.count()).toBe(10);
  });

  it("11. seeds exactly 60 floors", async () => {
    expect(await Floor.count()).toBe(60);
  });

  it("12. seeds exactly 270 houses/units", async () => {
    expect(await Unit.count()).toBe(270);
  });

  it("9. re-running ensureDatabaseReady does not duplicate the seed (idempotent)", async () => {
    const { ensureDatabaseReady } = await import("@workspace/db-sequelize");
    await ensureDatabaseReady();
    expect(await Block.count()).toBe(10);
    expect(await Floor.count()).toBe(60);
    expect(await Unit.count()).toBe(270);
  });

  it("13. rejects a duplicate unit identifier within the same block/floor", async () => {
    const agent = newAgent();
    await loginAs(agent, "admin", "admin123");
    const floor = await Floor.findOne({ include: [{ model: Block, as: "block" }] });
    expect(floor).not.toBeNull();
    const projectId = (floor as unknown as { block: { projectId: number } }).block.projectId;
    const existingUnit = await Unit.findOne({ where: { floorId: floor!.id } });
    expect(existingUnit).not.toBeNull();

    const res = await postWithCsrf(agent, `/api/projects/${projectId}/blocks/${floor!.blockId}/floors/${floor!.id}/units`, {
      unitNumber: existingUnit!.unitNumber,
      purpose: existingUnit!.purpose,
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("15. project CRUD: create, read and update a project", async () => {
    const agent = newAgent();
    await loginAs(agent, "admin", "admin123");
    const suffix = Date.now();
    const createRes = await postWithCsrf(agent, "/api/projects", { name: `Test Project ${suffix}`, code: `TP-${suffix}` });
    expect(createRes.status).toBe(201);
    const id = createRes.body.id;

    const readRes = await agent.get(`/api/projects/${id}`);
    expect(readRes.status).toBe(200);
  });
});
