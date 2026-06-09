package com.courseenglish.api.service;

import com.courseenglish.api.domain.request.ReqCheckSystemConfigKeyDTO;
import com.courseenglish.api.domain.request.ReqSearchSystemConfigDTO;
import com.courseenglish.api.domain.request.ReqSystemConfigDTO;
import com.courseenglish.api.domain.response.ResFeatureFlagsDTO;
import com.courseenglish.api.domain.response.ResSystemConfigDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.UUID;

public interface SystemConfigService {

    void initConfig();

    ResultPaginationDTO search(ReqSearchSystemConfigDTO req);

    ResSystemConfigDTO getById(UUID id) throws IdInvalidException;

    ResSystemConfigDTO saveOrUpdate(ReqSystemConfigDTO request) throws IdInvalidException;

    void delete(UUID id) throws IdInvalidException;

    boolean isConfigKeyTaken(ReqCheckSystemConfigKeyDTO request);

    ResFeatureFlagsDTO getFeatureFlags();
}
