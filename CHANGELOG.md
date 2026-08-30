# Changelog

## [6.0.1](https://github.com/brandhaug/add-function-return-types/compare/add-function-return-types-v6.0.0...add-function-return-types-v6.0.1) (2026-08-30)


### Miscellaneous

* **deps:** bump @types/node from 26.2.0 to 26.3.0 ([#49](https://github.com/brandhaug/add-function-return-types/issues/49)) ([495b870](https://github.com/brandhaug/add-function-return-types/commit/495b8709580a1b3f20675aad8d45088b5183aff9))
* **deps:** bump @types/node from 26.3.0 to 26.4.0 ([#51](https://github.com/brandhaug/add-function-return-types/issues/51)) ([7395588](https://github.com/brandhaug/add-function-return-types/commit/7395588174adfecb0ad423a73038a19194687e03))
* **deps:** bump lint-staged from 17.3.0 to 17.4.1 ([#53](https://github.com/brandhaug/add-function-return-types/issues/53)) ([0f5962d](https://github.com/brandhaug/add-function-return-types/commit/0f5962d282353f4616ba3d0044dfbda32075e59d))
* **deps:** bump oxlint from 1.79.0 to 1.80.0 ([#44](https://github.com/brandhaug/add-function-return-types/issues/44)) ([81c8e03](https://github.com/brandhaug/add-function-return-types/commit/81c8e034ae7829c31248ddb774d41402d151a3a0))
* **deps:** bump ultracite from 7.10.6 to 7.10.7 ([#52](https://github.com/brandhaug/add-function-return-types/issues/52)) ([5de4449](https://github.com/brandhaug/add-function-return-types/commit/5de4449ce5285315a693f20b8367dcbb1b66b85d))
* enable strict oxlint rules and fix violations ([#47](https://github.com/brandhaug/add-function-return-types/issues/47)) ([9b560f2](https://github.com/brandhaug/add-function-return-types/commit/9b560f2314bb2de76ce89a54246098a6ffe1a847))
* remove dead code and unused dependencies surfaced by fallow ([#56](https://github.com/brandhaug/add-function-return-types/issues/56)) ([248a127](https://github.com/brandhaug/add-function-return-types/commit/248a1272c11ff26bfc70e1bbd27bd9deecd77fb3))

## [6.0.0](https://github.com/brandhaug/add-function-return-types/compare/add-function-return-types-v5.0.0...add-function-return-types-v6.0.0) (2026-08-27)


### ⚠ BREAKING CHANGES

* never emit any return types by default ([#32](https://github.com/brandhaug/add-function-return-types/issues/32))
* replace commander with @clack/prompts ([#24](https://github.com/brandhaug/add-function-return-types/issues/24))
* rename arguments
* remove broken args

### Features

* add dependencies from package.json ([e0b0c15](https://github.com/brandhaug/add-function-return-types/commit/e0b0c152b8682cce8f67b2111dd54040226f1089))
* add imports for named types referenced by inferred return types ([#37](https://github.com/brandhaug/add-function-return-types/issues/37)) ([5866701](https://github.com/brandhaug/add-function-return-types/commit/5866701f031482dca72bcd251816b84d0722f2cc))
* add optional path argument, restructure for test efficiency, add parcel bundling ([24da778](https://github.com/brandhaug/add-function-return-types/commit/24da778f4d8b7f969dc549d19c542fe8a2b137de))
* add options based on explicit-function-return-type ([4bb91ff](https://github.com/brandhaug/add-function-return-types/commit/4bb91ff1c370cbbb7db486fd620f48e6a7cb726a))
* bundle optimization ([18bd145](https://github.com/brandhaug/add-function-return-types/commit/18bd145b2ec0d6b415b2f44987fd24d44d22a093))
* **cli:** ignore generated codegen output by default, add --include-generated flag ([#38](https://github.com/brandhaug/add-function-return-types/issues/38)) ([293698d](https://github.com/brandhaug/add-function-return-types/commit/293698dbf0309a776157388fdb0fdcd5a3b1f49b))
* extract complex inferred return types into named exported aliases ([#35](https://github.com/brandhaug/add-function-return-types/issues/35)) ([3f9b5ba](https://github.com/brandhaug/add-function-return-types/commit/3f9b5ba3c853bedf58d6b3314f8523df1d5ae168))
* force release ([8cbfa06](https://github.com/brandhaug/add-function-return-types/commit/8cbfa060e36599a66d92624607b3a3d903baff3a))
* **format:** format modified files with the project's formatter ([#36](https://github.com/brandhaug/add-function-return-types/issues/36)) ([ab35cbe](https://github.com/brandhaug/add-function-return-types/commit/ab35cbe4e0a1fe255992b9d2fcb020672b0e2535))
* ignore iifes ([0cb7a45](https://github.com/brandhaug/add-function-return-types/commit/0cb7a45246c2145fd4962b35fc7839181fb1db50))
* ignoreAnonymousFunctions ([7c30a4c](https://github.com/brandhaug/add-function-return-types/commit/7c30a4cf28d18a8306881eeae6e98a3568137df0))
* ignoreAnonymousObjectTypes ([44c5e55](https://github.com/brandhaug/add-function-return-types/commit/44c5e556c2ef1101cfd4fe7e7c85f369de9f5b97))
* ignoreUnknownType and ignoreAnyType ([7fdd42f](https://github.com/brandhaug/add-function-return-types/commit/7fdd42f0c86a547c4aa081c73acc4dff90564d86))
* improve progress logging ([fc75dd9](https://github.com/brandhaug/add-function-return-types/commit/fc75dd95876014d5248d2ad1e596195920c129b4))
* lint and formatting ([ebb39be](https://github.com/brandhaug/add-function-return-types/commit/ebb39be9e09279f029b3e5a241dfcf3c99a37c1b))
* migrate to oxlint/oxfmt, add dry-run and tsconfig options ([#8](https://github.com/brandhaug/add-function-return-types/issues/8)) ([9b73b89](https://github.com/brandhaug/add-function-return-types/commit/9b73b89b553c70e67ed0ed93b9ba2a6537f9deab))
* never emit any return types by default ([#32](https://github.com/brandhaug/add-function-return-types/issues/32)) ([01db964](https://github.com/brandhaug/add-function-return-types/commit/01db964d4d3348c734d21e1a4ada509605b55a87))
* overwrite existing return types option ([ca93358](https://github.com/brandhaug/add-function-return-types/commit/ca93358301c9cf6db9da9c4591be25d9d2e74c3a))
* prefer nested return types over anonymous types ([7b0196d](https://github.com/brandhaug/add-function-return-types/commit/7b0196d9dcddb5b08bf0c99d9bee1ccd759f0170))
* remove broken args ([7d0838b](https://github.com/brandhaug/add-function-return-types/commit/7d0838b29b940ab0e1c0ad494cd341c87ca0aeb4))
* remove concurrency option as it has no performance impact ([7fe0991](https://github.com/brandhaug/add-function-return-types/commit/7fe099139c978d98772a7866b1514a4387dc1302))
* replace commander with @clack/prompts ([#24](https://github.com/brandhaug/add-function-return-types/issues/24)) ([f7de92b](https://github.com/brandhaug/add-function-return-types/commit/f7de92b14c3c078f78fef837490f742a0fb8fa51))
* skip function expressions whose type is fixed by context ([#33](https://github.com/brandhaug/add-function-return-types/issues/33)) ([d2dd622](https://github.com/brandhaug/add-function-return-types/commit/d2dd62275601272896c03acc5dbf0fa078b3fd76))
* **stats:** add summary statistics and --json flag ([#34](https://github.com/brandhaug/add-function-return-types/issues/34)) ([d72cccf](https://github.com/brandhaug/add-function-return-types/commit/d72cccf3da2d65386200ce3b45763d396e288f54))
* **verify:** add post-run tsc verification with auto-revert of broken files ([#40](https://github.com/brandhaug/add-function-return-types/issues/40)) ([f141644](https://github.com/brandhaug/add-function-return-types/commit/f14164428b387e07365ceb16abb24812a8e61836))


### Bug Fixes

* add missing @types/node and define EntryInternal type ([#10](https://github.com/brandhaug/add-function-return-types/issues/10)) ([e01da78](https://github.com/brandhaug/add-function-return-types/commit/e01da784510b772a4a27a5ad3a7ec109912822ba))
* **cli:** strict argument parsing and graceful cancellation ([#29](https://github.com/brandhaug/add-function-return-types/issues/29)) ([b6e158a](https://github.com/brandhaug/add-function-return-types/commit/b6e158a1e71357f7959ede770f0456e373ff0cd6))
* esm bundle resolution ([#5](https://github.com/brandhaug/add-function-return-types/issues/5)) ([210ca4a](https://github.com/brandhaug/add-function-return-types/commit/210ca4ae6098c31446f7933af065c43ad22f3421))
* handle nested any, unknown, and anonymous objec types ([5be0c39](https://github.com/brandhaug/add-function-return-types/commit/5be0c390cdffc51a444dc776ec200b56c6ec9bed))
* ignore CHANGELOG.md in oxfmt and apply outstanding formatting ([#27](https://github.com/brandhaug/add-function-return-types/issues/27)) ([73c6772](https://github.com/brandhaug/add-function-return-types/commit/73c677213ee4dd9d91ebe2cf084f90526a371b17))
* missing dependency ([d73852d](https://github.com/brandhaug/add-function-return-types/commit/d73852dc68572f811601c10e20af279ea9d191ba))
* only build src ([1152d8e](https://github.com/brandhaug/add-function-return-types/commit/1152d8ed1872c78ca543129e08e8c3eb01646e89))
* progress logging ([d6923d3](https://github.com/brandhaug/add-function-return-types/commit/d6923d3203ade2f18953736bee647392738d6b39))
* semantic release ([37ae875](https://github.com/brandhaug/add-function-return-types/commit/37ae875e970f04c78b2b5aa972b75122a68428bc))
* set package version to match latest npm release ([#7](https://github.com/brandhaug/add-function-return-types/issues/7)) ([8f13c0a](https://github.com/brandhaug/add-function-return-types/commit/8f13c0a8f40d45c8275b6c28e22c6a913d107edc))
* strict null checks ([1b588a4](https://github.com/brandhaug/add-function-return-types/commit/1b588a461c44c3e9065a6a897807b9fc77835930))
* tmp dir access in gha ([3acbe0f](https://github.com/brandhaug/add-function-return-types/commit/3acbe0f3fab620bec9a257ecbc6ffb1be82d2620))
* treat arrow functions in property declarations and assignments as non-anonymous ([#1](https://github.com/brandhaug/add-function-return-types/issues/1)) ([811a9a0](https://github.com/brandhaug/add-function-return-types/commit/811a9a06b6d965854768004ab1ec8ac9ca4c006b))


### Performance Improvements

* parallelize runs with a bounded worker pool and add incremental cache ([#31](https://github.com/brandhaug/add-function-return-types/issues/31)) ([f418541](https://github.com/brandhaug/add-function-return-types/commit/f418541a54021daa5623ea1cae7d1f61d3109365))


### Miscellaneous

* add commitlint hook ([d5217fa](https://github.com/brandhaug/add-function-return-types/commit/d5217fa7f464f199fe89e9d9414e581118273507))
* add e2e test ([c390032](https://github.com/brandhaug/add-function-return-types/commit/c390032fdead4b6356bf46c1c31c03085808aa7a))
* align tooling with canonical setup ([#45](https://github.com/brandhaug/add-function-return-types/issues/45)) ([1377b3d](https://github.com/brandhaug/add-function-return-types/commit/1377b3df3f8f4b23ba949f2185a6827495c2e449))
* bump deps ([3413c79](https://github.com/brandhaug/add-function-return-types/commit/3413c79ca760ab588f001a2991c9abe6331af9c2))
* bump major version ([99c54af](https://github.com/brandhaug/add-function-return-types/commit/99c54af5e7f63fb9e2d7fa8d691b65803737ab87))
* **deps:** bump @types/node from 25.5.2 to 26.2.0 ([#15](https://github.com/brandhaug/add-function-return-types/issues/15)) ([a7a3ea6](https://github.com/brandhaug/add-function-return-types/commit/a7a3ea6664e0edacfb4bbbf133689e67df3b4a7f))
* **deps:** bump commander from 14.0.0 to 15.0.0 ([#13](https://github.com/brandhaug/add-function-return-types/issues/13)) ([bafcba4](https://github.com/brandhaug/add-function-return-types/commit/bafcba4f59d3654a450a3b3b20d33930c93c7004))
* **deps:** bump execa from 9.6.0 to 10.0.1 ([#16](https://github.com/brandhaug/add-function-return-types/issues/16)) ([232e8c0](https://github.com/brandhaug/add-function-return-types/commit/232e8c0f3466f94c595a058245ce8a26d9b88ca2))
* **deps:** bump oxfmt from 0.44.0 to 0.64.0 ([#17](https://github.com/brandhaug/add-function-return-types/issues/17)) ([11b130f](https://github.com/brandhaug/add-function-return-types/commit/11b130fafe8b3c5c447be2e12258760f4ec70e59))
* **deps:** bump oxfmt from 0.64.0 to 0.65.0 ([#43](https://github.com/brandhaug/add-function-return-types/issues/43)) ([08128cc](https://github.com/brandhaug/add-function-return-types/commit/08128ccd9d49428217e17fff7b84bd34159815d2))
* **deps:** bump oxlint from 1.59.0 to 1.79.0 ([#18](https://github.com/brandhaug/add-function-return-types/issues/18)) ([745b8e9](https://github.com/brandhaug/add-function-return-types/commit/745b8e946cc52bab929f6e099722d74c4e45f1b7))
* **deps:** bump oxlint-tsgolint from 0.20.0 to 7.0.2001 ([#19](https://github.com/brandhaug/add-function-return-types/issues/19)) ([e423d01](https://github.com/brandhaug/add-function-return-types/commit/e423d016307fd69b8e9fabb0b99f44fe0cecbd79))
* **deps:** bump ts-morph from 26.0.0 to 28.0.0 ([#14](https://github.com/brandhaug/add-function-return-types/issues/14)) ([997d371](https://github.com/brandhaug/add-function-return-types/commit/997d371dc5ba48faf902cbcc1096d6e8977b7acc))
* **deps:** bump tsx from 4.20.3 to 4.23.12 ([#20](https://github.com/brandhaug/add-function-return-types/issues/20)) ([d5c3417](https://github.com/brandhaug/add-function-return-types/commit/d5c3417b5524a15fb99fd3ed4bdde0f10c0114ae))
* **deps:** bump typescript from 5.9.2 to 7.0.2 ([#21](https://github.com/brandhaug/add-function-return-types/issues/21)) ([e728e66](https://github.com/brandhaug/add-function-return-types/commit/e728e6648116847afe1e8dc131a74feb65e067b8))
* **deps:** bump vitest from 3.2.4 to 4.1.11 ([#22](https://github.com/brandhaug/add-function-return-types/issues/22)) ([e6798d2](https://github.com/brandhaug/add-function-return-types/commit/e6798d20e71eb987eb26090593a8d850a166b413))
* improve testing ([851b4ef](https://github.com/brandhaug/add-function-return-types/commit/851b4efad34f9d3d63fec571abbb1d4c9a6decf9))
* improve tests ([d65baf5](https://github.com/brandhaug/add-function-return-types/commit/d65baf55bdf37c94200a804cc6652e3e661b01c1))
* include tests in typecheck ([f8711cd](https://github.com/brandhaug/add-function-return-types/commit/f8711cd4b69662c3bfd2931cfda95ff9aa4a1496))
* **master:** release 3.7.0 ([#9](https://github.com/brandhaug/add-function-return-types/issues/9)) ([c30188a](https://github.com/brandhaug/add-function-return-types/commit/c30188a32fcc2033fc0feb7e1df032ef31e883f1))
* **master:** release 3.7.1 ([#11](https://github.com/brandhaug/add-function-return-types/issues/11)) ([65dcaf3](https://github.com/brandhaug/add-function-return-types/commit/65dcaf34267bc6625a5866cc8405280d6dc55ddd))
* **master:** release 4.0.0 ([#25](https://github.com/brandhaug/add-function-return-types/issues/25)) ([5f3da01](https://github.com/brandhaug/add-function-return-types/commit/5f3da01a5a4f80e0c4fc410e4fb29708c6a31c2b))
* **master:** release 4.0.1 ([#28](https://github.com/brandhaug/add-function-return-types/issues/28)) ([adaa4ef](https://github.com/brandhaug/add-function-return-types/commit/adaa4ef2fc5e556cca69500bc4d79a2fa266782d))
* **master:** release 5.0.0 ([#39](https://github.com/brandhaug/add-function-return-types/issues/39)) ([8725be3](https://github.com/brandhaug/add-function-return-types/commit/8725be35d1d98141afade905b9a4f7086f459b56))
* no bundling ([f90e3b0](https://github.com/brandhaug/add-function-return-types/commit/f90e3b0ecd7f6c89c87e5ed68c25fdeb676bb97f))
* release v0.0.1 ([ee5afab](https://github.com/brandhaug/add-function-return-types/commit/ee5afab977aad1c203b891d3f55b466ce7f22a36))
* release v3.6.2 ([ec7bfa3](https://github.com/brandhaug/add-function-return-types/commit/ec7bfa32c988d398bb7a23f04dc0da0e1be1feaa))
* remove unnecessary console log ([87d000c](https://github.com/brandhaug/add-function-return-types/commit/87d000c154e8f805ae96947eefaf518afc091c58))
* remove unused dependencies ([52b6c31](https://github.com/brandhaug/add-function-return-types/commit/52b6c315803327798a4dd8fdc253078687e6b349))
* reordering of options ([83f9f3e](https://github.com/brandhaug/add-function-return-types/commit/83f9f3e77436d23306aaaa63e80372002076ab66))
* set save-exact in npmrc ([f27af51](https://github.com/brandhaug/add-function-return-types/commit/f27af5145bc19bec8a0afef9ae07de756ab21ab1))
* strict lint config, review fixes, and docs sync ([#42](https://github.com/brandhaug/add-function-return-types/issues/42)) ([38b4c97](https://github.com/brandhaug/add-function-return-types/commit/38b4c97947d3fbcb6237e31bf202e28094f9eae6))
* update deps ([246655c](https://github.com/brandhaug/add-function-return-types/commit/246655c29ca41a020c723636bdafea9dbc4001ed))


### Code Refactoring

* clean up ([#3](https://github.com/brandhaug/add-function-return-types/issues/3)) ([8abdb25](https://github.com/brandhaug/add-function-return-types/commit/8abdb250b1126679acdb0a9e1ccdc2af9361c17d))
* rename arguments ([34cfb92](https://github.com/brandhaug/add-function-return-types/commit/34cfb920969d7326c704448a25917981465912af))
* simplify code ([30a3c52](https://github.com/brandhaug/add-function-return-types/commit/30a3c526ae14a7564cbcb60a48417a471ebb59db))

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
