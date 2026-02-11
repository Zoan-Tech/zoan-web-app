"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { config } from "@/lib/config";

interface Props {
  children: React.ReactNode;
}

export function PrivyProvider({ children }: Props) {
  return (
    <PrivyProviderBase
      appId={config.privy.appId}
      config={{
        loginMethods: ["email"],
        appearance: {
          theme: "light",
          accentColor: "#27CEC5",
          logo: "/logo.png",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "off",
          },
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}
