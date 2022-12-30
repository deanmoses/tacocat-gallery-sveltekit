// example.spec.ts
import { test, expect } from '@playwright/test';
import { processCaption } from '../legacyUrlHandler.ts'; // Playwright seems to require the .ts extension

test('processCaption: URL format #2001/12-31/felix.jpg', () => {
	const captions = [
		{
			original: undefined,
			expected: ''
		},
		{
			original: null,
			expected: ''
		},
		{
			original: '',
			expected: ''
		},
		{
			original: 'This is a control caption, no replacement happening',
			expected: 'This is a control caption, no replacement happening'
		},
		{
			original: 'This is a control caption, <a href="/2001">Foo</a> no replacement happening',
			expected: 'This is a control caption, <a href="/2001">Foo</a> no replacement happening'
		},
		{
			original: 'This is a caption with <a href="#2001">#2001</a>',
			expected: 'This is a caption with <a href="/2001">#2001</a>'
		},
		{
			original: 'This is a caption with <A HREF="#2001">#2001</A>',
			expected: 'This is a caption with <A HREF="/2001">#2001</A>'
		},
		{
			original: "This is a caption with <a href='#2001'>#2001</a>",
			expected: "This is a caption with <a href='/2001'>#2001</a>"
		},
		{
			original: "This is a caption with <a href ='#2001'>#2001</a>",
			expected: "This is a caption with <a href ='/2001'>#2001</a>"
		},
		{
			original: 'This is a caption with <a  href= "#2001">#2001</a>',
			expected: 'This is a caption with <a  href= "/2001">#2001</a>'
		},
		{
			original: 'This is a caption with <a href="#2001" >#2001</a>',
			expected: 'This is a caption with <a href="/2001" >#2001</a>'
		},
		{
			original: 'This is a caption with <a href  =  " #2001 " >#2001</a>',
			expected: 'This is a caption with <a href  =  " /2001 " >#2001</a>'
		},
		{
			original: 'This is a caption with <a href="#2001/12-31/felix.jpg"> Felix </a>',
			expected: 'This is a caption with <a href="/2001/12-31/felix.jpg"> Felix </a>'
		},
		{
			original: '<a href="#2001">One</a> <a href="#2002">Two</a>',
			expected: '<a href="/2001">One</a> <a href="/2002">Two</a>'
		},
		{
			original: '<a href="#2001">One</a> <a href="#2002">Two</a> <a href="#2003">Three</a>',
			expected: '<a href="/2001">One</a> <a href="/2002">Two</a> <a href="/2003">Three</a>'
		}
	];

	captions.forEach((caption) => {
		expect(processCaption(caption.original)).toBe(caption.expected);
	});
});
