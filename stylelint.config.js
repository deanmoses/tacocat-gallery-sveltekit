/** @type {import('stylelint').Config} */
export default {
    extends: ['stylelint-config-standard'],
    overrides: [
        {
            files: ['**/*.svelte'],
            extends: ['stylelint-config-html/svelte'],
        },
    ],
    rules: {
        // Svelte's scoping escape hatch, not a real pseudo-class
        'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],

        // Class and keyframe names are camelCase here as often as kebab-case,
        // and a class name is shared with the markup that references it
        'selector-class-pattern': '^[a-z][a-zA-Z0-9]*(?:-[a-z0-9][a-zA-Z0-9]*)*$',
        'keyframes-name-pattern': '^[a-z][a-zA-Z0-9]*(?:-[a-z0-9][a-zA-Z0-9]*)*$',

        // min-width/max-width, rather than the range syntax the standard config
        // prefers, which needs a newer browser than the rest of the stylesheet
        'media-feature-range-notation': 'prefix',

        // Six digits throughout, so the year palettes read as one table
        'color-hex-length': 'long',

        // Keeps `currentColor` readable in the icon components
        'value-keyword-case': ['lower', { camelCaseSvgKeywords: true }],
    },
};
