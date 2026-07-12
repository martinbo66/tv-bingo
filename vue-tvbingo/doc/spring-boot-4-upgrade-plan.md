# Spring Boot 4.0 Upgrade Plan

Reference: [Spring Boot 4.0 Migration Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide)

## Overview

This document tracks the incremental upgrade of the TV Bingo backend from Spring Boot 3.5.x to Spring Boot 4.0. Each step is self-contained and can be implemented independently across sessions. Steps should generally be completed in order, but steps 5–7 can be parallelized.

**Current state:** Spring Boot `4.0.7`, Java 25, Spring Data JDBC, Liquibase, springdoc-openapi  
**All steps complete.** Running on Spring Boot 4.0.7.

## Pre-flight Checks

Before starting any step, verify the baseline is green:

```bash
./gradlew backendTest
```

After each step, run the same command to confirm nothing regressed.

---

## Step 1 — Add the Spring Boot Properties Migrator (diagnostic only)

**Status:** [x] Complete

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

**Status:** [x] Complete

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

**Status:** [x] Complete

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

**Status:** [x] Complete — upgraded to `4.0.7`, `io.spring.dependency-management` bumped to `1.1.7`

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

**Status:** [x] Complete

**Why:** Spring Boot 4 requires Spring Framework 7 and Jakarta EE 11. Third-party libraries that transitively depend on Spring must also support these versions.

### Outcomes

| Library | Before | After | Notes |
|---|---|---|---|
| `springdoc-openapi-starter-webmvc-ui` | `2.8.4` | `3.0.3` | v3.x targets Spring Boot 4; same artifact name |
| `io.zonky.test:embedded-postgres` | `2.2.2` | unchanged | No Spring dependency; no change needed |
| `io.zonky.test:embedded-database-spring-test` | `2.8.0` | unchanged | Already at latest; Boot 4 compat added in v2.7.0 |

---

## Step 6 — Migrate Jackson 3 package names

**Status:** [x] Complete

**Why:** Spring Boot 4 upgrades to **Jackson 3** (`tools.jackson.core:jackson-databind:3.x`), which changes both the Maven group IDs (`com.fasterxml.jackson` → `tools.jackson`) and Java package names. Spring Boot no longer registers `com.fasterxml.jackson.databind.ObjectMapper` as a bean; the new type is `tools.jackson.databind.ObjectMapper`.

### What changed

All 5 test files that `@Autowired ObjectMapper` had their imports updated:

```java
// Before
import com.fasterxml.jackson.databind.ObjectMapper;

// After
import tools.jackson.databind.ObjectMapper;
```

No production source files used Jackson directly — only test files were affected.

---

## Step 7 — Fix `@SpringBootTest` test infrastructure

**Status:** [x] Complete

**Why:** Spring Boot 4 removed `@AutoConfigureMockMvc` and `TestRestTemplate` from the main test jar and moved them to separate, explicitly-declared dependencies. The classes also moved packages.

### What changed

**New test dependencies added to [`spring-tvbingo/build.gradle`](../spring-tvbingo/build.gradle):**

```groovy
testImplementation 'org.springframework.boot:spring-boot-webmvc-test'    // AutoConfigureMockMvc
testImplementation 'org.springframework.boot:spring-boot-restclient'      // RestTemplateBuilder (transitive requirement)
testImplementation 'org.springframework.boot:spring-boot-resttestclient'  // TestRestTemplate
```

**`@AutoConfigureMockMvc` package changed** in 6 test files:

```java
// Before
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

// After
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
```

**`TestRestTemplate` package changed** in [`ConcurrentIntegrationTests.java`](../spring-tvbingo/src/test/java/org/bomartin/tvbingo/ConcurrentIntegrationTests.java):

```java
// Before
import org.springframework.boot.test.web.client.TestRestTemplate;

// After
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
// ...and add @AutoConfigureTestRestTemplate annotation to the test class
```

---

## Step 8 — Final cleanup

**Status:** [x] Complete

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

## Key Unknowns

1. **springdoc-openapi Spring Boot 4 release** — Verify whether a Boot 4-compatible version exists before Step 5. If not, the dependency may need to be temporarily removed.
2. **Zonky embedded-postgres Spring Boot 4 support** — Zonky worked without version changes through steps 1–4 in practice; formally verify for Step 5.

> **Resolved:** Jackson 3 package names confirmed — `com.fasterxml.jackson` → `tools.jackson` (e.g. `tools.jackson.databind.ObjectMapper`). Already applied in Step 6.
