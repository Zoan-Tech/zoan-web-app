"use client";

import { Toaster } from "sonner";
import { PrivyProvider } from "./privy-provider";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "./auth-provider";
import { WalletProvider } from "./wallet-provider";

interface Props {
  children: React.ReactNode;
}

export function Providers({ children }: Props) {
  return (
    <QueryProvider>
      <PrivyProvider>
        <AuthProvider>
          <WalletProvider>
            {children}
            <Toaster position="top-center" richColors />
          </WalletProvider>
        </AuthProvider>
      </PrivyProvider>
    </QueryProvider>
  );
}
