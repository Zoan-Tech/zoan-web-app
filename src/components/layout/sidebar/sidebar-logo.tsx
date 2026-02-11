import Link from "next/link";
import Image from "next/image";

export function SidebarLogo() {
  return (
    <div className="px-4 py-4">
      <Link href="/" className="flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="Zoan"
          width={48}
          height={48}
          className="h-9 w-9"
        />
      </Link>
    </div>
  );
}
