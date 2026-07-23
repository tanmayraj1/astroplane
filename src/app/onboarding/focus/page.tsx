import { OnboardingHeader } from "@/components/onboarding/progress";
import { FocusForm } from "@/components/onboarding/focus-form";

export const metadata = { title: "Focus" };

export default function FocusPage() {
  return (
    <>
      <OnboardingHeader step={3} label="Focus" />
      <h1 className="rise d1 font-display text-[28px] font-bold leading-tight text-ink">
        What should your days lean toward?
      </h1>
      <p className="rise d2 mt-2 text-[13px] leading-relaxed text-body">
        This orders your Today screen — change it anytime in your profile.
      </p>
      <FocusForm />
    </>
  );
}
