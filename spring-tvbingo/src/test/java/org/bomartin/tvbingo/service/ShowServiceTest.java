package org.bomartin.tvbingo.service;

import org.bomartin.tvbingo.model.Show;
import org.bomartin.tvbingo.repository.ShowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShowServiceTest {

    @Mock
    private ShowRepository showRepository;

    @InjectMocks
    private ShowService showService;

    private Show testShow;

    @BeforeEach
    void setUp() {
        testShow = Show.builder()
                .id(1L)
                .showTitle("Test Show")
                .gameTitle("Test Game")
                .centerSquare("Center Square")
                .phrases(Arrays.asList("Phrase 1", "Phrase 2"))
                .build();
    }

    @Test
    void createShow_ShouldSaveAndReturnShow() {
        when(showRepository.save(any(Show.class))).thenReturn(testShow);

        Show result = showService.createShow(testShow);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(testShow.getId());
        assertThat(result.getShowTitle()).isEqualTo(testShow.getShowTitle());
        verify(showRepository).save(testShow);
    }

    @Test
    void getShow_WhenShowExists_ShouldReturnShow() {
        when(showRepository.findById(1L)).thenReturn(Optional.of(testShow));

        Optional<Show> result = showService.getShow(1L);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(testShow.getId());
        assertThat(result.get().getShowTitle()).isEqualTo(testShow.getShowTitle());
        verify(showRepository).findById(1L);
    }

    @Test
    void getShow_WhenShowDoesNotExist_ShouldReturnEmpty() {
        when(showRepository.findById(1L)).thenReturn(Optional.empty());

        Optional<Show> result = showService.getShow(1L);

        assertThat(result).isEmpty();
        verify(showRepository).findById(1L);
    }

    @Test
    void getAllShows_ShouldReturnAllShows() {
        Show secondShow = Show.builder()
                .id(2L)
                .showTitle("Second Show")
                .build();
        List<Show> shows = Arrays.asList(testShow, secondShow);
        when(showRepository.findAll()).thenReturn(shows);

        List<Show> result = showService.getAllShows();

        assertThat(result).hasSize(2);
        assertThat(result).containsExactlyInAnyOrder(testShow, secondShow);
        verify(showRepository).findAll();
    }

    @Test
    void updateShow_WithValidId_ShouldUpdateAndReturnShow() {
        when(showRepository.save(any(Show.class))).thenReturn(testShow);

        Show result = showService.updateShow(testShow);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(testShow.getId());
        assertThat(result.getShowTitle()).isEqualTo(testShow.getShowTitle());
        verify(showRepository).save(testShow);
    }

    @Test
    void updateShow_WithNullId_ShouldThrowException() {
        Show showWithNullId = Show.builder()
                .showTitle("Test Show")
                .build();

        assertThatThrownBy(() -> showService.updateShow(showWithNullId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Show ID must not be null for updates");

        verify(showRepository, never()).save(any());
    }

    @Test
    void deleteShow_ShouldDeleteShow() {
        doNothing().when(showRepository).deleteById(1L);

        showService.deleteShow(1L);

        verify(showRepository).deleteById(1L);
    }
} 