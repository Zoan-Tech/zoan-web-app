import { encodeFunctionData } from "viem";

const erc20TransferAbi = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export function encodeErc20Transfer(to: string, amount: bigint): string {
  return encodeFunctionData({
    abi: erc20TransferAbi,
    functionName: "transfer",
    args: [to as `0x${string}`, amount],
  });
}

/**
 * Parse a decimal amount string into a bigint with the given decimals.
 * E.g. parseTokenAmount("1.5", 18) => 1500000000000000000n
 * Uses string manipulation to avoid floating point precision issues.
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  const trimmed = amount.trim();
  if (!trimmed || trimmed === "0") return BigInt(0);

  const [whole, fraction = ""] = trimmed.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + paddedFraction);
}
