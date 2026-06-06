package com.courseenglish.api.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.courseenglish.api.domain.Skill;
import com.courseenglish.api.domain.response.ResultPaginationDTO;

public interface SkillService {

    boolean isSkillExist(String skill);

    Skill handleCreateSkill(Skill dto);

    Skill getById(UUID id);

    Skill updateSkill(Skill dto);

    ResultPaginationDTO getAllSkill(Specification<Skill> spec, Pageable pageable);

    List<Skill> findByIdIn(List<UUID> listId);
}
