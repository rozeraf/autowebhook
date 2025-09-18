# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-09-05

### Changed
- **BREAKING CHANGE**: The package now publishes compiled JavaScript instead of raw TypeScript files. Source TypeScript files are no longer included in the npm package.
- Switched `moduleResolution` from `node` to `bundler` for better compatibility with modern build tools.
- Improved the CI/CD pipeline with matrix testing and automated GitHub releases.
- Refined package structure to exclude development files from the npm distribution.

### Added
- **Dual Module Support**: The package now includes both ESM (`index.js`) and CommonJS (`index.cjs`) builds for maximum compatibility.
- Comprehensive build scripts for TypeScript compilation and bundling.
- Enhanced GitHub Actions workflows with build verification and caching.
- Automated GitHub release creation with generated release notes.
- Support for npm provenance attestation for enhanced security.

### Fixed
- Resolved TypeScript compilation issues that arose with stricter compiler options.
- Corrected CI/CD pipeline failures caused by the `postpack` script during dry-run publishing.

## [2.2.0] - 2025-09-05

### Added
- Implemented a comprehensive CI/CD pipeline with GitHub Actions for automated testing, linting, and package publishing.
- Enabled stricter TypeScript compiler options for improved code quality.

### Changed
- Improved the project structure and build configuration.
- Updated package metadata to include repository information.
- Enhanced development scripts for a better developer experience (DX).

## [2.1.0] - 2025-09-05

### Added
- **Expanded ngrok Functionality**: Added support for more advanced ngrok features, including TCP tunnels (`proto: 'tcp'`), custom hostnames (`hostname`), IP whitelisting (`allow_cidr`), and password protection (`basic_auth`).

### Fixed
- Resolved a TypeScript error (`Object is possibly 'undefined'`) in the ngrok provider that could occur during tunnel URL retrieval.

## [2.0.0] - 2025-09-03

### Added
- **Multi-Tunnel Support**: Introduced the ability to configure and manage multiple tunnels simultaneously.

### Changed
- **BREAKING CHANGE**: The configuration was updated to use a `tunnels` array. The previous `providers` array for fallback has been removed.
- **Event-Driven Architecture**: Replaced specific callbacks (e.g., `onUrlChange`) with a more flexible event-based system (`tunnelReady`, `tunnelDown`) to better support multiple tunnels.

## [1.3.0] - 2025-09-03

### Added
- **Multi-Provider Support**: Introduced support for multiple tunnel providers, starting with `ngrok` and `localhost.run`.
- **Provider Fallback**: Implemented an automatic fallback mechanism to switch providers if the active one fails.

### Changed
- **Major Refactoring**: Refactored the core logic from being `ngrok`-specific to a more flexible, provider-based architecture.

## [1.2.0] - 2025-09-03

### Added
- **Expanded Debug Logs**: Added an `expanded` configuration flag to enable detailed logging for health checks.

## [1.1.0] - 2025-09-02

### Changed
- Refactored the ngrok tunnel startup logic to use the ngrok agent API instead of parsing stdout, making URL retrieval more reliable.
- Translated all project documentation (`README.md`, `EXAMPLES.md`) and source code comments from Russian to English.

### Added
- CI/CD pipeline using GitHub Actions for automated package publishing to npm.

### Fixed
- Corrected TypeScript errors related to `exactOptionalPropertyTypes` by adjusting type definitions.
- Resolved a startup timeout bug where the ngrok URL was not found in time.

## [1.0.0] - 2025-09-02

### Added
- **Initial Release**:
  - Automatic management of ngrok tunnels, including startup and graceful shutdown.
  - Health checker with configurable intervals and automatic restart on failure.
  - Support for multiple ngrok regions.
  - Event-driven API for monitoring tunnel status.
  - Full TypeScript support.
