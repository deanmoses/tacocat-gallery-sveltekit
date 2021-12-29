# Pages

Components that represent full pages of the Tacocat photo gallery site.  

## These are (almost) pure presentation components

These components don't maintain state themselves; they render exclusively based on their passed-in properties.  

However, they *do* assume some of the passed-in properties are Sveltekit stores.  That means they access those properties with Sveltekit's `${myProperty}` notation to make them reactive.  To use these components outside of Sveltekit you'd have to remove the `$`s so that the properties are accessed like `{myProperty}` .