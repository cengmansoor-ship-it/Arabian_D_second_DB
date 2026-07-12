import request from "supertest";
import type TestAgent from "supertest/lib/agent";
import app from "../src/app";

/** A supertest agent that persists cookies (session + CSRF) across requests, like a browser. */
export function newAgent(): TestAgent {
  return request.agent(app);
}

const csrfCache = new WeakMap<TestAgent, string>();

function extractCsrfFromSetCookie(res: { headers: Record<string, unknown> }): string | undefined {
  const setCookie = res.headers["set-cookie"] as unknown as string[] | undefined;
  const cookieHeader = setCookie?.find((c) => c.startsWith("csrf_token="));
  if (!cookieHeader) return undefined;
  return decodeURIComponent(cookieHeader.split(";")[0]!.split("=")[1]!);
}

/** Primes the CSRF cookie by issuing a safe GET request (if needed), then returns the token to send back as a header. */
export async function getCsrfToken(agent: TestAgent): Promise<string> {
  const cached = csrfCache.get(agent);
  if (cached) return cached;
  const res = await agent.get("/api/auth/me");
  const token = extractCsrfFromSetCookie(res);
  if (!token) {
    throw new Error("Unable to obtain CSRF token");
  }
  csrfCache.set(agent, token);
  return token;
}

export async function loginAs(agent: TestAgent, username: string, password: string) {
  const csrf = await getCsrfToken(agent);
  return agent.post("/api/auth/login").set("x-csrf-token", csrf).send({ username, password });
}

export async function postWithCsrf(agent: TestAgent, url: string, body: unknown) {
  const csrf = await getCsrfToken(agent);
  return agent.post(url).set("x-csrf-token", csrf).send(body);
}

export async function putWithCsrf(agent: TestAgent, url: string, body: unknown) {
  const csrf = await getCsrfToken(agent);
  return agent.put(url).set("x-csrf-token", csrf).send(body);
}
