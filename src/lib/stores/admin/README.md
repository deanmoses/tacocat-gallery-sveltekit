# Admin State Machines

This directory contains the admin-only state machines for the app's [Svelte](https://svelte.dev/) reactive data stores

The admin state machines are separated from the stores themselves to minimize blast radius.  
The unauthenticated guest functionality may retrieve from these stores (though I'm trying
to prevent that from happening in most cases), and I don't want to pull in the store mutator
logic as well, which would increase the size of the web app download for guest users.
