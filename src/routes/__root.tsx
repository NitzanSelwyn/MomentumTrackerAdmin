import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { convex } from "../lib/convex";
import { CLERK_PUBLISHABLE_KEY } from "../lib/clerk";
import { Toaster } from "sonner";

function RootComponent() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Outlet />
        <Toaster
          position="bottom-right"
          richColors
          theme="dark"
          toastOptions={{
            className: "font-body",
          }}
        />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
