package org.bomartin.tvbingo;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase.DatabaseProvider;
import org.bomartin.tvbingo.dto.ShowRequest;
import org.bomartin.tvbingo.repository.ShowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

import java.util.Arrays;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Concurrent integration tests using a real embedded server (RANDOM_PORT).
 * MockMvc is not thread-safe for concurrent requests; TestRestTemplate makes
 * real HTTP calls and is safe to use across multiple threads.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureEmbeddedDatabase(provider = DatabaseProvider.ZONKY)
@ActiveProfiles("test")
@Sql(scripts = "classpath:test-schema.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class ConcurrentIntegrationTests {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ShowRepository showRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        showRepository.deleteAll();
    }

    @Test
    void createShow_WithConcurrentDuplicateTitleChecks_ShouldPreventRaceCondition() throws Exception {
        String sharedTitle = "Concurrent Test_" + UUID.randomUUID().toString().substring(0, 8);
        int numberOfThreads = 10;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch completionLatch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);

        for (int i = 0; i < numberOfThreads; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();

                    ShowRequest request = new ShowRequest();
                    request.setShowTitle(sharedTitle);
                    request.setGameTitle("Game " + Thread.currentThread().threadId());
                    request.setPhrases(Arrays.asList("phrase1"));

                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_JSON);
                    HttpEntity<String> entity = new HttpEntity<>(
                            objectMapper.writeValueAsString(request), headers);

                    ResponseEntity<String> response =
                            restTemplate.postForEntity("/api/shows", entity, String.class);

                    int status = response.getStatusCode().value();
                    if (status == 201) {
                        successCount.incrementAndGet();
                    } else if (status == 400 || status == 409) {
                        conflictCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    // Unexpected — real HTTP errors should produce a status, not an exception
                } finally {
                    completionLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        completionLatch.await();
        executor.shutdown();

        assertThat(successCount.get()).isLessThanOrEqualTo(1);
        assertThat(successCount.get() + conflictCount.get()).isEqualTo(numberOfThreads);
    }
}
