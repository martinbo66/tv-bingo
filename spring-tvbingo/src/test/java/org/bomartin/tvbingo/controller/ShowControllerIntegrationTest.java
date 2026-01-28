package org.bomartin.tvbingo.controller;

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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for ShowController REST endpoints.
 * Tests the full stack from HTTP request through to database operations.
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureEmbeddedDatabase(provider = DatabaseProvider.ZONKY)
@ActiveProfiles("test")
@Sql(scripts = "classpath:test-schema.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class ShowControllerIntegrationTest {

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

    private String generateUniqueTitle(String base) {
        return base + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    // ========== POST /api/shows (Create) Tests ==========

    @Test
    void createShow_WithValidData_ShouldReturn201AndCreatedShow() throws Exception {
        // Given
        ShowRequest request = new ShowRequest();
        request.setShowTitle(generateUniqueTitle("The Office"));
        request.setGameTitle("Office Bingo");
        request.setCenterSquare("That's what she said");
        request.setPhrases(Arrays.asList("Dwight moment", "Jim prank", "Michael awkwardness"));

        // When & Then
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.showTitle").value(request.getShowTitle()))
                .andExpect(jsonPath("$.gameTitle").value("Office Bingo"))
                .andExpect(jsonPath("$.centerSquare").value("That's what she said"))
                .andExpect(jsonPath("$.phrases").isArray())
                .andExpect(jsonPath("$.phrases", hasSize(3)))
                .andExpect(jsonPath("$.phrases[0]").value("Dwight moment"));
    }

    @Test
    void createShow_WithMinimalData_ShouldReturn201() throws Exception {
        // Given - only required field (showTitle)
        ShowRequest request = new ShowRequest();
        request.setShowTitle(generateUniqueTitle("Breaking Bad"));

        // When & Then
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.showTitle").value(request.getShowTitle()))
                .andExpect(jsonPath("$.gameTitle").isEmpty())
                .andExpect(jsonPath("$.centerSquare").isEmpty())
                .andExpect(jsonPath("$.phrases").isArray())
                .andExpect(jsonPath("$.phrases", hasSize(0)));
    }

    @Test
    void createShow_WithBlankShowTitle_ShouldReturn400() throws Exception {
        // Given
        ShowRequest request = new ShowRequest();
        request.setShowTitle("");
        request.setGameTitle("Game Title");

        // When & Then
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.showTitle").value("Show title is required"));
    }

    @Test
    void createShow_WithNullShowTitle_ShouldReturn400() throws Exception {
        // Given
        ShowRequest request = new ShowRequest();
        request.setShowTitle(null);
        request.setGameTitle("Game Title");

        // When & Then
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.showTitle").value("Show title is required"));
    }

    @Test
    void createShow_WithDuplicateTitle_ShouldReturn409() throws Exception {
        // Given - create a show first
        String duplicateTitle = generateUniqueTitle("Duplicate Show");
        Show existingShow = Show.builder()
                .showTitle(duplicateTitle)
                .gameTitle("Original Game")
                .build();
        showRepository.save(existingShow);

        ShowRequest request = new ShowRequest();
        request.setShowTitle(duplicateTitle);
        request.setGameTitle("Trying to duplicate");

        // When & Then
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.showTitle").value("Show title must be unique"));
    }

    @Test
    void createShow_WithMalformedJson_ShouldReturn400() throws Exception {
        // Given - invalid JSON
        String malformedJson = "{showTitle: 'Missing quotes'}";

        // When & Then
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(malformedJson))
                .andExpect(status().isBadRequest());
    }

    // ========== GET /api/shows (Get All) Tests ==========

    @Test
    void getAllShows_WhenShowsExist_ShouldReturn200WithArray() throws Exception {
        // Given
        Show show1 = Show.builder()
                .showTitle(generateUniqueTitle("Show 1"))
                .gameTitle("Game 1")
                .phrases(Arrays.asList("Phrase 1", "Phrase 2"))
                .build();
        Show show2 = Show.builder()
                .showTitle(generateUniqueTitle("Show 2"))
                .gameTitle("Game 2")
                .phrases(Arrays.asList("Phrase 3"))
                .build();
        showRepository.save(show1);
        showRepository.save(show2);

        // When & Then
        mockMvc.perform(get("/api/shows"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].showTitle").exists())
                .andExpect(jsonPath("$[1].showTitle").exists());
    }

    @Test
    void getAllShows_WhenNoShowsExist_ShouldReturn200WithEmptyArray() throws Exception {
        // Given - empty database (cleared in setUp)

        // When & Then
        mockMvc.perform(get("/api/shows"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ========== GET /api/shows/{id} (Get One) Tests ==========

    @Test
    void getShow_WhenShowExists_ShouldReturn200WithShow() throws Exception {
        // Given
        Show show = Show.builder()
                .showTitle(generateUniqueTitle("Friends"))
                .gameTitle("Friends Bingo")
                .centerSquare("How you doin'?")
                .phrases(Arrays.asList("Coffee at Central Perk", "Ross whining", "Chandler joke"))
                .build();
        Show savedShow = showRepository.save(show);

        // When & Then
        mockMvc.perform(get("/api/shows/{id}", savedShow.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(savedShow.getId()))
                .andExpect(jsonPath("$.showTitle").value(savedShow.getShowTitle()))
                .andExpect(jsonPath("$.gameTitle").value("Friends Bingo"))
                .andExpect(jsonPath("$.centerSquare").value("How you doin'?"))
                .andExpect(jsonPath("$.phrases", hasSize(3)));
    }

    @Test
    void getShow_WhenShowDoesNotExist_ShouldReturn404() throws Exception {
        // Given
        Long nonExistentId = 99999L;

        // When & Then
        mockMvc.perform(get("/api/shows/{id}", nonExistentId))
                .andExpect(status().isNotFound());
    }

    // ========== PUT /api/shows/{id} (Update) Tests ==========

    @Test
    void updateShow_WithValidData_ShouldReturn200AndUpdatedShow() throws Exception {
        // Given
        Show existingShow = Show.builder()
                .showTitle(generateUniqueTitle("Original Title"))
                .gameTitle("Original Game")
                .centerSquare("Original Center")
                .phrases(Arrays.asList("Old phrase 1", "Old phrase 2"))
                .build();
        Show savedShow = showRepository.save(existingShow);

        ShowRequest updateRequest = new ShowRequest();
        updateRequest.setShowTitle(generateUniqueTitle("Updated Title"));
        updateRequest.setGameTitle("Updated Game");
        updateRequest.setCenterSquare("Updated Center");
        updateRequest.setPhrases(Arrays.asList("New phrase 1", "New phrase 2", "New phrase 3"));

        // When & Then
        mockMvc.perform(put("/api/shows/{id}", savedShow.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(savedShow.getId()))
                .andExpect(jsonPath("$.showTitle").value(updateRequest.getShowTitle()))
                .andExpect(jsonPath("$.gameTitle").value("Updated Game"))
                .andExpect(jsonPath("$.centerSquare").value("Updated Center"))
                .andExpect(jsonPath("$.phrases", hasSize(3)))
                .andExpect(jsonPath("$.phrases[2]").value("New phrase 3"));

        // Verify database was updated
        Show updatedShow = showRepository.findById(savedShow.getId()).orElseThrow();
        assertEquals(updateRequest.getShowTitle(), updatedShow.getShowTitle());
        assertEquals(3, updatedShow.getPhrases().size());
    }

    @Test
    void updateShow_WhenShowDoesNotExist_ShouldReturn404() throws Exception {
        // Given
        Long nonExistentId = 99999L;
        ShowRequest updateRequest = new ShowRequest();
        updateRequest.setShowTitle(generateUniqueTitle("New Title"));

        // When & Then
        mockMvc.perform(put("/api/shows/{id}", nonExistentId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateShow_WithBlankShowTitle_ShouldReturn400() throws Exception {
        // Given
        Show existingShow = Show.builder()
                .showTitle(generateUniqueTitle("Existing Show"))
                .build();
        Show savedShow = showRepository.save(existingShow);

        ShowRequest updateRequest = new ShowRequest();
        updateRequest.setShowTitle("");

        // When & Then
        mockMvc.perform(put("/api/shows/{id}", savedShow.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.showTitle").value("Show title is required"));
    }

    @Test
    void updateShow_WithDuplicateTitle_ShouldReturn400() throws Exception {
        // Given - create two shows
        Show show1 = Show.builder()
                .showTitle(generateUniqueTitle("Show 1"))
                .build();
        Show show2 = Show.builder()
                .showTitle(generateUniqueTitle("Show 2"))
                .build();
        showRepository.save(show1);
        Show savedShow2 = showRepository.save(show2);

        // Try to update show2 with show1's title
        ShowRequest updateRequest = new ShowRequest();
        updateRequest.setShowTitle(show1.getShowTitle());

        // When & Then - should return 409 Conflict for uniqueness violations
        mockMvc.perform(put("/api/shows/{id}", savedShow2.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.showTitle").value("Show title must be unique"));
    }

    @Test
    void updateShow_WithSameTitle_ShouldReturn200() throws Exception {
        // Given - updating a show with its own title should succeed
        String originalTitle = generateUniqueTitle("Same Title Show");
        Show existingShow = Show.builder()
                .showTitle(originalTitle)
                .gameTitle("Original Game")
                .build();
        Show savedShow = showRepository.save(existingShow);

        ShowRequest updateRequest = new ShowRequest();
        updateRequest.setShowTitle(originalTitle); // Same title
        updateRequest.setGameTitle("Updated Game");

        // When & Then
        mockMvc.perform(put("/api/shows/{id}", savedShow.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gameTitle").value("Updated Game"));
    }

    // ========== DELETE /api/shows/{id} (Delete) Tests ==========

    @Test
    void deleteShow_WhenShowExists_ShouldReturn204AndDeleteShow() throws Exception {
        // Given
        Show show = Show.builder()
                .showTitle(generateUniqueTitle("Show to Delete"))
                .gameTitle("Game to Delete")
                .build();
        Show savedShow = showRepository.save(show);
        Long showId = savedShow.getId();

        // When & Then
        mockMvc.perform(delete("/api/shows/{id}", showId))
                .andExpect(status().isNoContent());

        // Verify show was deleted from database
        assertFalse(showRepository.findById(showId).isPresent());
    }

    @Test
    void deleteShow_WhenShowDoesNotExist_ShouldReturn404() throws Exception {
        // Given
        Long nonExistentId = 99999L;

        // When & Then
        mockMvc.perform(delete("/api/shows/{id}", nonExistentId))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteShow_ShouldActuallyRemoveFromDatabase() throws Exception {
        // Given
        Show show = Show.builder()
                .showTitle(generateUniqueTitle("Verify Deletion"))
                .build();
        Show savedShow = showRepository.save(show);
        Long showId = savedShow.getId();

        // Verify it exists before deletion
        assertTrue(showRepository.findById(showId).isPresent());

        // When
        mockMvc.perform(delete("/api/shows/{id}", showId))
                .andExpect(status().isNoContent());

        // Then - verify it's gone
        assertFalse(showRepository.findById(showId).isPresent());

        // Subsequent GET should return 404
        mockMvc.perform(get("/api/shows/{id}", showId))
                .andExpect(status().isNotFound());
    }

    // ========== Phrase Validation Tests ==========

    @Test
    void createShow_WithPhraseExactly50Characters_ShouldReturn201() throws Exception {
        // Given - phrase with exactly 50 characters
        String exactly50 = "12345678901234567890123456789012345678901234567890"; // 50 chars
        ShowRequest request = new ShowRequest();
        request.setShowTitle(generateUniqueTitle("50 Char Test"));
        request.setPhrases(Arrays.asList(exactly50));

        // When & Then
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.phrases[0]").value(exactly50));
    }

    @Test
    void createShow_WithPhrase51Characters_ShouldReturn400() throws Exception {
        // Given - phrase with 51 characters (1 over limit)
        String over50 = "123456789012345678901234567890123456789012345678901"; // 51 chars
        ShowRequest request = new ShowRequest();
        request.setShowTitle(generateUniqueTitle("Over Limit Test"));
        request.setPhrases(Arrays.asList(over50));

        // When & Then
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.phrases").exists());
    }

    @Test
    void createShow_WithMultiplePhrasesOneTooLong_ShouldReturn400() throws Exception {
        // Given - multiple phrases, second one is too long
        String validPhrase = "This is valid";
        String tooLong = "This phrase is way too long for the 50 character limit and should be rejected"; // 79 chars
        ShowRequest request = new ShowRequest();
        request.setShowTitle(generateUniqueTitle("Mixed Phrases Test"));
        request.setPhrases(Arrays.asList(validPhrase, tooLong, "Another valid"));

        // When & Then
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.phrases").exists());
    }

    @Test
    void updateShow_WithPhraseTooLong_ShouldReturn400() throws Exception {
        // Given - existing show
        Show existingShow = Show.builder()
                .showTitle(generateUniqueTitle("Update Test"))
                .phrases(Arrays.asList("Valid phrase"))
                .build();
        Show savedShow = showRepository.save(existingShow);

        // Try to update with too-long phrase
        String tooLong = "This is an extremely long phrase that exceeds the fifty character maximum limit"; // 81 chars
        ShowRequest updateRequest = new ShowRequest();
        updateRequest.setShowTitle(savedShow.getShowTitle());
        updateRequest.setPhrases(Arrays.asList(tooLong));

        // When & Then
        mockMvc.perform(put("/api/shows/{id}", savedShow.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.phrases").exists());
    }

    @Test
    void createShow_WithEmptyPhrases_ShouldReturn201() throws Exception {
        // Given - empty phrases list
        ShowRequest request = new ShowRequest();
        request.setShowTitle(generateUniqueTitle("Empty Phrases Test"));
        request.setPhrases(new ArrayList<>());

        // When & Then
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.phrases", hasSize(0)));
    }
}
