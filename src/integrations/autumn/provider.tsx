import { AutumnProvider as AutumnBaseProvider } from "autumn-js/react";
import { type PropsWithChildren } from "react";

export function AutumnProvider({ children }: PropsWithChildren) {
  // Empty string = same origin, Autumn adds "/api/autumn" automatically
  return (
    <AutumnBaseProvider backendUrl="" includeCredentials={true}>
      {children}
    </AutumnBaseProvider>
  );
}

