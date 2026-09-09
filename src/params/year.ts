export function match(param: string): boolean {
    return /^\d\d\d\d$/.test(param);
}
