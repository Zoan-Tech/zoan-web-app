import { NextRequest, NextResponse } from "next/server";

const ORBITER_API = "https://openapi.orbiter.finance";
const TIMEOUT_MS = 15_000;

/**
 * Proxy for Orbiter Finance bridge API.
 *
 * GET  /api/bridge?action=chains  → GET  https://openapi.orbiter.finance/chains
 * POST /api/bridge                → POST https://openapi.orbiter.finance/quote
 */

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");

  if (action !== "chains") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${ORBITER_API}/chains`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    console.error("[Bridge Proxy] GET /chains error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body = await request.json();

    const response = await fetch(`${ORBITER_API}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message ?? "Orbiter API error" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    console.error("[Bridge Proxy] POST /quote error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
