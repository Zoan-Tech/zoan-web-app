"use client";

import { useFcm } from "@/hooks/use-fcm";

interface Props {
    children: React.ReactNode;
}

export function FcmProvider({ children }: Props) {
    useFcm();
    return <>{children}</>;
}
