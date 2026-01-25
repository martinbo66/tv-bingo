package org.bomartin.tvbingo.repository;

import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase.DatabaseProvider;
import org.bomartin.tvbingo.model.Show;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureEmbeddedDatabase(provider = DatabaseProvider.ZONKY)
@ActiveProfiles("test")
@Transactional
@Rollback
@Sql(scripts = "classpath:test-schema.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class ShowRepositoryTest {

    @Autowired
    private ShowRepository showRepository;
    
    private String generateUniqueTitle(String base) {
        return base + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    void whenSaveShow_thenShowIsCreated() {
        // Given
        String uniqueTitle = generateUniqueTitle("Test Show");
        Show show = Show.builder()
                .showTitle(uniqueTitle)
                .gameTitle("Test Game")
                .centerSquare("Center Square")
                .phrases(Arrays.asList("Phrase 1", "Phrase 2", "Phrase 3"))
                .build();

        // When
        Show savedShow = showRepository.save(show);

        // Then
        assertNotNull(savedShow.getId());
        assertEquals(uniqueTitle, savedShow.getShowTitle());
        assertEquals("Test Game", savedShow.getGameTitle());
        assertEquals("Center Square", savedShow.getCenterSquare());
        assertEquals(3, savedShow.getPhrases().size());
    }

    @Test
    void whenFindById_thenReturnShow() {
        // Given
        Show show = Show.builder()
                .showTitle(generateUniqueTitle("Another Show"))
                .gameTitle("Another Game")
                .centerSquare("Another Square")
                .phrases(Arrays.asList("Phrase A", "Phrase B"))
                .build();
        Show savedShow = showRepository.save(show);

        // When
        Optional<Show> foundShow = showRepository.findById(savedShow.getId());

        // Then
        assertTrue(foundShow.isPresent());
        assertEquals(savedShow.getShowTitle(), foundShow.get().getShowTitle());
        assertEquals(savedShow.getGameTitle(), foundShow.get().getGameTitle());
    }

    @Test
    void whenFindAll_thenReturnAllShows() {
        // Given
        Show show1 = Show.builder()
                .showTitle(generateUniqueTitle("Show 1"))
                .gameTitle("Game 1")
                .phrases(Arrays.asList("P1", "P2"))
                .build();
        Show show2 = Show.builder()
                .showTitle(generateUniqueTitle("Show 2"))
                .gameTitle("Game 2")
                .phrases(Arrays.asList("P3", "P4"))
                .build();
        showRepository.save(show1);
        showRepository.save(show2);

        // When
        List<Show> shows = StreamSupport.stream(showRepository.findAll().spliterator(), false)
                .collect(Collectors.toList());

        // Then
        assertFalse(shows.isEmpty());
        assertTrue(shows.size() >= 2);
    }

    @Test
    void whenUpdateShow_thenShowIsUpdated() {
        // Given
        Show show = Show.builder()
                .showTitle(generateUniqueTitle("Original Title"))
                .gameTitle("Original Game")
                .phrases(Arrays.asList("Original Phrase"))
                .build();
        Show savedShow = showRepository.save(show);

        // When
        savedShow.setShowTitle(generateUniqueTitle("Updated Title"));
        savedShow.setGameTitle("Updated Game");
        Show updatedShow = showRepository.save(savedShow);

        // Then
        assertTrue(updatedShow.getShowTitle().startsWith("Updated Title"));
        assertEquals("Updated Game", updatedShow.getGameTitle());
    }

    @Test
    void whenDeleteShow_thenShowIsRemoved() {
        // Given
        Show show = Show.builder()
                .showTitle(generateUniqueTitle("Show to Delete"))
                .gameTitle("Game to Delete")
                .phrases(Arrays.asList("Delete This"))
                .build();
        Show savedShow = showRepository.save(show);

        // When
        showRepository.deleteById(savedShow.getId());

        // Then
        Optional<Show> deletedShow = showRepository.findById(savedShow.getId());
        assertTrue(deletedShow.isEmpty());
    }

    @Test
    void whenExistsByShowTitle_thenReturnTrue() {
        // Given
        String showTitle = generateUniqueTitle("Unique Show Title");
        Show show = Show.builder()
                .showTitle(showTitle)
                .gameTitle("Some Game")
                .build();
        showRepository.save(show);

        // When
        boolean exists = showRepository.existsByShowTitle(showTitle);

        // Then
        assertTrue(exists);
    }

    @Test
    void whenExistsByShowTitleExceptId_thenReturnFalse() {
        // Given
        Show show = Show.builder()
                .showTitle(generateUniqueTitle("Exclusive Show"))
                .gameTitle("Some Game")
                .build();
        Show savedShow = showRepository.save(show);

        // When
        boolean exists = showRepository.existsByShowTitleExceptId(savedShow.getShowTitle(), savedShow.getId());

        // Then
        assertFalse(exists);
    }
} 