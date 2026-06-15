package com.courseenglish.api.service.slide;

import java.io.IOException;
import java.util.List;

public interface PdfRenderService {

    List<byte[]> renderPdfToPngPages(byte[] pdfBytes, int dpi) throws IOException;
}
