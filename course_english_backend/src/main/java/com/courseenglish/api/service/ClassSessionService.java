package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqClassSessionDTO;
import com.courseenglish.api.domain.request.ReqRecurringClassSessionDTO;
import com.courseenglish.api.domain.response.ResClassSessionDTO;
import com.courseenglish.api.domain.response.ResRecurringCreateDTO;
import com.courseenglish.api.domain.response.ResTeachingPlanDTO;
import com.courseenglish.api.util.constant.RecurrenceScopeEnum;
import com.courseenglish.api.util.error.IdInvalidException;

import java.time.LocalDate;
import java.util.UUID;

public interface ClassSessionService {

    ResTeachingPlanDTO getTeachingPlanToday() throws IdInvalidException;

    ResTeachingPlanDTO getTeachingPlanByDate(LocalDate date) throws IdInvalidException;

    ResTeachingPlanDTO getTeachingPlanRange(LocalDate from, LocalDate to) throws IdInvalidException;

    ResClassSessionDTO getById(UUID id) throws IdInvalidException;

    ResClassSessionDTO create(ReqClassSessionDTO request) throws IdInvalidException;

    ResRecurringCreateDTO createRecurring(ReqRecurringClassSessionDTO request) throws IdInvalidException;

    ResClassSessionDTO update(UUID id, ReqClassSessionDTO request) throws IdInvalidException;

    ResClassSessionDTO update(UUID id, ReqClassSessionDTO request, RecurrenceScopeEnum scope) throws IdInvalidException;

    ResClassSessionDTO cancel(UUID id) throws IdInvalidException;

    ResClassSessionDTO cancel(UUID id, RecurrenceScopeEnum scope) throws IdInvalidException;

    void delete(UUID id) throws IdInvalidException;
}
