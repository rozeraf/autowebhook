# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-09-02

### Changed
- Refactored the ngrok tunnel startup logic to use the ngrok agent API for URL retrieval instead of parsing stdout. This provides a more robust and reliable way to get the tunnel URL.
- The entire project documentation (README, EXAMPLES) and source code comments have been translated from Russian to English.

### Fixed
- Corrected TypeScript errors related to `exactOptionalPropertyTypes` by adjusting type definitions for optional class properties.
- Fixed a timeout bug during startup where the ngrok URL was not found in time. The new API polling method resolves this.

### Added
- Comprehensive documentation in English, including `README.md` and `EXAMPLES.md`.
- CI/CD pipeline using GitHub Actions for automatic package publishing to npm.

## [1.0.0] - 2025-09-02

### Added
- Initial release of AutoWebhook.
- Automatic management of the ngrok tunnel.
- Health checker with configurable intervals.
- Automatic restart on tunnel failures.
- Support for multiple ngrok regions.
- Full TypeScript support with type definitions.
- Event-driven architecture for monitoring tunnel status.
- Graceful shutdown handling.