package org.bomartin.tvbingo.repository;

import org.bomartin.tvbingo.model.Show;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ShowRepository extends CrudRepository<Show, Long> {
    @Query("SELECT COUNT(*) > 0 FROM tvbingo_schema.shows WHERE show_title = :showTitle")
    boolean existsByShowTitle(@Param("showTitle") String showTitle);

    @Query("SELECT COUNT(*) > 0 FROM tvbingo_schema.shows WHERE show_title = :showTitle AND id != :id")
    boolean existsByShowTitleExceptId(@Param("showTitle") String showTitle, @Param("id") Long id);
} 