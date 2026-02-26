import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/clerk-react";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    // If user is already authenticated, redirect to dashboard
    // This will be checked client-side by the component
    void context;
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="text-center">
        <h1 className="mb-8 text-3xl font-bold text-white">
          MomentumTracker Admin
        </h1>
        <SignIn
          routing="hash"
          afterSignInUrl="/"
          signUpUrl={undefined}
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-gray-900 border border-gray-800",
            },
          }}
        />
      </div>
    </div>
  );
}
