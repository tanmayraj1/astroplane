"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function OnboardingHeader({
  step,
  label,
}: {
  step: 1 | 2 | 3;
  label: string;
}) {
  const router = useRouter();
  return (
    <div className="rise mb-7">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="pressable flex h-[38px] w-[38px] items-center justify-center rounded-full border border-line-btn bg-surface text-body"
        >
          <ArrowLeftIcon size={16} />
        </button>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-[5px] rounded-full transition-all duration-300",
                i === step ? "w-[22px] bg-gold" : "w-[10px] bg-line-btn",
                i < step && "bg-line-dot",
              )}
            />
          ))}
        </div>
        <span className="w-[38px]" />
      </div>
      <div className="eyebrow">
        {step} of 3 · {label}
      </div>
    </div>
  );
}
