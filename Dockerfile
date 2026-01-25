# =============================================================================
# TV Bingo - Multi-stage Dockerfile
# =============================================================================
# Builds a single container with:
#   - Spring Boot backend (Java 21)
#   - Vue.js frontend (served as static resources)
#
# Build: docker build -t tv-bingo .
# Run:   docker run -p 8080:8080 -e TVBINGO_DB_PASSWORD=xxx tv-bingo
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build Frontend
# -----------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better layer caching
COPY vue-tvbingo/package*.json ./

# Install dependencies
RUN npm ci

# Copy source and build
COPY vue-tvbingo/ ./
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Build Backend
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS backend-builder

WORKDIR /app

# Copy Gradle wrapper and build files
COPY gradlew ./
COPY gradle/ gradle/
COPY build.gradle settings.gradle ./
COPY spring-tvbingo/ spring-tvbingo/

# Copy frontend build output to Spring Boot static resources
COPY --from=frontend-builder /app/frontend/dist/ spring-tvbingo/src/main/resources/static/

# Make gradlew executable and build the JAR
RUN chmod +x gradlew && \
    ./gradlew :spring-tvbingo:bootJar --no-daemon -x test

# -----------------------------------------------------------------------------
# Stage 3: Runtime Image
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime

# Add non-root user for security
RUN addgroup -g 1001 -S tvbingo && \
    adduser -u 1001 -S tvbingo -G tvbingo

WORKDIR /app

# Copy the built JAR
COPY --from=backend-builder /app/spring-tvbingo/build/libs/*.jar app.jar

# Set ownership
RUN chown -R tvbingo:tvbingo /app

USER tvbingo

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# JVM options for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Run the application with prod profile
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar --spring.profiles.active=prod"]
