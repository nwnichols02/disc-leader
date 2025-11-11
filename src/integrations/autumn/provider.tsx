import { AutumnProvider as AutumnBaseProvider } from "autumn-js/react";
import { type PropsWithChildren } from "react";

export function AutumnProvider({ children }: PropsWithChildren) {
  return (
    <AutumnBaseProvider backendUrl="/api/autumn">
      {children}
    </AutumnBaseProvider>
  );
}

