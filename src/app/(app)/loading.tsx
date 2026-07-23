import { SparkleIcon } from "@/components/icons";

export default function AppLoading() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <SparkleIcon size={22} className="breathe text-gold" />
        <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-faint">
          Reading the sky…
        </p>
      </div>
    </div>
  );
}
