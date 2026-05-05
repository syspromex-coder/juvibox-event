import Link from "next/link";

type Props = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

export default function FAB({ href, label, icon }: Props) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="above-bottom-nav fixed right-4 z-30 mb-4 flex h-14 items-center gap-2 rounded-full bg-brand-600 px-5 text-white shadow-lg shadow-brand-600/30 transition active:scale-95 lg:hidden"
    >
      <span className="text-2xl leading-none" aria-hidden>
        {icon ?? "+"}
      </span>
      <span className="pr-1 text-sm font-semibold">{label}</span>
    </Link>
  );
}
