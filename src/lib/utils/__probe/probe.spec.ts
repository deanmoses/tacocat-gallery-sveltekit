import { describe, it, expect, expectTypeOf } from 'vitest';

describe('probe', () => {
    it('types', () => {
        expect(typeof 'a').toBe('string');
        expect(typeof 1).toStrictEqual('number');
        expectTypeOf('a').toBeString();
    });
});
