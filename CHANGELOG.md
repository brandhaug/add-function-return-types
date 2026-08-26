# Changelog

## [5.0.0](https://github.com/brandhaug/add-function-return-types/compare/v4.0.1...v5.0.0) (2026-08-26)


### ⚠ BREAKING CHANGES

* never emit any return types by default ([#32](https://github.com/brandhaug/add-function-return-types/issues/32))

### Features

* add imports for named types referenced by inferred return types ([#37](https://github.com/brandhaug/add-function-return-types/issues/37)) ([5866701](https://github.com/brandhaug/add-function-return-types/commit/5866701f031482dca72bcd251816b84d0722f2cc))
* **cli:** ignore generated codegen output by default, add --include-generated flag ([#38](https://github.com/brandhaug/add-function-return-types/issues/38)) ([293698d](https://github.com/brandhaug/add-function-return-types/commit/293698dbf0309a776157388fdb0fdcd5a3b1f49b))
* extract complex inferred return types into named exported aliases ([#35](https://github.com/brandhaug/add-function-return-types/issues/35)) ([3f9b5ba](https://github.com/brandhaug/add-function-return-types/commit/3f9b5ba3c853bedf58d6b3314f8523df1d5ae168))
* **format:** format modified files with the project's formatter ([#36](https://github.com/brandhaug/add-function-return-types/issues/36)) ([ab35cbe](https://github.com/brandhaug/add-function-return-types/commit/ab35cbe4e0a1fe255992b9d2fcb020672b0e2535))
* never emit any return types by default ([#32](https://github.com/brandhaug/add-function-return-types/issues/32)) ([01db964](https://github.com/brandhaug/add-function-return-types/commit/01db964d4d3348c734d21e1a4ada509605b55a87))
* skip function expressions whose type is fixed by context ([#33](https://github.com/brandhaug/add-function-return-types/issues/33)) ([d2dd622](https://github.com/brandhaug/add-function-return-types/commit/d2dd62275601272896c03acc5dbf0fa078b3fd76))
* **stats:** add summary statistics and --json flag ([#34](https://github.com/brandhaug/add-function-return-types/issues/34)) ([d72cccf](https://github.com/brandhaug/add-function-return-types/commit/d72cccf3da2d65386200ce3b45763d396e288f54))
* **verify:** add post-run tsc verification with auto-revert of broken files ([#40](https://github.com/brandhaug/add-function-return-types/issues/40)) ([f141644](https://github.com/brandhaug/add-function-return-types/commit/f14164428b387e07365ceb16abb24812a8e61836))


### Performance Improvements

* parallelize runs with a bounded worker pool and add incremental cache ([#31](https://github.com/brandhaug/add-function-return-types/issues/31)) ([f418541](https://github.com/brandhaug/add-function-return-types/commit/f418541a54021daa5623ea1cae7d1f61d3109365))

## [4.0.1](https://github.com/brandhaug/add-function-return-types/compare/v4.0.0...v4.0.1) (2026-08-23)


### Bug Fixes

* **cli:** strict argument parsing and graceful cancellation ([#29](https://github.com/brandhaug/add-function-return-types/issues/29)) ([b6e158a](https://github.com/brandhaug/add-function-return-types/commit/b6e158a1e71357f7959ede770f0456e373ff0cd6))
* ignore CHANGELOG.md in oxfmt and apply outstanding formatting ([#27](https://github.com/brandhaug/add-function-return-types/issues/27)) ([73c6772](https://github.com/brandhaug/add-function-return-types/commit/73c677213ee4dd9d91ebe2cf084f90526a371b17))

## [4.0.0](https://github.com/brandhaug/add-function-return-types/compare/v3.7.1...v4.0.0) (2026-08-22)


### ⚠ BREAKING CHANGES

* replace commander with @clack/prompts ([#24](https://github.com/brandhaug/add-function-return-types/issues/24))

### Features

* replace commander with @clack/prompts ([#24](https://github.com/brandhaug/add-function-return-types/issues/24)) ([f7de92b](https://github.com/brandhaug/add-function-return-types/commit/f7de92b14c3c078f78fef837490f742a0fb8fa51))

## [3.7.1](https://github.com/brandhaug/add-function-return-types/compare/v3.7.0...v3.7.1) (2026-04-09)

### Bug Fixes

- add missing @types/node and define EntryInternal type ([#10](https://github.com/brandhaug/add-function-return-types/issues/10)) ([e01da78](https://github.com/brandhaug/add-function-return-types/commit/e01da784510b772a4a27a5ad3a7ec109912822ba))

## [3.7.0](https://github.com/brandhaug/add-function-return-types/compare/v3.6.2...v3.7.0) (2026-04-09)

### Features

- migrate to oxlint/oxfmt, add dry-run and tsconfig options ([#8](https://github.com/brandhaug/add-function-return-types/issues/8)) ([9b73b89](https://github.com/brandhaug/add-function-return-types/commit/9b73b89b553c70e67ed0ed93b9ba2a6537f9deab))
