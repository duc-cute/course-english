package com.courseenglish.api.domain;

import com.courseenglish.api.util.constant.AiDocumentStatusEnum;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(
        name = "ai_documents",
        indexes = {
                @Index(name = "idx_ai_doc_user", columnList = "user_id,created_at"),
                @Index(name = "idx_ai_doc_status", columnList = "status")
        }
)
@Getter
@Setter
public class AiDocument extends BaseObject {

  public static final String STORAGE_FOLDER = "ai-documents";

  @JdbcTypeCode(SqlTypes.CHAR)
  @Column(name = "user_id", nullable = false, length = 36)
  private UUID userId;

  @Column(name = "file_name", nullable = false, length = 255)
  private String fileName;

  @Column(name = "mime_type", length = 128)
  private String mimeType;

  @Column(name = "storage_folder", nullable = false, length = 128)
  private String storageFolder;

  @Column(name = "storage_file_name", nullable = false, length = 255)
  private String storageFileName;

  @Column(name = "file_size_bytes")
  private Long fileSizeBytes;

  @Column(name = "page_count")
  private Integer pageCount;

  @Column(name = "extracted_text", columnDefinition = "LONGTEXT")
  private String extractedText;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 20)
  private AiDocumentStatusEnum status = AiDocumentStatusEnum.UPLOADED;

  @Column(name = "error_message", columnDefinition = "TEXT")
  private String errorMessage;
}
