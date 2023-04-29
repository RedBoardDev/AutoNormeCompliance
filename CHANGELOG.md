# Change Log

All notable changes to the "autonormecompliance" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.6] - 2023-04-30

### Added

- button 'CodingStyle' to use without the command palette

## [1.0.6] - 2023-04-30

### Changed

- split the extension.js file into 4 distinct files

### Added

- work for C and haskell workspace / langague
- ignore files specified in the .gitignore file

### Fixed

- C-01 code is get correctly now

## [1.0.5] - 2023-04-29

### Added

- icon for the extension
- activationEvents for .c file and C langague

### Changed

- move extension.js on src/

## [1.0.4] - 2023-04-29

### Added

- verification for docker on the computer
- README.md with to do list

## [1.0.3] - 2023-04-29

### Added

- add diagnostics for each line with a coding style error
- remove diagnostics when the line is modified

### Fixed

- create and remove the folder correctly

### Removed

- comment at the end of line when a coding style error was found

## [1.0.2] - 2023-04-29

### Added

- function to remove the datafolder

## [1.0.1] - 2023-04-29

### Fixed

- Install dockerode package

### Added

- Set line where coding style was found in comment

## [1.0.0] - 2023-04-29

### Added

- Initial release with basic coding style checking functionality
