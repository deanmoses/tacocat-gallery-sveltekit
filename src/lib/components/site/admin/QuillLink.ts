import Link from 'quill/formats/link';

/**
 * Quill rich text editor Link configuration class to prevent Quill from adding target="_blank" and rel="noopener noreferrer" to links.
 */
export class QuillLink extends Link {
    static override create(value: string) {
        const node = super.create(value);
        value = this.sanitize(value);
        node.setAttribute('href', value);
        node.removeAttribute('target');
        node.removeAttribute('rel');
        return node;
    }
}
