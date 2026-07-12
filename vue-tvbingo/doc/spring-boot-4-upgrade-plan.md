# Spring Boot 4.0 Upgrade Plan

Reference: [Spring Boot 4.0 Migration Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide)

## Overview

This document tracks the incremental upgrade of the TV Bingo backend from Spring Boot 3.5.x to Spring Boot 4.0. Each step is self-contained and can be implemented independently across sessions. Steps should generally be completed in order, but steps 5–7 can be parallelized.

**Current state:** Spring Boot `3.5.16`, Java 25, Spring Data JDBC, Liquibase, springdoc-openapi

## Pre-flight Checks

Before starting any step, verify the baseline is green:

```bash
./gradlew backendTest
```

After each step, run the same command to confirm nothing regressed.

---

## Step 1 — Add the Spring Boot Properties Migrator (diagnostic only)

**Status:** [ ] Not started

**Purpose:** Surfaces deprecated/renamed configuration property keys at runtime so they can be fixed before the hard cut to Boot 4.

### Changes

In [`spring-tvbingo/build.gradle`](../spring-tvbingo/build.gradle) `dependencies` block, add:

```groovy
runtimeOnly 'org.springframework.boot:spring-boot-properties-migrator'
```

### Verification

Start the app (`./gradlew bootRun`) and inspect the logs for lines like:

```
The use of configuration keys that are no longer supported was found in the environment
```

Fix any reported keys before proceeding. This dependency is **temporary** — remove it at the end of Step 8.

---

## Step 2 — Rename `spring-boot-starter-web`

**Status:** [ ] Not started

**Why:** `spring-boot-starter-web` is deprecated in Spring Boot 4. The explicit `spring-boot-starter-webmvc` artifact is the new canonical name.

### Changes

In [`spring-tvbingo/build.gradle`](../spring-tvbingo/build.gradle):

```groovy
// Before
implementation 'org.springframework.boot:spring-boot-starter-web'

// After
implementation 'org.springframework.boot:spring-boot-starter-webmvc'
```

### Verification

```bash
./gradlew backendBuild backendTest
```

---

## Step 3 — Switch Liquibase to its dedicated starter

**Status:** [ ] Not started

**Why:** Spring Boot 4 requires Liquibase to be pulled in through `spring-boot-starter-liquibase` rather than a bare `liquibase-core` dependency. The starter wires up auto-configuration correctly.

### Changes

In [`spring-tvbingo/build.gradle`](../spring-tvbingo/build.gradle):

```groovy
// Before
implementation 'org.liquibase:liquibase-core'

// After
implementation 'org.springframework.boot:spring-boot-starter-liquibase'
```

### Verification

```bash
./gradlew backendTest
```

Confirm that Liquibase migrations still run on test startup (check test logs for `Successfully applied N changeSet(s)`).

---

## Step 4 — Bump the Spring Boot Gradle plugin to 4.0

**Status:** [ ] Not started

**Why:** This is the core version bump. Steps 1–3 should be completed first so the rename and starter changes land cleanly before the plugin version changes.

### Pre-requisites

- Steps 1–3 complete and tests passing
- Third-party library compatibility confirmed (see Step 5)

### Changes

In [`spring-tvbingo/build.gradle`](../spring-tvbingo/build.gradle):

```groovy
// Before
id 'org.springframework.boot' version '3.5.16'

// After
id 'org.springframework.boot' version '4.0.x'   // replace x with latest 4.0 GA
```

Also check whether `io.spring.dependency-management` needs a version bump to correctly import the Spring Boot 4 BOM. Check the [plugin releases](https://github.com/spring-gradle-plugins/dependency-management-plugin/releases) for a compatible version.

### Verification

```bash
./gradlew backendBuild backendTest
```

Expect compilation errors related to Jackson and test infrastructure — those are addressed in Steps 6 and 7.

---

## Step 5 — Verify and update third-party library compatibility

**Status:** [ ] Not started

**Why:** Spring Boot 4 requires Spring Framework 7 and Jakarta EE 11. Third-party libraries that transitively depend on Spring must also support these versions.

### Libraries to check

| Library | Current version | Minimum compatible | Notes |
|---|---|---|---|
| `springdoc-openapi-starter-webmvc-ui` | `2.8.4` | TBD (likely `3.x`) | Check [springdoc releases](https://github.com/springdoc/springdoc-openapi/releases) for Spring Boot 4 support |
| `io.zonky.test:embedded-postgres` | `2.2.2` | TBD | Check [zonky releases](https://github.com/zonkyio/embedded-postgres/releases) |
| `io.zonky.test:embedded-database-spring-test` | `2.8.0` | TBD | Check [zonky spring test releases](https://github.com/zonkyio/embedded-database-spring-test/releases) |

### Changes

Update each library version in [`spring-tvbingo/build.gradle`](../spring-tvbingo/build.gradle) once compatible versions are confirmed.

### Verification

```bash
./gradlew backendBuild backendTest
```

If springdoc does not yet have a Spring Boot 4-compatible release at upgrade time, consider temporarily removing the dependency and re-adding it once available.

---

## Step 6 — Migrate Jackson 3 package names

**Status:** [ ] Not started

**Why:** Spring Boot 4 upgrades to **Jackson 3**, which changes both the Maven group IDs (`com.fasterxml.jackson` → `tools.jackson`) and Java package names. All source files that import Jackson classes must be updated.

### Files to update

All of these import `com.fasterxml.jackson.databind.ObjectMapper`:

- [`src/test/.../ConcurrentIntegrationTests.java`](../spring-tvbingo/src/test/java/org/bomartin/tvbingo/ConcurrentIntegrationTests.java)
- [`src/test/.../EdgeCaseTests.java`](../spring-tvbingo/src/test/java/org/bomartin/tvbingo/EdgeCaseTests.java)
- [`src/test/.../contract/ApiContractTest.java`](../spring-tvbingo/src/test/java/org/bomartin/tvbingo/contract/ApiContractTest.java)
- [`src/test/.../controller/ShowControllerIntegrationTest.java`](../spring-tvbingo/src/test/java/org/bomartin/tvbingo/controller/ShowControllerIntegrationTest.java)
- [`src/test/.../performance/PerformanceTests.java`](../spring-tvbingo/src/test/java/org/bomartin/tvbingo/performance/PerformanceTests.java)

### Changes

Replace Jackson imports throughout. The exact new package names depend on the Jackson 3 release — confirm against the [Jackson 3 migration notes](https://github.com/FasterXML/jackson) before making changes.

Known renames (verify against final release):
- `import com.fasterxml.jackson.databind.ObjectMapper` → `import tools.jackson.databind.ObjectMapper`
- `@JsonComponent` → `@JacksonComponent` (if used)

A project-wide find/replace via `sed` or IDE refactor is safe here since all usages are straightforward `ObjectMapper` instantiation for test serialization.

### Verification

```bash
./gradlew backendBuild
```

The build must compile without Jackson-related errors before running tests.

---

## Step 7 — Fix `@SpringBootTest` test infrastructure

**Status:** [ ] Not started

**Why:** Spring Boot 4 removes automatic `MockMvc`, `WebTestClient`, and `TestRestTemplate` injection from `@SpringBootTest`. Tests that rely on `@AutoConfigureMockMvc` with `@SpringBootTest` now need an explicit test starter.

### Option A — Add the new webmvc test starter (recommended, minimal code changes)

In [`spring-tvbingo/build.gradle`](../spring-tvbingo/build.gradle):

```groovy
testImplementation 'org.springframework.boot:spring-boot-starter-test-webmvc'
```

This restores the previous behavior and requires no changes to existing test classes.

### Option B — Migrate full-stack tests to `@WebMvcTest` (optional, faster tests)

Switch tests that only exercise the web layer to `@WebMvcTest` and mock the service layer with `@MockitoBean` (previously `@MockBean`). This is more work but produces faster, more focused tests. Consider this as a follow-up improvement rather than a blocker.

### Files affected by `@SpringBootTest` + `MockMvc`

- [`config/WebConfigTest.java`](../spring-tvbingo/src/test/java/org/bomartin/tvbingo/config/WebConfigTest.java)
- [`config/SpaWebConfigTest.java`](../spring-tvbingo/src/test/java/org/bomartin/tvbingo/config/SpaWebConfigTest.java)
- [`contract/ApiContractTest.java`](../spring-tvbingo/src/test/java/org/bomartin/tvbingo/contract/ApiContractTest.java)
- [`EdgeCaseTests.java`](../spring-tvbingo/src/test/java/org/bomartin/tvbingo/EdgeCaseTests.java)
- [`controller/ShowControllerIntegrationTest.java`](../spring-tvbingo/src/test/java/org/bomartin/tvbingo/controller/ShowControllerIntegrationTest.java)
- [`performance/PerformanceTests.java`](../spring-tvbingo/src/test/java/org/bomartin/tvbingo/performance/PerformanceTests.java)

### File affected by `TestRestTemplate`

- [`ConcurrentIntegrationTests.java`](../spring-tvbingo/src/test/java/org/bomartin/tvbingo/ConcurrentIntegrationTests.java) — already uses `@SpringBootTest(webEnvironment = RANDOM_PORT)` pattern; confirm `TestRestTemplate` is injected via `@Autowired` rather than auto-provided by the context.

### Verification

```bash
./gradlew backendTest
```

All tests must pass. Pay attention to any tests that previously passed silently because MockMvc was available — they may now fail to start.

---

## Step 8 — Final cleanup

**Status:** [ ] Not started

**Why:** Remove the temporary diagnostic dependency and do a final end-to-end check.

### Changes

Remove from [`spring-tvbingo/build.gradle`](../spring-tvbingo/build.gradle):

```groovy
// Delete this line:
runtimeOnly 'org.springframework.boot:spring-boot-properties-migrator'
```

### Verification

```bash
./gradlew ci
```

Full CI pipeline (build, test, lint, coverage, Sonar) must pass cleanly.

---

## Risk Summary

| Step | Effort | Risk | Notes |
|---|---|---|---|
| 1 — Properties migrator | Trivial | Low | Diagnostic only |
| 2 — Rename web starter | Trivial | Low | One-line change |
| 3 — Liquibase starter | Trivial | Low | One-line change |
| 4 — Bump Boot plugin | Low | Medium | Triggers downstream breaks caught by other steps |
| 5 — Third-party libraries | Low–Medium | **High** | Blocked on springdoc & zonky releasing SB4-compatible versions |
| 6 — Jackson 3 migration | Medium | **High** | Compiler-caught but touches many files; verify package names against Jackson 3 final release |
| 7 — Test infrastructure | Medium | Medium | Option A (new test starter) is low-risk; Option B is optional |
| 8 — Final cleanup | Trivial | Low | |

## Key Unknowns (resolve before Step 4)

1. **Jackson 3 final package names** — The exact Java package path changes in Jackson 3 must be confirmed against the Jackson 3 GA release before Step 6.
2. **springdoc-openapi Spring Boot 4 release** — As of the time this plan was written, verify whether a Boot 4-compatible version exists. If not, Step 4 must be deferred or springdoc temporarily removed.
3. **Zonky embedded-postgres Spring Boot 4 support** — Verify Boot 4 / Spring Framework 7 compatibility before Step 4.
