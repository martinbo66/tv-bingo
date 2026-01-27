package org.bomartin.tvbingo.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase.DatabaseProvider;
import org.bomartin.tvbingo.dto.ShowRequest;
import org.bomartin.tvbingo.model.Show;
import org.bomartin.tvbingo.repository.ShowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * API Contract Validation Tests.
 * Ensures API responses conform to expected structure and data types.
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureEmbeddedDatabase(provider = DatabaseProvider.ZONKY)
@ActiveProfiles("test")
@Sql(scripts = "classpath:test-schema.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class ApiContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ShowRepository showRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        showRepository.deleteAll();
    }

    @Test
    void responseFormatValidation_singleShow() throws Exception {
        // Given: A show in the database
        Show show = Show.builder()
                .showTitle("Contract Test Show")
                .gameTitle("Contract Game")
                .centerSquare("CENTER")
                .phrases(Arrays.asList("Phrase 1", "Phrase 2"))
                .build();
        Show savedShow = showRepository.save(show);

        // When: Fetching the show
        MvcResult result = mockMvc.perform(get("/api/shows/" + savedShow.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        // Then: Response should have correct JSON structure
        String json = result.getResponse().getContentAsString();
        Map<String, Object> response = objectMapper.readValue(json, Map.class);

        // Verify all required fields are present
        assertTrue(response.containsKey("id"), "Response should have 'id' field");
        assertTrue(response.containsKey("showTitle"), "Response should have 'showTitle' field");
        assertTrue(response.containsKey("gameTitle"), "Response should have 'gameTitle' field");
        assertTrue(response.containsKey("centerSquare"), "Response should have 'centerSquare' field");
        assertTrue(response.containsKey("phrases"), "Response should have 'phrases' field");

        // Verify field types
        assertTrue(response.get("id") instanceof Number, "id should be a number");
        assertTrue(response.get("showTitle") instanceof String, "showTitle should be a string");
        assertTrue(response.get("gameTitle") instanceof String, "gameTitle should be a string");
        assertTrue(response.get("centerSquare") instanceof String, "centerSquare should be a string");
        assertTrue(response.get("phrases") instanceof List, "phrases should be a list");
    }

    @Test
    void errorResponseStructureConsistent() throws Exception {
        // Given: A request that will trigger validation error
        ShowRequest invalidRequest = new ShowRequest();
        invalidRequest.setShowTitle(""); // Invalid - blank

        // When: Attempting to create with invalid data
        MvcResult result = mockMvc.perform(post("/api/shows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andReturn();

        // Then: Error response should have consistent structure
        String json = result.getResponse().getContentAsString();
        Map<String, Object> response = objectMapper.readValue(json, Map.class);

        // Should contain error information
        assertFalse(response.isEmpty(), "Error response should not be empty");
        // Common error response patterns: may have 'errors' map or field-specific messages
        assertTrue(response.containsKey("showTitle") || response.containsKey("errors") || 
                   response.containsKey("message"), "Error response should have error details");
    }

    @Test
    void fieldTypeValidationMatchesSpec() throws Exception {
        // Given: A valid show request
        ShowRequest request = new ShowRequest();
        request.setShowTitle("Type Validation Test");
        request.setGameTitle("Type Game");
        request.setCenterSquare("FREE");
        request.setPhrases(Arrays.asList("Test1", "Test2", "Test3"));

        // When: Creating the show
        MvcResult result = mockMvc.perform(post("/api/shows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        // Then: Response field types should match expected types
        String json = result.getResponse().getContentAsString();
        Map<String, Object> response = objectMapper.readValue(json, Map.class);

        // Validate types
        Object id = response.get("id");
        assertNotNull(id, "id should not be null");
        assertTrue(id instanceof Number, "id should be numeric");
        assertTrue(((Number) id).longValue() > 0, "id should be positive");

        assertEquals("Type Validation Test", response.get("showTitle"), "showTitle should match");
        assertEquals("Type Game", response.get("gameTitle"), "gameTitle should match");
        assertEquals("FREE", response.get("centerSquare"), "centerSquare should match");

        List<?> phrases = (List<?>) response.get("phrases");
        assertEquals(3, phrases.size(), "phrases should have 3 items");
        phrases.forEach(phrase -> assertTrue(phrase instanceof String, "Each phrase should be a string"));
    }

    @Test
    void requiredFieldsPresentInResponses() throws Exception {
        // Given: Multiple shows in the database
        Show show1 = Show.builder()
                .showTitle("Show 1")
                .gameTitle("Game 1")
                .centerSquare("FREE")
                .phrases(Arrays.asList("A", "B"))
                .build();
        Show show2 = Show.builder()
                .showTitle("Show 2")
                .gameTitle(null) // Optional field
                .centerSquare("CENTER")
                .phrases(Arrays.asList("C", "D"))
                .build();

        showRepository.save(show1);
        showRepository.save(show2);

        // When: Fetching all shows
        MvcResult result = mockMvc.perform(get("/api/shows"))
                .andExpect(status().isOk())
                .andReturn();

        // Then: Each show should have required fields
        String json = result.getResponse().getContentAsString();
        List<Map<String, Object>> shows = objectMapper.readValue(json, List.class);

        assertEquals(2, shows.size(), "Should return 2 shows");

        for (Map<String, Object> show : shows) {
            // Required fields must be present
            assertTrue(show.containsKey("id"), "Each show must have id");
            assertTrue(show.containsKey("showTitle"), "Each show must have showTitle");
            assertTrue(show.containsKey("phrases"), "Each show must have phrases");

            // Optional fields may be present or null but key should exist
            assertTrue(show.containsKey("gameTitle"), "gameTitle key should be present");
            assertTrue(show.containsKey("centerSquare"), "centerSquare key should be present");
        }
    }

    @Test
    void listResponseStructure() throws Exception {
        // Given: Multiple shows
        showRepository.save(Show.builder()
                .showTitle("List Test 1")
                .phrases(Arrays.asList("P1"))
                .build());
        showRepository.save(Show.builder()
                .showTitle("List Test 2")
                .phrases(Arrays.asList("P2"))
                .build());

        // When: Fetching list
        MvcResult result = mockMvc.perform(get("/api/shows"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        // Then: Should return JSON array
        String json = result.getResponse().getContentAsString();
        assertTrue(json.startsWith("["), "List response should start with [");
        assertTrue(json.endsWith("]"), "List response should end with ]");

        List<?> list = objectMapper.readValue(json, List.class);
        assertEquals(2, list.size(), "Should return 2 items");
        assertTrue(list.get(0) instanceof Map, "Each item should be an object");
    }

    @Test
    void emptyListResponseStructure() throws Exception {
        // Given: No shows in database
        // When: Fetching all shows
        MvcResult result = mockMvc.perform(get("/api/shows"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        // Then: Should return empty array
        String json = result.getResponse().getContentAsString();
        assertEquals("[]", json, "Empty list should return []");
    }

    @Test
    void contentTypeHeadersCorrect() throws Exception {
        // Given: A show in database
        Show show = showRepository.save(Show.builder()
                .showTitle("Header Test")
                .phrases(Arrays.asList("H1"))
                .build());

        // When: Making various API calls
        // GET single
        mockMvc.perform(get("/api/shows/" + show.getId()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("application/json")));

        // GET list
        mockMvc.perform(get("/api/shows"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("application/json")));

        // POST
        ShowRequest request = new ShowRequest();
        request.setShowTitle("New Show for Headers");
        request.setPhrases(Arrays.asList("P1"));

        mockMvc.perform(post("/api/shows")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Content-Type", containsString("application/json")));
    }

    @Test
    void notFoundResponseStructure() throws Exception {
        // Given: A non-existent show ID
        long nonExistentId = 99999L;

        // When: Fetching non-existent show
        MvcResult result = mockMvc.perform(get("/api/shows/" + nonExistentId))
                .andExpect(status().isNotFound())
                .andReturn();

        // Then: Response should still be valid (may be empty or have error structure)
        String json = result.getResponse().getContentAsString();
        // 404 may return empty body or error message - both are valid
        assertTrue(json.isEmpty() || json.contains("Not") || json.contains("not"), 
                "404 response should be empty or contain error message");
    }
}
