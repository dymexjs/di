import { InjectionToken } from "../injection-token.type";
import { Provider } from "./provider.type";

export interface TokenProvider<T> {
  useToken: InjectionToken<T>;
}

export function isTokenProvider<T>(
  provider: Provider<T>,
): provider is TokenProvider<T> {
  try {
    return "useToken" in provider;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return false;
  }
}
