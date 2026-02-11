import Link from "next/link";
import Image from "next/image";

export function SidebarLogo() {
  return (
    <div className="mb-6">
      <Link href="/" className="flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="Zoan"
          width={48}
          height={48}
          className="h-12 w-12"
        />
      </Link>
    </div>
  );
}
