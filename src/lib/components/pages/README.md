# Pages

Components that represent entire screens of the Tacocat photo gallery.

## These are (almost) pure presentation components

These components don't maintain state themselves; they render exclusively based on their passed-in properties.  

However, some of the passed-in properties *are* Sveltekit stores.  These properties are accessed with Sveltekit's `${myProperty}` notation to make them reactive.  To use these components outside of Sveltekit you'd have to remove the `$`s so that the properties are accessed like `{myProperty}` .