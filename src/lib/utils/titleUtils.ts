export function toTitleFromFilename(filename: string): string {
    return filename
        .replace(/_/g, ' ') // _ to space
        .replace(/\.[^\.]*$/, '') // remove extension
        .replace(/\d/g, '') // remove numbers
        .replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase()) // capitalize each word
        .trim(); // to handle files like image_1.jpg, which will have trailing spaces
}
