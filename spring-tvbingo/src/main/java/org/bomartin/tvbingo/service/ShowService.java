package org.bomartin.tvbingo.service;

import org.bomartin.tvbingo.model.Show;
import org.bomartin.tvbingo.repository.ShowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
public class ShowService {
    private final ShowRepository showRepository;
    
    @Autowired
    public ShowService(ShowRepository showRepository) {
        this.showRepository = showRepository;
    }
    
    public Show createShow(Show show) {
        return showRepository.save(show);
    }
    
    public Optional<Show> getShow(Long id) {
        return showRepository.findById(id);
    }
    
    public List<Show> getAllShows() {
        return StreamSupport.stream(showRepository.findAll().spliterator(), false)
                .collect(Collectors.toList());
    }
    
    public Show updateShow(Show show) {
        if (show.getId() == null) {
            throw new IllegalArgumentException("Show ID must not be null for updates");
        }
        
        // Check if another show with the same title already exists (excluding current show)
        if (showRepository.existsByShowTitleExceptId(show.getShowTitle(), show.getId())) {
            throw new IllegalArgumentException("Show title must be unique");
        }
        
        return showRepository.save(show);
    }
    
    public void deleteShow(Long id) {
        showRepository.deleteById(id);
    }
} 