import { InjectionToken } from "../types";

export class TokenNotFoundError extends Error {
    constructor(token: InjectionToken) {
        super(`Token not found: "${token.toString()}"`);
    }
}