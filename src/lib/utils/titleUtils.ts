export function toTitleFromFilename(filename: string): string {
    return filename
        .replace(/\.[^.]*$/, '') // remove extension
        .replace(/[-_]/g, ' ') // - and _ to space
        .replace(/\d[a-zA-Z]$/, '') // remove numbers like '1b'
        .replace(/\d/g, '') // remove every other number
        .replace(/(^\w{1})|(\s+\w{1})/g, (letter: string) => letter.toUpperCase()) // capitalize each word
        .trim(); // to handle files like image_1.jpg, which will have trailing spaces
}
