# @terajs/adapter-react

React interoperability adapter for mounting Terajs components inside React trees.

This package is for integration seams. Keep the core application model Terajs-native and use the adapter where React needs to host or compose Terajs UI.

## Installation

```bash
npm install @terajs/adapter-react @terajs/runtime @terajs/renderer-web @terajs/reactivity react react-dom
```

## Primary surface

- `TerajsWrapper`: mounts a Terajs component inside a React component tree
- `useTerajsResource(resource)`: mirrors a Terajs resource into React-friendly state and refresh helpers

## Usage

```tsx
import { TerajsWrapper } from "@terajs/adapter-react";
import Counter from "./Counter.tera";

export function App() {
  return (
    <TerajsWrapper
      component={Counter}
      props={{
        initialCount: 1,
        label: "Clicks"
      }}
    />
  );
}
```

## Bridging Terajs resources into React

```tsx
import { useTerajsResource } from "@terajs/adapter-react";
import { createResource } from "@terajs/runtime";

const profileResource = createResource(async () => ({ name: "Ada" }));

function ProfileCard() {
  const profile = useTerajsResource(profileResource);

  if (profile.loading) {
    return <p>Loading profile...</p>;
  }

  return (
    <div>
      <p>Name: {profile.data?.name}</p>
      <button onClick={() => profile.refetch()}>Refresh</button>
    </div>
  );
}
```

## Notes

- This adapter currently targets client-side mounting.
- Use it where React is the host framework, not as a reason to pull React concepts into Terajs core code.
- For full Terajs apps, the main entrypoint is still `@terajs/app`.
