import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/clerk-react";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    void context;
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface-0 overflow-hidden">
      {/* Background ambient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 text-center animate-in">
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 glow-accent">
            <MapPin className="h-7 w-7 text-accent" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-white">
              Momentum<span className="text-accent">Tracker</span>
            </h1>
            <p className="mt-2 text-sm text-white/30 font-body tracking-wide">
              Admin Control Center
            </p>
          </div>
        </div>

        <SignIn
          routing="hash"
          afterSignInUrl="/"
          signUpUrl={undefined}
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-surface-2/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/30 rounded-2xl",
              headerTitle: "font-display text-white",
              headerSubtitle: "text-white/40 font-body",
              socialButtonsBlockButton:
                "bg-surface-3 border-white/[0.08] text-white hover:bg-surface-4",
              formFieldLabel: "text-white/50 font-body",
              formFieldInput:
                "bg-surface-3 border-white/[0.08] text-white placeholder:text-white/20 font-body focus:border-accent/40 focus:ring-accent/20",
              footerActionLink: "text-accent hover:text-accent/80",
              formButtonPrimary:
                "bg-accent text-surface-0 hover:bg-accent/90 font-semibold",
            },
          }}
        />
      </div>
    </div>
  );
}
