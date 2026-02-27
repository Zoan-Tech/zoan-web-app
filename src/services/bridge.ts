import { formatBalance } from "./token-balance";

/** Orbiter uses the standard EVM zero address for native tokens */
export const ORBITER_NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

/** EVM chain IDs that Orbiter Finance supports */
export const ORBITER_SUPPORTED_CHAIN_IDS = [
  1,     // Ethereum
  42161, // Arbitrum One
  10,    // Optimism
  8453,  // Base
  137,   // Polygon
  56,    // BNB Chain
  324,   // zkSync Era
  59144, // Linea
  534352, // Scroll
  169,   // Manta Pacific
  196,   // X Layer
  81457, // Blast
  34443, // Mode
  1101,  // Polygon zkEVM
];

export function isBridgeSupported(chainId: number): boolean {
  return ORBITER_SUPPORTED_CHAIN_IDS.includes(chainId);
}

export interface OrbiterChain {
  chainId: string;
  name: string;
  vm: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
    address: string;
  };
}

export interface BridgeQuoteStep {
  action: string;
  tx: {
    to: string;
    value: string;
    data: string;
  };
}

export interface BridgeFees {
  withholdingFee?: string;
  withholdingFeeUSD?: string;
  swapFee?: string;
  swapFeeUSD?: string;
  tradeFee?: string;
  tradeFeeUSD?: string;
}

export interface BridgeQuote {
  steps: BridgeQuoteStep[];
  details: {
    sourceAmount: string;
    destAmount: string;
    destAmountFormatted: string;
    exchangeRate?: string;
  };
  fees: BridgeFees;
}

export interface GetBridgeQuoteParams {
  sourceChainId: number;
  destChainId: number;
  sourceToken: string;
  destToken: string;
  amount: string;
  decimals?: number;
  userAddress: string;
  targetRecipient: string;
}

/** Convert a human-readable decimal string to its integer representation (wei). */
function parseUnits(amount: string, decimals: number): string {
  const [whole, frac = ""] = amount.split(".");
  const fracPadded = frac.padEnd(decimals, "0").slice(0, decimals);
  const base = BigInt(10) ** BigInt(decimals);
  return (BigInt(whole || "0") * base + BigInt(fracPadded || "0")).toString();
}

/**
 * Fetch supported chains from Orbiter Finance via our proxy.
 */
export async function getOrbiterChains(): Promise<OrbiterChain[]> {
  const response = await fetch("/api/bridge?action=chains");
  if (!response.ok) throw new Error("Failed to fetch Orbiter chains");

  const data = await response.json();
  // Orbiter returns { status: "success", result: [...] }
  if (data.result && Array.isArray(data.result)) {
    return data.result.filter((c: OrbiterChain) => c.vm === "EVM");
  }
  return [];
}

/**
 * Get a bridge quote from Orbiter Finance via our proxy.
 */
export async function getBridgeQuote(params: GetBridgeQuoteParams): Promise<BridgeQuote> {
  const {
    sourceChainId,
    destChainId,
    sourceToken,
    destToken,
    amount,
    decimals = 18,
    userAddress,
    targetRecipient,
  } = params;

  const amountWei = parseUnits(amount, decimals);

  const body = {
    sourceChainId: String(sourceChainId),
    destChainId: String(destChainId),
    sourceToken,
    destToken,
    amount: amountWei,
    userAddress,
    targetRecipient,
  };

  const response = await fetch("/api/bridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? "Bridge quote failed");
  }

  // Orbiter wraps response in { status, result }
  const result = data.result ?? data;

  const steps: BridgeQuoteStep[] = result.steps ?? [];
  const details = result.details ?? {};
  const fees = result.fees ?? {};

  const destDecimals: number = details.destToken?.decimals ?? 18;
  const destAmountRaw: string = details.destTokenAmount ?? "0";
  const destAmountFormatted = formatBalance(
    "0x" + BigInt(destAmountRaw).toString(16),
    destDecimals
  );

  return {
    steps,
    details: {
      sourceAmount: details.sourceTokenAmount ?? amount,
      destAmount: destAmountRaw,
      destAmountFormatted,
      exchangeRate: details.rate,
    },
    fees: {
      withholdingFee: fees.withholdingFee,
      withholdingFeeUSD: fees.withholdingFeeUSD,
      swapFee: fees.swapFee,
      swapFeeUSD: fees.swapFeeUSD,
      tradeFee: fees.tradeFee,
      tradeFeeUSD: fees.tradeFeeUSD,
    },
  };
}

/**
 * Calculate total bridge fee in USD.
 */
export function getTotalFeeUsd(fees: BridgeFees): number {
  const parse = (v?: string) => parseFloat(v ?? "0") || 0;
  return (
    parse(fees.withholdingFeeUSD) +
    parse(fees.swapFeeUSD) +
    parse(fees.tradeFeeUSD)
  );
}
