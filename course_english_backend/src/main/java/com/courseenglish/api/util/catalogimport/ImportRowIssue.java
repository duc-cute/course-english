package com.courseenglish.api.util.catalogimport;

import lombok.Getter;

@Getter
public class ImportRowIssue {
    private final int excelRow;
    private final String[] rowValues;
    private final String reason;

    public ImportRowIssue(int excelRow, String[] rowValues, String reason) {
        this.excelRow = excelRow;
        this.rowValues = rowValues;
        this.reason = reason;
    }

    public String[] toReportRow(int dataColumnCount) {
        String[] out = new String[dataColumnCount + 1];
        for (int i = 0; i < dataColumnCount; i++) {
            out[i] = i < rowValues.length ? rowValues[i] : "";
        }
        out[dataColumnCount] = reason;
        return out;
    }
}
