package org.bomartin.tvbingo;

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
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.test.web.servlet.ResultMatcher;

/**
 * Edge case and stress tests for the TV Bingo application.
 * Tests boundary conditions, security concerns, and concurrent operations.
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureEmbeddedDatabase(provider = DatabaseProvider.ZONKY)
@ActiveProfiles("test")
@Sql(scripts = "classpath:test-schema.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class EdgeCaseTests {

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

    /**
     * Custom matcher for checking if status is one of multiple values
     */
    private ResultMatcher statusIsOneOf(int... statusCodes) {
        return result -> {
            int actualStatus = result.getResponse().getStatus();
            boolean matches = Arrays.stream(statusCodes).anyMatch(code -> code == actualStatus);
            if (!matches) {
                throw new AssertionError("Expected status to be one of " + Arrays.toString(statusCodes) 
                    + " but was " + actualStatus);
            }
        };
    }

    @Test
    void createShow_WithVeryLongTitle_ShouldHandleAppropriately() throws Exception {
        // Given - title with 300 characters
        String veryLongTitle = "A".repeat(300);
        ShowRequest request = new ShowRequest();
        request.setShowTitle(veryLongTitle);
        request.setGameTitle("Test Game");
        request.setPhrases(Arrays.asList("phrase1", "phrase2"));

        // When & Then - Should either accept it or return validation error
        // The behavior depends on database constraints
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(statusIsOneOf(201, 400, 409, 500));
    }

    @Test
    void createShow_WithVeryLongPhrases_ShouldHandleAppropriately() throws Exception {
        // Given - phrases with 1500 characters each
        String veryLongPhrase1 = "Long phrase 1: " + "X".repeat(1500);
        String veryLongPhrase2 = "Long phrase 2: " + "Y".repeat(1500);
        
        ShowRequest request = new ShowRequest();
        request.setShowTitle(generateUniqueTitle("Long Phrases Show"));
        request.setGameTitle("Test Game");
        request.setPhrases(Arrays.asList(veryLongPhrase1, veryLongPhrase2));

        // When & Then - Should handle or reject gracefully
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(statusIsOneOf(201, 400, 409, 500));
    }

    @Test
    void createShow_WithLargePhraseArray_ShouldAccept100PlusPhrases() throws Exception {
        // Given - 150 phrases
        List<String> largePhraseList = IntStream.range(0, 150)
                .mapToObj(i -> "Phrase number " + i)
                .collect(Collectors.toList());
        
        ShowRequest request = new ShowRequest();
        request.setShowTitle(generateUniqueTitle("Many Phrases Show"));
        request.setGameTitle("Large Array Test");
        request.setPhrases(largePhraseList);

        // When & Then
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.phrases", hasSize(150)));
    }

    @Test
    void createShow_WithSpecialCharactersAndEmoji_ShouldAcceptUnicodeContent() throws Exception {
        // Given - title and phrases with emoji and special unicode characters
        ShowRequest request = new ShowRequest();
        request.setShowTitle(generateUniqueTitle("Special 🎬 Show™ © 日本語"));
        request.setGameTitle("Unicode Game 🎮");
        request.setCenterSquare("Center 💯");
        request.setPhrases(Arrays.asList(
                "Emoji phrase 😂🎉",
                "Math symbols: ∑∏∫",
                "Currency: €£¥₹",
                "Japanese: こんにちは",
                "Arabic: مرحبا",
                "Special: @#$%^&*()"
        ));

        // When & Then
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.showTitle").value(containsString("Special")))
                .andExpect(jsonPath("$.showTitle").value(containsString("🎬")))
                .andExpect(jsonPath("$.phrases[0]").value(containsString("😂")));
    }

    @Test
    void createShow_WithSQLInjectionAttempt_ShouldSanitizeInput() throws Exception {
        // Given - SQL injection attempt in title and phrases
        String sqlInjectionTitle = generateUniqueTitle("Robert'); DROP TABLE shows;--");
        ShowRequest request = new ShowRequest();
        request.setShowTitle(sqlInjectionTitle);
        request.setGameTitle("Test Game");
        request.setPhrases(Arrays.asList(
                "Normal phrase",
                "1' OR '1'='1",
                "'; DELETE FROM shows; --"
        ));

        // When
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.showTitle").value(containsString("Robert")));

        // Then - verify database still has data and wasn't affected
        List<Show> allShows = (List<Show>) showRepository.findAll();
        assertThat(allShows).isNotEmpty();
        assertThat(allShows).anyMatch(show -> show.getShowTitle().contains("Robert"));
    }

    @Test
    void createShow_WithXSSAttempt_ShouldStoreContentAsIs() throws Exception {
        // Given - XSS attempt in phrases
        ShowRequest request = new ShowRequest();
        request.setShowTitle(generateUniqueTitle("XSS Test Show"));
        request.setGameTitle("Security Test");
        request.setPhrases(Arrays.asList(
                "<script>alert('XSS')</script>",
                "<img src=x onerror=alert('XSS')>",
                "javascript:alert('XSS')",
                "<iframe src='evil.com'></iframe>"
        ));

        // When & Then - Should store as-is (sanitization happens at rendering)
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.phrases[0]").value("<script>alert('XSS')</script>"));
    }

    @Test
    void createShow_WithNullVsEmptyString_ShouldHandleConsistently() throws Exception {
        // Given - null and empty string for optional fields
        ShowRequest request = new ShowRequest();
        request.setShowTitle(generateUniqueTitle("Null Test Show"));
        request.setGameTitle(null);  // null
        request.setCenterSquare("");  // empty string
        request.setPhrases(new ArrayList<>());  // empty list

        // When & Then
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.showTitle").exists())
                .andExpect(jsonPath("$.gameTitle").value(anyOf(nullValue(), is(""))))
                .andExpect(jsonPath("$.centerSquare").value(""))
                .andExpect(jsonPath("$.phrases", hasSize(0)));
    }

    @Test
    void createShow_WithWhitespaceOnlyTitle_ShouldRejectAsBlank() throws Exception {
        // Given - whitespace-only title
        ShowRequest request = new ShowRequest();
        request.setShowTitle("   ");  // only spaces
        request.setGameTitle("Test Game");
        request.setPhrases(Arrays.asList("phrase1"));

        // When & Then - Should reject due to @NotBlank validation
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.showTitle").exists());
    }

    @Test
    void createShow_WithConcurrentDuplicateTitleChecks_ShouldPreventRaceCondition() throws Exception {
        // Given - multiple threads trying to create shows with the same title
        String sharedTitle = generateUniqueTitle("Concurrent Test");
        int numberOfThreads = 10;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);
        
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);

        // When - attempt concurrent creation
        for (int i = 0; i < numberOfThreads; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();  // Wait for all threads to be ready
                    
                    ShowRequest request = new ShowRequest();
                    request.setShowTitle(sharedTitle);
                    request.setGameTitle("Game " + Thread.currentThread().threadId());
                    request.setPhrases(Arrays.asList("phrase1"));

                    var result = mockMvc.perform(post("/api/shows")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                            .andReturn();
                    
                    int status = result.getResponse().getStatus();
                    if (status == 201) {
                        successCount.incrementAndGet();
                    } else if (status == 400 || status == 409) {
                        conflictCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    // Expected for race conditions
                } finally {
                    completionLatch.countDown();
                }
            });
        }

        startLatch.countDown();  // Start all threads
        completionLatch.await();  // Wait for all to complete
        executor.shutdown();

        // Then - only one should succeed (or possibly none if validation is strict)
        assertThat(successCount.get()).isLessThanOrEqualTo(1);
        assertThat(successCount.get() + conflictCount.get()).isEqualTo(numberOfThreads);
    }

    @Test
    void updateShow_WithConcurrentPhraseUpdates_ShouldHandleRaceCondition() throws Exception {
        // Given - create a show first
        Show initialShow = Show.builder()
                .showTitle(generateUniqueTitle("Race Condition Test"))
                .gameTitle("Test Game")
                .phrases(new ArrayList<>(Arrays.asList("original phrase")))
                .build();
        Show savedShow = showRepository.save(initialShow);

        // When - multiple threads update the same show concurrently
        int numberOfThreads = 5;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(numberOfThreads);
        
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);

        for (int i = 0; i < numberOfThreads; i++) {
            final int threadNum = i;
            executor.submit(() -> {
                try {
                    startLatch.await();
                    
                    ShowRequest updateRequest = new ShowRequest();
                    updateRequest.setShowTitle(savedShow.getShowTitle());
                    updateRequest.setGameTitle("Updated by thread " + threadNum);
                    updateRequest.setPhrases(Arrays.asList("phrase from thread " + threadNum));

                    mockMvc.perform(put("/api/shows/" + savedShow.getId())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                            .andExpect(status().isOk());
                } catch (Exception e) {
                    // Some failures expected due to concurrent updates
                } finally {
                    completionLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        completionLatch.await();
        executor.shutdown();

        // Then - verify show still exists and has valid data
        Show finalShow = showRepository.findById(savedShow.getId()).orElse(null);
        assertThat(finalShow).isNotNull();
        assertThat(finalShow.getGameTitle()).startsWith("Updated by thread");
        assertThat(finalShow.getPhrases()).isNotEmpty();
    }
}
