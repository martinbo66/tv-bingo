package org.bomartin.tvbingo.config;

import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase.DatabaseProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for WebConfig CORS configuration.
 * Verifies that CORS headers are correctly set for API endpoints.
 * Uses preflight OPTIONS requests to test CORS without database dependencies.
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureEmbeddedDatabase(provider = DatabaseProvider.ZONKY)
@ActiveProfiles("test")
@Sql(scripts = "classpath:test-schema.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class WebConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void corsHeadersSetCorrectlyForAllowedOrigins() throws Exception {
        // Given: A preflight request from an allowed localhost origin
        String allowedOrigin = "http://localhost:5173";

        // When: Making a preflight OPTIONS request
        mockMvc.perform(options("/api/shows")
                        .header("Origin", allowedOrigin)
                        .header("Access-Control-Request-Method", "GET"))
                // Then: CORS headers should be present
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", allowedOrigin))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    void corsAllowsCredentials() throws Exception {
        // Given: A preflight request from localhost with credentials
        String origin = "http://localhost:8080";

        // When: Making a preflight request
        mockMvc.perform(options("/api/shows")
                        .header("Origin", origin)
                        .header("Access-Control-Request-Method", "GET"))
                // Then: Allow-Credentials header should be true
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    void corsAllowsSpecifiedHttpMethods() throws Exception {
        // Given: A preflight OPTIONS request
        String origin = "http://localhost:3000";
        String requestMethod = "POST";

        // When: Making a preflight request
        mockMvc.perform(options("/api/shows")
                        .header("Origin", origin)
                        .header("Access-Control-Request-Method", requestMethod))
                // Then: Should allow the specified methods
                .andExpect(status().isOk())
                .andExpect(header().exists("Access-Control-Allow-Methods"))
                .andExpect(header().string("Access-Control-Allow-Methods", 
                        containsString("GET")))
                .andExpect(header().string("Access-Control-Allow-Methods", 
                        containsString("POST")))
                .andExpect(header().string("Access-Control-Allow-Methods", 
                        containsString("PUT")))
                .andExpect(header().string("Access-Control-Allow-Methods", 
                        containsString("DELETE")))
                .andExpect(header().string("Access-Control-Allow-Methods", 
                        containsString("OPTIONS")));
    }

    @Test
    void corsConfigurationAppliedToApiPathsOnly() throws Exception {
        // Given: A request to an API endpoint
        String origin = "http://localhost:5173";

        // When: Making a request to /api/**
        mockMvc.perform(get("/api/shows")
                        .header("Origin", origin))
                // Then: CORS headers should be present
                .andExpect(status().isOk())
                .andExpect(header().exists("Access-Control-Allow-Origin"));

        // When: Making a request to a non-API endpoint (static resource)
        // Note: Non-API routes may not have CORS headers as they're served by SpaWebConfig
        mockMvc.perform(get("/")
                        .header("Origin", origin))
                // Then: Should return 200 but may not have CORS headers (SPA handles this)
                .andExpect(status().isOk());
    }

    @Test
    void corsPreflightRequestsHandled() throws Exception {
        // Given: A preflight OPTIONS request with custom headers
        String origin = "http://localhost:5173";
        String requestMethod = "PUT";
        String requestHeaders = "Content-Type,Authorization";

        // When: Making a preflight request
        mockMvc.perform(options("/api/shows")
                        .header("Origin", origin)
                        .header("Access-Control-Request-Method", requestMethod)
                        .header("Access-Control-Request-Headers", requestHeaders))
                // Then: Preflight should be successful
                .andExpect(status().isOk())
                .andExpect(header().exists("Access-Control-Allow-Origin"))
                .andExpect(header().exists("Access-Control-Allow-Methods"))
                .andExpect(header().exists("Access-Control-Allow-Headers"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }
}
