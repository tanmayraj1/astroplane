export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh" style={{ background: "var(--grad-screen)" }}>
      <div className="mx-auto w-full max-w-[440px] px-6 pb-16 pt-14">{children}</div>
    </div>
  );
}
