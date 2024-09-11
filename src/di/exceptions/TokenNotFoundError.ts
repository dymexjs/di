import { InjectionToken } from "../types/InjectionToken";

export class TokenNotFoundError extends Error {
    constructor(token: InjectionToken) {
        super(`Token not found: "${token.toString()}"`);
    }
}