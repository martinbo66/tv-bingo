package org.bomartin.tvbingo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ShowRequest {
    @NotBlank(message = "Show title is required")
    private String showTitle;
    
    private String gameTitle;
    private String centerSquare;
    private List<String> phrases = new ArrayList<>();
} 