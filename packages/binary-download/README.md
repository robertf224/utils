# @bobbyfidz/binary-download

A shared utility for downloading and installing binary executables with automatic system detection.

## Features

- **Automatic System Detection**: Detects your platform (Linux, macOS, Windows) and architecture (x64, arm64)
- **Fetch-based Downloads**: Uses modern `fetch` API for downloads
- **Cross-Platform Support**: Works on Linux, macOS, and Windows
- **TypeScript Support**: Full TypeScript definitions included
- **Caching**: Stores binaries in a predictable cache location

## Installation

```bash
npm install @bobbyfidz/binary-download
```

## Usage

```typescript
import { BinaryDownload, detectSystemTarget } from "@bobbyfidz/binary-download";

// Get system information
const systemInfo = detectSystemTarget();

// Ensure binary is installed
const binaryPath = await BinaryDownload.ensureBinaryInstalled(
    "my-binary",
    "1.0.0",
    (systemInfo) => `https://example.com/my-binary-${systemInfo.platform}-${systemInfo.arch}.tar.gz`,
    (systemInfo) => "expected_hash_here"
);
```

## API Reference

### `detectSystemTarget()`

Returns system information for binary download.

**Returns:** SystemInfo

### `BinaryDownload.ensureBinaryInstalled(binaryName, version, downloadUrlBuilder, expectedHashBuilder)`

Ensures a binary is installed, downloading it if necessary.

**Parameters:**

- `binaryName` (string): Name of the binary executable
- `version` (string): Version of the binary
- `downloadUrlBuilder` (function): Function that takes SystemInfo and returns download URL
- `expectedHashBuilder` (function): Function that takes SystemInfo and returns expected hash

**Returns:** Promise<string> - Path to the installed binary

## System Support

- **Linux**: x64 and arm64
- **macOS**: Intel (x64) and Apple Silicon (arm64)
- **Windows**: x64 (arm64 support planned)

## License

MIT
