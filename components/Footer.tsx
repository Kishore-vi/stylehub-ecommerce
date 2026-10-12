import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-neutral-950 px-5 py-10 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
        <Link href="/" className="text-2xl font-black tracking-tighter">
          STYLEHUB<span className="text-orange-500">.</span>
        </Link>
        <p className="text-center text-xs text-neutral-400">
          Your style. Your story. © 2026 STYLEHUB.
        </p>
        <Link
          href="/#collection"
          className="text-sm text-neutral-300 hover:text-white transition"
        >
          Shop now ↑
        </Link>
      </div>
    </footer>
  );
}
