export function match(param: string): boolean {
    return /^[^.]+\.[^.]+$/.test(param);
}
