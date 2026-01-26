package org.bomartin.tvbingo.controller;

import jakarta.validation.Valid;
import org.bomartin.tvbingo.dto.ShowRequest;
import org.bomartin.tvbingo.model.Show;
import org.bomartin.tvbingo.service.ShowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/shows")
/**
 * REST controller for managing TV show bingo games.
 */
public class ShowController {
    private final ShowService showService;
    
    /**
     * Constructs a new ShowController with the specified ShowService.
     *
     * @param showService the service to handle show operations
     */
    @Autowired
    public ShowController(ShowService showService) {
        this.showService = showService;
    }
    
    /**
     * Creates a new show.
     *
     * @param request the show details
     * @return the created show
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Show createShow(@Valid @RequestBody ShowRequest request) {
        Show show = Show.builder()
            .showTitle(request.getShowTitle())
            .gameTitle(request.getGameTitle())
            .centerSquare(request.getCenterSquare())
            .phrases(request.getPhrases())
            .build();
        return showService.createShow(show);
    }
    
    /**
     * Retrieves a show by its ID.
     *
     * @param id the ID of the show
     * @return the show with the specified ID
     * @throws ResponseStatusException if the show is not found
     */
    @GetMapping("/{id}")
    public Show getShow(@PathVariable Long id) {
        return showService.getShow(id)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Show not found with id: " + id));
    }
    
    /**
     * Retrieves all shows.
     *
     * @return a list of all shows
     */
    @GetMapping
    public List<Show> getAllShows() {
        return showService.getAllShows();
    }
    
    /**
     * Updates an existing show.
     *
     * @param id the ID of the show to update
     * @param request the updated show details
     * @return the updated show
     * @throws ResponseStatusException if the show is not found
     */
    @PutMapping("/{id}")
    public Show updateShow(@PathVariable Long id, @Valid @RequestBody ShowRequest request) {
        Show show = showService.getShow(id)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Show not found with id: " + id));
        
        show.setShowTitle(request.getShowTitle());
        show.setGameTitle(request.getGameTitle());
        show.setCenterSquare(request.getCenterSquare());
        show.setPhrases(request.getPhrases());
        
        return showService.updateShow(show);
    }
    
    /**
     * Deletes a show by its ID.
     *
     * @param id the ID of the show to delete
     * @throws ResponseStatusException if the show is not found
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteShow(@PathVariable Long id) {
        // Verify show exists before attempting deletion
        showService.getShow(id)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Show not found with id: " + id));
        showService.deleteShow(id);
    }
}