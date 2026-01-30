package org.bomartin.tvbingo.performance;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase.DatabaseProvider;
import org.bomartin.tvbingo.dto.ShowRequest;
import org.bomartin.tvbingo.model.Show;
import org.bomartin.tvbingo.repository.ShowRepository;
import org.junit.jupiter.api.AfterEach;
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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Performance and load tests for the TV Bingo application.
 * Tests system behavior under high load and with large datasets.
 * 
 * Test Data Strategy:
 * - Data is created programmatically at the start of each test
 * - Each test uses @BeforeEach to ensure a clean database state
 * - @AfterEach cleanup ensures no data leaks between tests
 * - Large datasets (1000+ shows) are created only when needed
 * - Embedded Postgres is used for isolation and speed
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureEmbeddedDatabase(provider = DatabaseProvider.ZONKY)
@ActiveProfiles("test")
@Sql(scripts = "classpath:test-schema.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class PerformanceTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ShowRepository showRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        // Start with clean slate - delete all existing data
        showRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        // Clean up after each test to prevent data accumulation
        // This is critical for performance tests that create large datasets
        showRepository.deleteAll();
    }

    private String generateUniqueTitle(String base, int index) {
        return String.format("%s_%d_%s", base, index, UUID.randomUUID().toString().substring(0, 8));
    }

    /**
     * Creates test shows in bulk for performance testing.
     * This method is optimized for speed - creates shows directly in the repository.
     * 
     * @param count Number of shows to create
     * @return List of created shows
     */
    private List<Show> createTestShows(int count) {
        List<Show> shows = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Show show = Show.builder()
                    .showTitle(generateUniqueTitle("PerfTestShow", i))
                    .gameTitle("Performance Test Game " + i)
                    .centerSquare("Center " + i)
                    .phrases(Arrays.asList(
                            "Phrase 1 for show " + i,
                            "Phrase 2 for show " + i,
                            "Phrase 3 for show " + i
                    ))
                    .build();
            shows.add(show);
        }
        
        // Batch save for better performance
        showRepository.saveAll(shows);
        return shows;
    }

    @Test
    void loadTest_100ConcurrentCreateRequests_ShouldHandleLoad() throws Exception {
        // Given - 100 threads making concurrent requests
        int numberOfThreads = 100;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        long startTime = System.currentTimeMillis();

        // When - execute concurrent requests
        for (int i = 0; i < numberOfThreads; i++) {
            final int threadNum = i;
            executor.submit(() -> {
                try {
                    startLatch.await(); // Wait for all threads to be ready
                    
                    ShowRequest request = new ShowRequest();
                    request.setShowTitle(generateUniqueTitle("LoadTest", threadNum));
                    request.setGameTitle("Load Test Game " + threadNum);
                    request.setPhrases(Arrays.asList("phrase1", "phrase2", "phrase3"));

                    MvcResult result = mockMvc.perform(post("/api/shows")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                            .andReturn();
                    
                    if (result.getResponse().getStatus() == 201) {
                        successCount.incrementAndGet();
                    } else {
                        failureCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    completionLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // Start all threads
        boolean completed = completionLatch.await(30, TimeUnit.SECONDS);
        executor.shutdown();
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        // Then - verify results and performance
        assertThat(completed).isTrue();
        assertThat(successCount.get()).isGreaterThan(90); // At least 90% success rate
        assertThat(duration).isLessThan(30000); // Should complete within 30 seconds
        
        // Verify data consistency
        long showCount = showRepository.count();
        assertThat(showCount).isEqualTo(successCount.get());
        
        System.out.printf("Load Test Results: %d requests in %dms (%.2f req/sec), Success: %d, Failures: %d%n",
                numberOfThreads, duration, (numberOfThreads * 1000.0) / duration, 
                successCount.get(), failureCount.get());
    }

    @Test
    void largeDataset_Retrieve1000PlusShows_ShouldMeetPerformanceTarget() throws Exception {
        // Given - create 1000 shows in the database
        int showCount = 1000;
        System.out.println("Creating " + showCount + " test shows...");
        long dataSetupStart = System.currentTimeMillis();
        createTestShows(showCount);
        long dataSetupEnd = System.currentTimeMillis();
        System.out.printf("Dataset created in %dms%n", dataSetupEnd - dataSetupStart);

        // When - retrieve all shows
        long retrievalStart = System.currentTimeMillis();
        MvcResult result = mockMvc.perform(get("/api/shows"))
                .andExpect(status().isOk())
                .andReturn();
        long retrievalEnd = System.currentTimeMillis();
        long retrievalDuration = retrievalEnd - retrievalStart;

        // Then - verify performance and data integrity
        String content = result.getResponse().getContentAsString();
        List<?> shows = objectMapper.readValue(content, List.class);
        
        assertThat(shows).hasSize(showCount);
        assertThat(retrievalDuration).isLessThan(5000); // Should complete within 5 seconds
        
        System.out.printf("Retrieved %d shows in %dms (%.2f ms per show)%n",
                showCount, retrievalDuration, (double) retrievalDuration / showCount);
    }

    @Test
    void databaseQueryPerformance_ComplexQueries_ShouldBeFast() throws Exception {
        // Given - create dataset with varied data
        int showCount = 500;
        System.out.println("Creating " + showCount + " shows for query performance test...");
        List<Show> shows = createTestShows(showCount);
        Show targetShow = shows.get(250); // Pick a show from the middle

        // Test 1: Find by ID (primary key lookup)
        long findByIdStart = System.currentTimeMillis();
        Show foundById = showRepository.findById(targetShow.getId()).orElse(null);
        long findByIdDuration = System.currentTimeMillis() - findByIdStart;
        
        assertThat(foundById).isNotNull();
        assertThat(foundById.getId()).isEqualTo(targetShow.getId());
        assertThat(findByIdDuration).isLessThan(100); // Should be very fast (< 100ms)

        // Test 2: Check title existence (indexed query)
        long titleCheckStart = System.currentTimeMillis();
        boolean exists = showRepository.existsByShowTitle(targetShow.getShowTitle());
        long titleCheckDuration = System.currentTimeMillis() - titleCheckStart;
        
        assertThat(exists).isTrue();
        assertThat(titleCheckDuration).isLessThan(200); // Index lookup should be fast

        // Test 3: Find all (full table scan)
        long findAllStart = System.currentTimeMillis();
        List<Show> allShows = (List<Show>) showRepository.findAll();
        long findAllDuration = System.currentTimeMillis() - findAllStart;
        
        assertThat(allShows).hasSize(showCount);
        assertThat(findAllDuration).isLessThan(2000); // Should be reasonable even for 500 records

        System.out.printf("Query Performance - FindById: %dms, TitleCheck: %dms, FindAll: %dms%n",
                findByIdDuration, titleCheckDuration, findAllDuration);
    }

    @Test
    void responseTimeBenchmark_VariousEndpoints_ShouldMeetTargets() throws Exception {
        // Given - create a moderate dataset
        int showCount = 100;
        List<Show> shows = createTestShows(showCount);
        Show testShow = shows.get(0);

        // Test 1: GET all shows
        long getAllStart = System.currentTimeMillis();
        mockMvc.perform(get("/api/shows"))
                .andExpect(status().isOk());
        long getAllDuration = System.currentTimeMillis() - getAllStart;
        assertThat(getAllDuration).isLessThan(2000); // < 2 seconds

        // Test 2: GET single show
        long getOneStart = System.currentTimeMillis();
        mockMvc.perform(get("/api/shows/{id}", testShow.getId()))
                .andExpect(status().isOk());
        long getOneDuration = System.currentTimeMillis() - getOneStart;
        assertThat(getOneDuration).isLessThan(500); // < 500ms

        // Test 3: POST create show
        ShowRequest createRequest = new ShowRequest();
        createRequest.setShowTitle(generateUniqueTitle("BenchmarkShow", 999));
        createRequest.setGameTitle("Benchmark Game");
        createRequest.setPhrases(Arrays.asList("phrase1", "phrase2"));

        long postStart = System.currentTimeMillis();
        mockMvc.perform(post("/api/shows")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated());
        long postDuration = System.currentTimeMillis() - postStart;
        assertThat(postDuration).isLessThan(1000); // < 1 second

        // Test 4: PUT update show
        ShowRequest updateRequest = new ShowRequest();
        updateRequest.setShowTitle(testShow.getShowTitle());
        updateRequest.setGameTitle("Updated Game Title");
        updateRequest.setPhrases(Arrays.asList("updated1", "updated2"));

        long putStart = System.currentTimeMillis();
        mockMvc.perform(put("/api/shows/{id}", testShow.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk());
        long putDuration = System.currentTimeMillis() - putStart;
        assertThat(putDuration).isLessThan(1000); // < 1 second

        // Test 5: DELETE show
        long deleteStart = System.currentTimeMillis();
        mockMvc.perform(delete("/api/shows/{id}", testShow.getId()))
                .andExpect(status().isNoContent());
        long deleteDuration = System.currentTimeMillis() - deleteStart;
        assertThat(deleteDuration).isLessThan(500); // < 500ms

        System.out.printf("Response Time Benchmarks - GET all: %dms, GET one: %dms, POST: %dms, PUT: %dms, DELETE: %dms%n",
                getAllDuration, getOneDuration, postDuration, putDuration, deleteDuration);
    }

    @Test
    void memoryUsage_LargeDataset_ShouldNotExceedLimits() throws Exception {
        // Given - get baseline memory usage
        Runtime runtime = Runtime.getRuntime();
        System.gc(); // Suggest garbage collection before measurement
        Thread.sleep(100); // Give GC time to run
        
        long baselineMemory = runtime.totalMemory() - runtime.freeMemory();
        System.out.printf("Baseline memory: %.2f MB%n", baselineMemory / (1024.0 * 1024.0));

        // When - create large dataset and retrieve it
        int showCount = 1000;
        System.out.println("Creating " + showCount + " shows for memory test...");
        createTestShows(showCount);
        
        // Measure memory after data creation
        long afterCreationMemory = runtime.totalMemory() - runtime.freeMemory();
        System.out.printf("After creating %d shows: %.2f MB%n", 
                showCount, afterCreationMemory / (1024.0 * 1024.0));

        // Retrieve all shows via API
        MvcResult result = mockMvc.perform(get("/api/shows"))
                .andExpect(status().isOk())
                .andReturn();
        
        String content = result.getResponse().getContentAsString();
        List<?> shows = objectMapper.readValue(content, List.class);
        
        // Measure memory after retrieval
        long afterRetrievalMemory = runtime.totalMemory() - runtime.freeMemory();
        System.out.printf("After retrieving %d shows: %.2f MB%n", 
                showCount, afterRetrievalMemory / (1024.0 * 1024.0));

        // Then - verify reasonable memory usage
        long memoryIncrease = afterRetrievalMemory - baselineMemory;
        double memoryIncreaseMB = memoryIncrease / (1024.0 * 1024.0);
        
        System.out.printf("Total memory increase: %.2f MB%n", memoryIncreaseMB);
        
        assertThat(shows).hasSize(showCount);
        // Memory increase should be reasonable (not more than 200MB for 1000 shows)
        // This is a generous limit to account for JVM overhead, JSON serialization, etc.
        assertThat(memoryIncreaseMB).isLessThan(200.0);
        
        // Verify max memory is within acceptable bounds
        long maxMemory = runtime.maxMemory();
        long usedMemory = afterRetrievalMemory;
        double memoryUtilization = (usedMemory * 100.0) / maxMemory;
        System.out.printf("Memory utilization: %.2f%% of max heap%n", memoryUtilization);
        
        // Should not use more than 80% of max heap
        assertThat(memoryUtilization).isLessThan(80.0);
    }
}
