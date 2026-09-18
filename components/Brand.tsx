import Link from "next/link";
import Image from "next/image";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Yash Laser home">
      <Image
        className="brand-logo"
        src="/brand/yash-laser-logo.jpg"
        alt="Yash Laser — Since 1997"
        width={2100}
        height={2100}
        sizes="64px"
      />
      <span className="brand-words">
        YASH LASER<small>PERSONAL BY DESIGN</small>
      </span>
    </Link>
  );
}
