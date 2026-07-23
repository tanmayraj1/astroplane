import { OnboardingHeader } from "@/components/onboarding/progress";
import { ChronotypeForm } from "@/components/onboarding/chronotype-form";

export const metadata = { title: "Chronotype" };

export default function ChronotypePage() {
  return (
    <>
      <OnboardingHeader step={2} label="Chronotype" />
      <h1 className="rise d1 font-display text-[28px] font-bold leading-tight text-ink">
        Left alone, when do you naturally wake?
      </h1>
      <p className="rise d2 mt-2 text-[13px] leading-relaxed text-body">
        Your wake and wind-down windows are built from this — then gently tuned
        by the sky.
      </p>
      <ChronotypeForm />
    </>
  );
}
