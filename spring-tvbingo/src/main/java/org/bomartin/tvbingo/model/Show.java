package org.bomartin.tvbingo.model;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table("shows")
public class Show {
    @Id
    private Long id;
    
    @NotBlank(message = "Show title is required")
    @Column("show_title")
    private String showTitle;
    
    @Column("game_title")
    private String gameTitle;
    
    @Column("center_square")
    private String centerSquare;
    
    @Builder.Default
    private List<String> phrases = new ArrayList<>();
} 