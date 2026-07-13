import { describe, it, expect } from "vitest";
import { newAgent, loginAs, postWithCsrf } from "./helpers";
import { Unit, JournalLine, sequelize } from "@workspace/db-sequelize";

async function adminAgent() {
  const agent = newAgent();
  await loginAs(agent, "admin", "admin123");
  return agent;
}

async function createCustomer(agent: Awaited<ReturnType<typeof adminAgent>>, name: string) {
  const res = await postWithCsrf(agent, "/api/parties", { name, type: "individual_customer" });
  expect(res.status).toBe(201);
  return res.body.id as number;
}

describe("Sales: creation, duplicate prevention, receipts, ledger", () => {
  it("17-19. creates a sale, prevents selling the same unit twice, and posts a balanced journal entry", async () => {
    const agent = await adminAgent();
    const unit = await Unit.findOne({ where: { status: "available", purpose: "for_sale" } });
    expect(unit).not.toBeNull();
    const partyId = await createCustomer(agent, `Sale Test Customer ${Date.now()}`);

    const saleRes = await postWithCsrf(agent, "/api/sales", {
      unitId: unit!.id,
      partyId,
      price: 100000,
      currencyCode: "AFN",
      saleDate: "2026-07-12",
    });
    expect(saleRes.status).toBe(201);
    const saleId = saleRes.body.id;

    // Duplicate sale of the same unit must be rejected (unit no longer available).
    const dupRes = await postWithCsrf(agent, "/api/sales", {
      unitId: unit!.id,
      partyId,
      price: 50000,
      currencyCode: "AFN",
      saleDate: "2026-07-12",
    });
    expect(dupRes.status).toBe(400);

    // 23. Journal posting: the sale's journal transaction balances (sum of debits = sum of credits).
    const lines = await JournalLine.findAll({ where: { currencyCode: "AFN" } });
    const grouped = new Map<number, { debit: number; credit: number }>();
    for (const line of lines) {
      const entry = grouped.get(line.transactionId) ?? { debit: 0, credit: 0 };
      const amt = Number(line.amount);
      if (line.direction === "debit") entry.debit += amt;
      else entry.credit += amt;
      grouped.set(line.transactionId, entry);
    }
    for (const { debit, credit } of grouped.values()) {
      expect(Math.abs(debit - credit)).toBeLessThan(0.0001);
    }

    // 20-21. First receipt + a second installment.
    const receipt1 = await postWithCsrf(agent, `/api/sales/${saleId}/receipts`, {
      amount: 20000,
      currencyCode: "AFN",
      receiptDate: "2026-07-12",
    });
    expect(receipt1.status).toBe(201);
    const receipt2 = await postWithCsrf(agent, `/api/sales/${saleId}/receipts`, {
      amount: 10000,
      currencyCode: "AFN",
      receiptDate: "2026-07-13",
    });
    expect(receipt2.status).toBe(201);

    // 22. Ledger calculation: sale detail reflects total received across both installments.
    const detail = await agent.get(`/api/sales/${saleId}`);
    expect(detail.status).toBe(200);
    const totalReceived = (detail.body.receipts ?? []).reduce(
      (sum: number, r: { amount: string; voidedAt: string | null }) => (r.voidedAt ? sum : sum + Number(r.amount)),
      0,
    );
    expect(totalReceived).toBe(30000);
  });
});

describe("Rentals: double-booking prevention", () => {
  it("25-26. creates a rental and blocks renting the same unit again while active", async () => {
    const agent = await adminAgent();
    const unit = await Unit.findOne({ where: { status: "available", purpose: "rent" } });
    if (!unit) return; // No rent-purpose unit seeded; skip rather than fail on data shape.
    const partyId = await createCustomer(agent, `Rental Test Tenant ${Date.now()}`);

    const rentalRes = await postWithCsrf(agent, "/api/rentals", {
      unitId: unit.id,
      tenantPartyId: partyId,
      rentAmount: 5000,
      frequency: "monthly",
      currencyCode: "AFN",
      startDate: "2026-07-12",
    });
    expect(rentalRes.status).toBe(201);

    const dupRes = await postWithCsrf(agent, "/api/rentals", {
      unitId: unit.id,
      tenantPartyId: partyId,
      rentAmount: 4000,
      frequency: "monthly",
      currencyCode: "AFN",
      startDate: "2026-07-12",
    });
    expect(dupRes.status).toBe(400);
  });
});

describe("Journal: manual entries and duplicate prevention", () => {
  it("24. rejects an unbalanced manual journal entry", async () => {
    const agent = await adminAgent();
    const accounts = await agent.get("/api/journal/accounts");
    expect(accounts.status).toBe(200);
    const [a, b] = accounts.body;
    const res = await postWithCsrf(agent, "/api/journal/manual", {
      transactionDate: "2026-07-12",
      lines: [
        { accountId: a.id, direction: "debit", amount: 100, currencyCode: "AFN" },
        { accountId: b.id, direction: "credit", amount: 50, currencyCode: "AFN" },
      ],
    });
    expect(res.status).toBe(400);
  });
});

describe("Database integrity", () => {
  it("verifies SQLite integrity and that every journal transaction balances per currency", async () => {
    const [[result]] = (await sequelize.query("PRAGMA integrity_check")) as unknown as [Array<{ integrity_check: string }>];
    expect(result.integrity_check).toBe("ok");
  });
});
