package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqCreateInnovationCommentDTO;
import com.courseenglish.api.domain.request.ReqCreateInnovationIdeaDTO;
import com.courseenglish.api.domain.request.ReqSearchInnovationIdeaDTO;
import com.courseenglish.api.domain.request.ReqUpdateInnovationIdeaStatusDTO;
import com.courseenglish.api.domain.response.ResInnovationCommentDTO;
import com.courseenglish.api.domain.response.ResInnovationHubStatsDTO;
import com.courseenglish.api.domain.response.ResInnovationIdeaDTO;
import com.courseenglish.api.domain.response.ResInnovationVoteToggleDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.List;
import java.util.UUID;

public interface InnovationIdeaService {

    ResultPaginationDTO search(ReqSearchInnovationIdeaDTO req) throws IdInvalidException;

    ResInnovationIdeaDTO getById(UUID id) throws IdInvalidException;

    ResInnovationIdeaDTO create(ReqCreateInnovationIdeaDTO req) throws IdInvalidException;

    ResInnovationIdeaDTO updateStatus(UUID id, ReqUpdateInnovationIdeaStatusDTO req) throws IdInvalidException;

    ResInnovationVoteToggleDTO toggleVote(UUID ideaId) throws IdInvalidException;

    List<ResInnovationCommentDTO> listComments(UUID ideaId) throws IdInvalidException;

    ResInnovationCommentDTO createComment(UUID ideaId, ReqCreateInnovationCommentDTO req) throws IdInvalidException;

    ResInnovationHubStatsDTO getStatsSummary() throws IdInvalidException;
}
