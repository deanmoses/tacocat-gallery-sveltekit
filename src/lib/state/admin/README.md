# Admin State Machines

This directory contains the admin-only state machines for the app's [Svelte](https://svelte.dev/)-based reactive state management

The admin state machines are separated from the state objects themselves to minimize blast radius.  
The unauthenticated guest functionality may retrieve from these state objects (though we're trying
to prevent that from happening in most cases), and we don't want to pull in the state mutator
logic as well, which would increase the size of the web app download for guest users.
