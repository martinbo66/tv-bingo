package org.bomartin.tvbingo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.bomartin.tvbingo.validation.ValidPhrases;

import java.util.ArrayList;
import java.util.List;

@Data
public class ShowRequest {
    // Field length limits mirror the frontend's VALIDATION_LIMITS
    // (vue-tvbingo/src/constants/formValidation.ts) so client and server agree.
    @NotBlank(message = "Show title is required")
    @Size(max = 100, message = "Show title must be 100 characters or less")
    private String showTitle;

    @Size(max = 100, message = "Game title must be 100 characters or less")
    private String gameTitle;

    @Size(max = 50, message = "Center square must be 50 characters or less")
    private String centerSquare;

    // Per-phrase length (50) is enforced by @ValidPhrases; cap the list size to
    // bound the persisted payload from anonymous clients. A 5x5 card needs 24,
    // but a larger phrase pool is supported (see EdgeCaseTests, which uses 150).
    @Size(max = 150, message = "A show cannot have more than 150 phrases")
    @ValidPhrases(maxLength = 50)
    private List<String> phrases = new ArrayList<>();
}