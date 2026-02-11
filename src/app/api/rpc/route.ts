import { NextRequest, NextResponse } from "next/server";
import { alchemyRpcUrls } from "@/lib/config";
import { SUPPORTED_CHAINS } from "@/types/wallet";

const RPC_TIMEOUT_MS = 10_000;

function fetchWithTimeout(url: string, body: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
}

/**
 * Server-side RPC proxy to avoid CORS issues with public RPC endpoints.
 * The client POSTs { chainId, method, params } and this route forwards the
 * JSON-RPC call to the appropriate RPC URL.
 */
export async function POST(request: NextRequest) {
  try {
    const { chainId, method, params } = await request.json();

    if (!chainId || !method) {
      return NextResponse.json(
        { error: "chainId and method are required" },
        { status: 400 }
      );
    }

    // Determine RPC URL: try Alchemy first, then public RPC
    const alchemyUrl = alchemyRpcUrls[chainId];
    const publicUrl = SUPPORTED_CHAINS.find((c) => c.id === chainId)?.rpc_url;
    const rpcUrl = alchemyUrl || publicUrl;

    if (!rpcUrl) {
      return NextResponse.json(
        { error: `No RPC URL for chain ${chainId}` },
        { status: 400 }
      );
    }

    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params: params ?? [],
    });

    const isAlchemyMethod = method.startsWith("alchemy_");

    // Try primary URL
    let response = await fetchWithTimeout(rpcUrl, body);

    // If Alchemy fails, fall back to public RPC (only for standard methods)
    if (!response.ok && alchemyUrl && publicUrl && !isAlchemyMethod) {
      response = await fetchWithTimeout(publicUrl, body);
    }

    if (!response.ok) {
      // Return empty JSON-RPC result for Alchemy-specific methods so the
      // client gets a graceful empty response instead of a 502
      if (isAlchemyMethod) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id: 1,
          result: { address: "", tokenBalances: [] },
        });
      }
      return NextResponse.json(
        { error: `RPC error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json(
        { error: "RPC request timed out" },
        { status: 504 }
      );
    }
    console.error("[RPC Proxy]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
