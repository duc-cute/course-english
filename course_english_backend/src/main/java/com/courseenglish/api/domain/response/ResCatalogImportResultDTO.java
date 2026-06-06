package com.courseenglish.api.domain.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResCatalogImportResultDTO {
    private int inserted;
    private int skipped;
    private int failed;
    private boolean hasErrorReport;
    private String errorReportFileName;
    /** Base64 .xlsx — chỉ có khi có dòng lỗi hoặc bỏ qua cần báo cáo */
    private String errorReportBase64;
}
