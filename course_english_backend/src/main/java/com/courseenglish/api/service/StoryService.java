package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqSearchStoryDTO;
import com.courseenglish.api.domain.request.ReqStoryDTO;
import com.courseenglish.api.domain.response.ResStoryDTO;
import com.courseenglish.api.domain.response.ResStoryReaderPayloadDTO;
import com.courseenglish.api.domain.response.ResStoryWordLookupDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.util.error.IdInvalidException;
import org.springframework.data.jpa.domain.Specification;
import com.courseenglish.api.domain.Story;

import java.util.UUID;

public interface StoryService {

    ResultPaginationDTO search(ReqSearchStoryDTO req);

    ResultPaginationDTO searchWithSpec(ReqSearchStoryDTO req, Specification<Story> spec);

    ResStoryDTO getById(UUID id) throws IdInvalidException;

    ResStoryReaderPayloadDTO getReaderPayloadById(UUID id) throws IdInvalidException;

    ResStoryReaderPayloadDTO getReaderPayloadBySlug(String slug) throws IdInvalidException;

    ResStoryWordLookupDTO lookupWord(String word) throws IdInvalidException;

    ResStoryDTO create(ReqStoryDTO request) throws IdInvalidException;

    ResStoryDTO update(UUID id, ReqStoryDTO request) throws IdInvalidException;

    void delete(UUID id) throws IdInvalidException;
}
