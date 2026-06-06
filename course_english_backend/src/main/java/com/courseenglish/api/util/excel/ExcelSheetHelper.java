package com.courseenglish.api.util.excel;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public final class ExcelSheetHelper {
    private ExcelSheetHelper() {
    }

    public static byte[] buildTemplate(String sheetName, String[] headers, String[][] sampleRows) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(sheetName);
            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5200);
            }

            if (sampleRows != null) {
                for (int r = 0; r < sampleRows.length; r++) {
                    Row row = sheet.createRow(r + 1);
                    String[] values = sampleRows[r];
                    for (int c = 0; c < values.length; c++) {
                        row.createCell(c).setCellValue(values[c]);
                    }
                }
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public static List<List<String>> readDataRows(MultipartFile file, int columnCount) throws IOException {
        List<List<String>> rows = new ArrayList<>();
        try (InputStream in = file.getInputStream(); Workbook workbook = WorkbookFactory.create(in)) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                return rows;
            }
            int lastRow = sheet.getLastRowNum();
            for (int i = 1; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isEmptyRow(row, columnCount)) {
                    continue;
                }
                List<String> cells = new ArrayList<>();
                for (int c = 0; c < columnCount; c++) {
                    cells.add(getCellString(row.getCell(c)));
                }
                rows.add(cells);
            }
        }
        return rows;
    }

    public static byte[] buildErrorReport(String sheetName, String[] headers, List<String[]> errorRows) throws IOException {
        String[] allHeaders = new String[headers.length + 1];
        System.arraycopy(headers, 0, allHeaders, 0, headers.length);
        allHeaders[headers.length] = "Loi";

        String[][] data = errorRows.stream()
                .map(row -> row)
                .toArray(String[][]::new);
        return buildTemplate(sheetName, allHeaders, data);
    }

    private static boolean isEmptyRow(Row row, int columnCount) {
        for (int c = 0; c < columnCount; c++) {
            if (!getCellString(row.getCell(c)).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private static String getCellString(Cell cell) {
        if (cell == null) {
            return "";
        }
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toString();
                }
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            default -> "";
        };
    }
}
