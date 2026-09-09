export function shortDate(d: Date): string {
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric' });
}

export function longDate(d: Date): string {
    return d.toLocaleString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}
