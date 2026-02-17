"use client";

import { Toaster } from "sonner";
import { PrivyProvider } from "./privy-provider";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "./auth-provider";
import { WalletProvider } from "./wallet-provider";
import { FcmProvider } from "./fcm-provider";

interface Props {
  children: React.ReactNode;
}

export function Providers({ children }: Props) {
  return (
    <QueryProvider>
      <PrivyProvider>
        <AuthProvider>
          <WalletProvider>
            <FcmProvider>
              {children}
            </FcmProvider>
            <Toaster position="bottom-right" richColors />
          </WalletProvider>
        </AuthProvider>
      </PrivyProvider>
    </QueryProvider>
  );
}

