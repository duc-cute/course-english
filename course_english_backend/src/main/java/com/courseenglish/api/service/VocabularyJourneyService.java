package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqSearchVocabularyJourneyDTO;
import com.courseenglish.api.domain.request.ReqVocabularyJourneyClassroomsDTO;
import com.courseenglish.api.domain.request.ReqVocabularyJourneyDTO;
import com.courseenglish.api.domain.request.ReqVocabularyTopicDTO;
import com.courseenglish.api.domain.request.ReqVocabularyTopicMembersDTO;
import com.courseenglish.api.domain.response.ResVocabularyJourneyDTO;
import com.courseenglish.api.domain.response.ResVocabularyTopicDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.List;
import java.util.UUID;

public interface VocabularyJourneyService {

    ResultPaginationDTO search(ReqSearchVocabularyJourneyDTO request) throws IdInvalidException;

    ResVocabularyJourneyDTO getById(UUID id) throws IdInvalidException;

    ResVocabularyJourneyDTO create(ReqVocabularyJourneyDTO request) throws IdInvalidException;

    ResVocabularyJourneyDTO update(UUID id, ReqVocabularyJourneyDTO request) throws IdInvalidException;

    void delete(UUID id) throws IdInvalidException;

    ResVocabularyJourneyDTO replaceClassrooms(UUID journeyId, ReqVocabularyJourneyClassroomsDTO request)
            throws IdInvalidException;

    List<ResVocabularyTopicDTO> listTopics(UUID journeyId) throws IdInvalidException;

    ResVocabularyTopicDTO getTopic(UUID topicId) throws IdInvalidException;

    ResVocabularyTopicDTO createTopic(ReqVocabularyTopicDTO request) throws IdInvalidException;

    ResVocabularyTopicDTO updateTopic(UUID topicId, ReqVocabularyTopicDTO request) throws IdInvalidException;

    void deleteTopic(UUID topicId) throws IdInvalidException;

    ResVocabularyTopicDTO replaceTopicMembers(UUID topicId, ReqVocabularyTopicMembersDTO request)
            throws IdInvalidException;

    List<ResVocabularyJourneyDTO> listForCurrentStudent() throws IdInvalidException;

    ResVocabularyJourneyDTO getForCurrentStudent(UUID journeyId) throws IdInvalidException;

    ResVocabularyTopicDTO getTopicSetsForCurrentStudent(UUID topicId) throws IdInvalidException;
}
