import { NextRequest, NextResponse } from "next/server";
import { config, ENI_SWAP_ROUTERS } from "@/lib/config";
import { ZERO_X_SUPPORTED_CHAINS } from "@/services/swap";

const ZERO_X_BASE_URL = "https://api.0x.org/swap/permit2/quote";
const TIMEOUT_MS = 10_000;

/**
 * Server-side proxy for the 0x Protocol v2 swap quote API.
 * Keeps the API key server-side and handles chain routing.
 *
 * GET /api/swap?chainId=&sellToken=&buyToken=&sellAmount=&taker=&slippageBps=
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const chainId = Number(searchParams.get("chainId"));
    const sellToken = searchParams.get("sellToken");
    const buyToken = searchParams.get("buyToken");
    const sellAmount = searchParams.get("sellAmount");
    const taker = searchParams.get("taker");
    const slippageBps = searchParams.get("slippageBps") ?? "50";

    if (!chainId || !sellToken || !buyToken || !sellAmount || !taker) {
      return NextResponse.json(
        { reason: "Missing required params: chainId, sellToken, buyToken, sellAmount, taker" },
        { status: 400 }
      );
    }

    // ENI chains use a custom router — not yet integrated
    if (chainId in ENI_SWAP_ROUTERS) {
      const routerAddress = ENI_SWAP_ROUTERS[chainId];
      if (!routerAddress) {
        return NextResponse.json(
          { reason: "Swap is not yet configured for this network." },
          { status: 422 }
        );
      }
      // Future: build a Uniswap v2 getAmountsOut + swap call using routerAddress
      return NextResponse.json(
        { reason: "ENI swap router integration coming soon." },
        { status: 422 }
      );
    }

    if (!ZERO_X_SUPPORTED_CHAINS.includes(chainId)) {
      return NextResponse.json(
        { reason: `Chain ${chainId} is not supported for swaps.` },
        { status: 422 }
      );
    }

    const url = new URL(ZERO_X_BASE_URL);
    url.searchParams.set("chainId", String(chainId));
    url.searchParams.set("sellToken", sellToken.toLowerCase());
    url.searchParams.set("buyToken", buyToken.toLowerCase());
    url.searchParams.set("sellAmount", sellAmount);
    url.searchParams.set("taker", taker);
    url.searchParams.set("slippageBps", slippageBps);

    const requestHeaders = {
      "0x-api-key": config.zeroEx.apiKey,
      "0x-chain-id": String(chainId),
      "0x-version": "v2",
      "Content-Type": "application/json",
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: requestHeaders,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const text = await response.text();

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      // 0x returned a non-JSON body (e.g. plain-text auth error)
      return NextResponse.json(
        { reason: text || "0x API error" },
        { status: response.status }
      );
    }

    if (!response.ok) {
      const body = data as Record<string, unknown>;
      return NextResponse.json(
        { reason: body.reason ?? body.message ?? "0x API error" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json({ reason: "Swap quote timed out" }, { status: 504 });
    }
    console.error("[Swap Proxy]", err);
    return NextResponse.json({ reason: "Internal server error" }, { status: 500 });
  }
}
