package org.bomartin.tvbingo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.bomartin.tvbingo.validation.ValidPhrases;

import java.util.ArrayList;
import java.util.List;

@Data
public class ShowRequest {
    @NotBlank(message = "Show title is required")
    private String showTitle;

    private String gameTitle;
    private String centerSquare;

    @ValidPhrases(maxLength = 50)
    private List<String> phrases = new ArrayList<>();
} 