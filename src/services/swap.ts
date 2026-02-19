import { encodeFunctionData } from "viem";
import { formatBalance } from "./token-balance";
import { parseTokenAmount } from "@/lib/wallet/erc20";

export const ZERO_X_SUPPORTED_CHAINS = [1, 137, 8453, 10, 42161, 56];

/** Placeholder address used by 0x to represent native ETH/BNB/MATIC */
export const NATIVE_TOKEN_ADDRESS =
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export interface SwapQuote {
  sellToken: string;
  buyToken: string;
  sellAmount: string;        // raw units (BigInt string)
  buyAmount: string;         // raw units (BigInt string)
  buyAmountFormatted: string; // human-readable
  price: string;             // buyToken per sellToken
  allowanceTarget: string;   // ERC20 spender to approve before swap
  transaction: {
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
  };
  estimatedGas: string;
}

export function isSwapSupported(chainId: number): boolean {
  return ZERO_X_SUPPORTED_CHAINS.includes(chainId);
}

/**
 * Fetch a swap quote from our Next.js API proxy (which calls 0x Protocol API v2).
 */
export async function getSwapQuote(params: {
  chainId: number;
  sellToken: string;    // "native" resolves to NATIVE_TOKEN_ADDRESS
  buyToken: string;
  sellAmountRaw: string; // already in raw units (BigInt string)
  taker: string;
  slippageBps: number;
  sellTokenDecimals: number;
  buyTokenDecimals: number;
}): Promise<SwapQuote> {
  const { chainId, sellToken, buyToken, sellAmountRaw, taker, slippageBps, sellTokenDecimals, buyTokenDecimals } = params;

  const sellAddress =
    sellToken === "native" ? NATIVE_TOKEN_ADDRESS : sellToken;
  const buyAddress =
    buyToken === "native" ? NATIVE_TOKEN_ADDRESS : buyToken;

  const url = new URL("/api/swap", window.location.origin);
  url.searchParams.set("chainId", String(chainId));
  url.searchParams.set("sellToken", sellAddress);
  url.searchParams.set("buyToken", buyAddress);
  url.searchParams.set("sellAmount", sellAmountRaw);
  url.searchParams.set("taker", taker);
  url.searchParams.set("slippageBps", String(slippageBps));

  const response = await fetch(url.toString());
  if (!response.ok) {
    const err = await response.json().catch(() => ({ reason: "Unknown error" }));
    throw new Error(err.reason ?? `Swap quote failed: ${response.status}`);
  }

  const data = await response.json();

  const buyAmountFormatted = formatBalance(
    "0x" + BigInt(data.buyAmount).toString(16),
    buyTokenDecimals
  );

  return {
    sellToken: sellAddress,
    buyToken: buyAddress,
    sellAmount: data.sellAmount,
    buyAmount: data.buyAmount,
    buyAmountFormatted,
    price: data.price ?? (
      data.buyAmount && data.sellAmount
        ? (Number(data.buyAmount) / 10 ** buyTokenDecimals / (Number(data.sellAmount) / 10 ** sellTokenDecimals)).toString()
        : ""
    ),
    allowanceTarget: data.issues?.allowance?.spender ?? data.allowanceTarget ?? "",
    transaction: data.transaction,
    estimatedGas: data.transaction?.gas ?? "0",
  };
}

const allowanceAbi = [
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

const approveAbi = [
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

/**
 * Check current ERC20 allowance via our RPC proxy.
 */
export async function checkAllowance(
  chainId: number,
  tokenAddress: string,
  owner: string,
  spender: string
): Promise<bigint> {
  const data = encodeFunctionData({
    abi: allowanceAbi,
    functionName: "allowance",
    args: [owner as `0x${string}`, spender as `0x${string}`],
  });

  const response = await fetch("/api/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chainId,
      method: "eth_call",
      params: [{ to: tokenAddress, data }, "latest"],
    }),
  });

  if (!response.ok) throw new Error("Failed to check allowance");

  const result = await response.json();
  const hex: string = result.result;
  if (!hex || hex === "0x") return BigInt(0);
  return BigInt(hex);
}

/**
 * Encode an ERC20 approve call (MAX_UINT256 for unlimited approval).
 */
export function encodeApproval(spender: string): string {
  return encodeFunctionData({
    abi: approveAbi,
    functionName: "approve",
    args: [spender as `0x${string}`, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")],
  });
}

/**
 * Parse a human-readable amount into raw units string, ready for 0x API.
 */
export function toSellAmountRaw(amount: string, decimals: number): string {
  return parseTokenAmount(amount, decimals).toString();
}
