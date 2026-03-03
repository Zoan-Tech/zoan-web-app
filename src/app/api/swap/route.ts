import { NextRequest, NextResponse } from "next/server";
import { config, ENI_RPC_URLS, ENI_SWAP_ROUTERS } from "@/lib/config";
import { NATIVE_TOKEN_ADDRESS, ZERO_X_SUPPORTED_CHAINS } from "@/services/swap";
import { decodeFunctionResult, encodeFunctionData, toHex } from "viem";

const ZERO_X_BASE_URL = "https://api.0x.org/swap/permit2/quote";
const TIMEOUT_MS = 10_000;

const ROUTER_TIMEOUT_MS = 10_000;
const DEFAULT_GAS_LIMIT_HEX = "0x7a120"; // 500_000

const eniRouterAbi = [
  {
    name: "exchange",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

function isNativeTokenAddress(addr: string): boolean {
  const a = addr.toLowerCase();
  return (
    a === NATIVE_TOKEN_ADDRESS.toLowerCase() ||
    a === "0x0000000000000000000000000000000000000000"
  );
}

async function rpcRequest<T>(rpcUrl: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ROUTER_TIMEOUT_MS);
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`RPC error: ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function ethCall(rpcUrl: string, tx: Record<string, unknown>): Promise<string> {
  const json = await rpcRequest<{ result?: string; error?: { message?: string } }>(rpcUrl, {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_call",
    params: [tx, "latest"],
  });
  if (json.error) throw new Error(json.error.message ?? "eth_call failed");
  if (!json.result) throw new Error("eth_call returned empty result");
  return json.result;
}

async function ethGasPrice(rpcUrl: string): Promise<string> {
  const json = await rpcRequest<{ result?: string; error?: { message?: string } }>(rpcUrl, {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_gasPrice",
    params: [],
  });
  if (json.error) throw new Error(json.error.message ?? "eth_gasPrice failed");
  return json.result ?? "0x0";
}

async function ethEstimateGas(rpcUrl: string, tx: Record<string, unknown>): Promise<string> {
  const json = await rpcRequest<{ result?: string; error?: { message?: string } }>(rpcUrl, {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_estimateGas",
    params: [tx],
  });
  if (json.error) throw new Error(json.error.message ?? "eth_estimateGas failed");
  return json.result ?? DEFAULT_GAS_LIMIT_HEX;
}

async function getExchangeQuote(
  rpcUrl: string,
  routerAddress: string,
  taker: `0x${string}`,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  amountIn: bigint,
  value: `0x${string}`
): Promise<bigint> {
  const data = encodeFunctionData({
    abi: eniRouterAbi,
    functionName: "exchange",
    args: [tokenIn, tokenOut, amountIn],
  });
  const result = await ethCall(rpcUrl, {
    from: taker,
    to: routerAddress,
    data,
    value,
  });
  try {
    return decodeFunctionResult({
      abi: eniRouterAbi,
      functionName: "exchange",
      data: result as `0x${string}`,
    }) as bigint;
  } catch {
    return BigInt(0);
  }
}

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

    // ENI chains use router.exchange(tokenIn, tokenOut, amount)
    if (chainId in ENI_SWAP_ROUTERS) {
      const routerAddress = ENI_SWAP_ROUTERS[chainId];
      if (!routerAddress) {
        return NextResponse.json(
          { reason: "Swap is not yet configured for this network." },
          { status: 422 }
        );
      }

      const rpcUrl = ENI_RPC_URLS[chainId];
      if (!rpcUrl) {
        return NextResponse.json(
          { reason: "Missing RPC URL for this ENI network." },
          { status: 422 }
        );
      }

      const sellIsNative = isNativeTokenAddress(sellToken);
      const buyIsNative = isNativeTokenAddress(buyToken);
      if (sellIsNative && buyIsNative) {
        return NextResponse.json(
          { reason: "Invalid swap pair: native to native." },
          { status: 400 }
        );
      }

      const amountIn = BigInt(sellAmount);
      const tokenIn = (sellIsNative
        ? "0x0000000000000000000000000000000000000000"
        : sellToken) as `0x${string}`;
      const tokenOut = (buyIsNative
        ? "0x0000000000000000000000000000000000000000"
        : buyToken) as `0x${string}`;
      const value = sellIsNative ? toHex(amountIn) : "0x0";

      const data = encodeFunctionData({
        abi: eniRouterAbi,
        functionName: "exchange",
        args: [tokenIn, tokenOut, amountIn],
      });

      let buyAmount = BigInt(0);
      try {
        buyAmount = await getExchangeQuote(
          rpcUrl,
          routerAddress,
          taker as `0x${string}`,
          tokenIn,
          tokenOut,
          amountIn,
          value as `0x${string}`
        );
      } catch (err: unknown) {
        console.error("[Swap Proxy Router preflight] Reverted:", err instanceof Error ? err.message : String(err));
        return NextResponse.json(
          { reason: "Insufficient liquidity for this swap pair or path not found." },
          { status: 400 }
        );
      }

      let gasPrice = "0x0";
      try {
        gasPrice = await ethGasPrice(rpcUrl);
      } catch {
        // ignore; wallet will fill defaults
      }

      let gas = DEFAULT_GAS_LIMIT_HEX;
      try {
        // This may fail before approval; fall back to a safe default
        gas = await ethEstimateGas(rpcUrl, {
          from: taker,
          to: routerAddress,
          data,
          value,
        });
      } catch {
        gas = DEFAULT_GAS_LIMIT_HEX;
      }

      return NextResponse.json({
        sellAmount: amountIn.toString(),
        buyAmount: buyAmount > BigInt(0) ? buyAmount.toString() : "0",
        price: "", // client will compute a formatted rate
        allowanceTarget: sellIsNative ? "" : routerAddress,
        transaction: {
          to: routerAddress,
          data,
          value,
          gas,
          gasPrice,
        },
      });
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
