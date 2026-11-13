import Image from "next/image";

interface FedooLogoProps {
  size?: "sm" | "md";
}

export default function FedooLogo({ size = "md" }: FedooLogoProps) {
  const dimensions =
    size === "sm"
      ? "h-7 w-[104px] sm:h-8 sm:w-[116px]"
      : "h-8 w-[116px] sm:h-9 sm:w-[128px]";

  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden select-none ${dimensions}`}
    >
      <Image
        src="/assets/aistudio/Fedoo_61c7f71d.png"
        alt="Fedoo"
        fill
        priority={size === "md"}
        sizes="160px"
        referrerPolicy="no-referrer"
        className="object-cover scale-[1.85] mix-blend-multiply"
      />
    </span>
  );
}
