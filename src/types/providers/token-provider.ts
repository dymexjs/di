import type { InjectionToken } from "../injection-token.type.ts";
import type { Provider } from "./provider.type.ts";

export interface TokenProvider<T> {
  useToken: InjectionToken<T>;
}

export function isTokenProvider<T>(
  provider: Provider<T>,
): provider is TokenProvider<T> {
  try {
    return "useToken" in provider;
  } catch {
    return false;
  }
}
