// example.spec.ts
import { test, expect } from '@playwright/test';
import { processCaption } from '../legacyUrlHandler.ts'; // Playwright seems to require the .ts extension

test('processCaption: URL format #2001/12-31/felix.jpg', () => {
    const captions = [
        {
            original: undefined,
            expected: '',
        },
        {
            original: null,
            expected: '',
        },
        {
            original: '',
            expected: '',
        },
        {
            original: 'This is a control caption, no replacement happening',
            expected: 'This is a control caption, no replacement happening',
        },
        {
            original: 'This is a control caption, <a href="/2001">Foo</a> no replacement happening',
            expected: 'This is a control caption, <a href="/2001">Foo</a> no replacement happening',
        },
        {
            original: 'No replacement: <a href="http://tacocat.com/2001">Foo</a>',
            expected: 'No replacement: <a href="http://tacocat.com/2001">Foo</a>',
        },
        {
            original: 'This is a caption with <a href="#2001">#2001</a>',
            expected: 'This is a caption with <a href="/2001">#2001</a>',
        },
        {
            original: 'This is a caption with an extra slash <a href="#/2001">#2001</a>',
            expected: 'This is a caption with an extra slash <a href="/2001">#2001</a>',
        },
        {
            original: 'This is a caption with uppercase <A HREF="#2001">#2001</A>',
            expected: 'This is a caption with uppercase <A HREF="/2001">#2001</A>',
        },
        {
            original: "This is a caption with single quotes <a href='#2001'>#2001</a>",
            expected: "This is a caption with single quotes <a href='/2001'>#2001</a>",
        },
        {
            original: "This is a caption with whitespace and single quotes <a href ='#2001'>#2001</a>",
            expected: "This is a caption with whitespace and single quotes <a href ='/2001'>#2001</a>",
        },
        {
            original: 'This is a caption with whitespace <a  href= "#2001">#2001</a>',
            expected: 'This is a caption with whitespace <a  href= "/2001">#2001</a>',
        },
        {
            original: 'This is a caption with whitespace <a href="#2001" >#2001</a>',
            expected: 'This is a caption with whitespace <a href="/2001" >#2001</a>',
        },
        {
            original: 'This is a caption with whitespace <a href  =  " #2001 " >#2001</a>',
            expected: 'This is a caption with whitespace <a href  =  " /2001 " >#2001</a>',
        },
        {
            original: 'This is a caption with longer URL <a href="#2001/12-31/felix.jpg"> Felix </a>',
            expected: 'This is a caption with longer URL <a href="/2001/12-31/felix.jpg"> Felix </a>',
        },
        {
            original: 'Multiple items <a href="#2001">One</a> <a href="#2002">Two</a>',
            expected: 'Multiple items <a href="/2001">One</a> <a href="/2002">Two</a>',
        },
        {
            original: 'Even more items <a href="#2001">One</a> <a href="#2002">Two</a> <a href="#2003">Three</a>',
            expected: 'Even more items <a href="/2001">One</a> <a href="/2002">Two</a> <a href="/2003">Three</a>',
        },
    ];

    captions.forEach((caption) => {
        expect(processCaption(caption.original)).toBe(caption.expected);
    });
});
