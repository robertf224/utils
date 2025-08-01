# @bobbyfidz/crane

A TypeScript wrapper for the Crane container image manipulation tool, focused on the `mutate` command.

## Installation

```bash
npm install @bobbyfidz/crane
```

## Usage

### Basic Mutation

```typescript
import { Crane } from "@bobbyfidz/crane";

// Add labels and annotations to an image
await Crane.mutate("my-registry.com/my-image:v1", {
    labels: {
        app: "myapp",
        version: "1.0.0",
    },
    annotations: {
        "org.opencontainers.image.created": "2023-01-01T00:00:00Z",
        "org.opencontainers.image.version": "1.0.0",
    },
});
```

### Authentication

```typescript
await Crane.mutate("my-registry.com/my-image:v1", {
    username: "user",
    password: "pass",
    insecure: true, // Allow insecure registry connections
});
```

### Platform and Architecture

```typescript
await Crane.mutate("my-registry.com/my-image:v1", {
    platform: "linux/amd64", // Target platform
    setPlatform: "linux/arm64", // Set new platform
});
```

### Container Configuration

```typescript
await Crane.mutate("my-registry.com/my-image:v1", {
    entrypoint: ["/bin/sh", "-c"],
    cmd: ["echo", "hello"],
    workdir: "/app",
    user: "1000:1000",
    env: {
        NODE_ENV: "production",
        PORT: "3000",
    },
    ports: ["3000/tcp", "8080/tcp"],
});
```

### Output and Repository

```typescript
await Crane.mutate("my-registry.com/my-image:v1", {
    output: "/tmp/mutated-image.tar", // Save to file
    repo: "my-registry.com/mutated-image", // Push to new repo
    tag: "v2", // Apply new tag
});
```

### Advanced Options

```typescript
await Crane.mutate("my-registry.com/my-image:v1", {
    append: ["/path/to/layer1.tar", "/path/to/layer2.tar"], // Append tarballs
    allowNondistributableArtifacts: true, // Allow non-distributable layers
    verbose: true, // Enable debug logs
});
```

### Get Version

```typescript
const version = await Crane.version();
console.log(`Crane version: ${version}`);
```

## API Reference

### `mutate(reference: string, options?: MutateOptions): Promise<void>`

Mutates a container image using Crane.

#### Parameters

- `reference` (string): The image reference to mutate
- `options` (MutateOptions, optional): Mutation options

#### MutateOptions

```typescript
interface MutateOptions {
    /** Username for registry authentication */
    username?: string;
    /** Password for registry authentication */
    password?: string;
    /** Allow insecure registry connections */
    insecure?: boolean;
    /** Platform to target (e.g., linux/amd64) */
    platform?: string;
    /** Annotations to add to the image */
    annotations?: Record<string, string>;
    /** Labels to add to the image */
    labels?: Record<string, string>;
    /** Entrypoint to set */
    entrypoint?: string[];
    /** Command to set */
    cmd?: string[];
    /** Working directory to set */
    workdir?: string;
    /** User to set */
    user?: string;
    /** Environment variables to set */
    env?: Record<string, string>;
    /** Ports to expose */
    ports?: string[];
    /** Output file path */
    output?: string;
    /** Repository to push the mutated image to */
    repo?: string;
    /** New tag reference to apply to mutated image */
    tag?: string;
    /** Path to tarball to append to image */
    append?: string[];
    /** New platform to set in the form os/arch[/variant][:osversion] */
    setPlatform?: string;
    /** Allow pushing non-distributable (foreign) layers */
    allowNondistributableArtifacts?: boolean;
    /** Enable debug logs */
    verbose?: boolean;
}
```

### `version(): Promise<string>`

Returns the Crane version.

## License

MIT
