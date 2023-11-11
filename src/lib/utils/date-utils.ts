export function shortDate(d: Date): string {
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric' });
}

export function longDate(d: Date): string {
    return d.toLocaleString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export function year(seconds: number): string {
    const d = new Date(seconds * 1000);
    return '' + d.getFullYear();
}
