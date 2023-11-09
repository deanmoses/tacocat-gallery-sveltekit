//
// date utilities
//

export function shortDate(seconds: number): string {
    const month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    const d = new Date(seconds * 1000);
    const curr_day = d.getDate();
    const curr_month = d.getMonth();
    return month_names[curr_month] + ' ' + curr_day;
}

export function longDate(d: Date): string {
    const month_names = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];
    const curr_day = d.getDate();
    const curr_month = d.getMonth();
    const curr_year = d.getFullYear();
    return month_names[curr_month] + ' ' + curr_day + ', ' + curr_year;
}

export function year(seconds: number): string {
    const d = new Date(seconds * 1000);
    return '' + d.getFullYear();
}
