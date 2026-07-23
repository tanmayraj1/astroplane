import { OnboardingHeader } from "@/components/onboarding/progress";
import { BirthForm } from "@/components/onboarding/birth-form";

export const metadata = { title: "Your sky" };

export default function BirthPage() {
  return (
    <>
      <OnboardingHeader step={1} label="Your sky" />
      <h1 className="rise d1 font-display text-[28px] font-bold leading-tight text-ink">
        Where the sky begins.
      </h1>
      <p className="rise d2 mt-2 text-[13px] leading-relaxed text-body">
        Your birth chart is cast from the exact moment and place you arrived.
      </p>
      <BirthForm />
    </>
  );
}
