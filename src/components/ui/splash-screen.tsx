import Image from "next/image";

export function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/logo.png"
          alt="Zoan"
          width={80}
          height={80}
          className="animate-pulse"
          priority
        />
      </div>
    </div>
  );
}
