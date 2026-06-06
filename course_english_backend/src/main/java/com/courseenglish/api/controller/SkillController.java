package com.courseenglish.api.controller;

import com.turkraft.springfilter.boot.Filter;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.courseenglish.api.domain.Skill;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.SkillService;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class SkillController {

    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @PostMapping("/skills")
    @ApiMessage("create skill")
    public ResponseEntity<Skill> createSkill(@Valid @RequestBody Skill dto) throws IdInvalidException {
        boolean existSkill = this.skillService.isSkillExist(dto.getName());
        if (existSkill)
            throw new IdInvalidException("Skill is exist !!!");
        Skill newSkill = this.skillService.handleCreateSkill(dto);
        return new ResponseEntity<>(newSkill, (newSkill != null ? HttpStatus.OK : HttpStatus.BAD_REQUEST));
    }

    @PutMapping("/skills")
    @ApiMessage("update skill")
    public ResponseEntity<Skill> updateSkill(@Valid @RequestBody Skill dto) throws IdInvalidException {
        Skill currentSkill = this.skillService.getById(dto.getId());
        if (dto.getName() != null) {
            if (currentSkill == null)
                throw new IdInvalidException("Skill " + dto.getName() + " is null!!");
            if (this.skillService.isSkillExist(dto.getName()))
                throw new IdInvalidException("Skill name " + dto.getName() + " is exist!");
            currentSkill.setName(dto.getName());
        }

        Skill res = this.skillService.updateSkill(currentSkill);

        return ResponseEntity.ok().body(res);
    }

    @GetMapping("/skills/{id}")
    @ApiMessage("Get a skill")
    public ResponseEntity<Skill> getSkillById(@PathVariable UUID id) throws IdInvalidException {
        Skill currentSkill = this.skillService.getById(id);
        if (currentSkill == null)
            throw new IdInvalidException("Skill is not found");

        return new ResponseEntity<>(currentSkill, currentSkill != null ? HttpStatus.OK : HttpStatus.BAD_REQUEST);
    }

    @GetMapping("/skills")
    @ApiMessage("fetch skills")
    public ResponseEntity<ResultPaginationDTO> fetchSkills(@Filter Specification<Skill> spec, Pageable pageable) {
        ResultPaginationDTO result = this.skillService.getAllSkill(spec, pageable);

        return ResponseEntity.status(HttpStatus.OK).body(result);
    }
}
