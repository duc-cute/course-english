package com.courseenglish.api.service.impl;

import com.courseenglish.api.domain.*;
import com.courseenglish.api.domain.response.ResCatalogImportResultDTO;
import com.courseenglish.api.repository.*;
import com.courseenglish.api.util.catalogimport.CatalogImportType;
import com.courseenglish.api.util.catalogimport.ImportRowIssue;
import com.courseenglish.api.util.constant.GenderEnum;
import com.courseenglish.api.util.excel.ExcelSheetHelper;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.courseenglish.api.service.CatalogImportService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CatalogImportServiceImpl implements CatalogImportService {
    private static final String DEFAULT_PASSWORD = "123456";

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;
    private final SubjectRepository subjectRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PasswordEncoder passwordEncoder;

    public CatalogImportServiceImpl(
            RoleRepository roleRepository,
            UserRepository userRepository,
            ClassroomRepository classroomRepository,
            SubjectRepository subjectRepository,
            EnrollmentRepository enrollmentRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.classroomRepository = classroomRepository;
        this.subjectRepository = subjectRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Resource buildTemplate(CatalogImportType type) throws IOException {
        String fileName = type.name().toLowerCase(Locale.ROOT) + "_import_template.xlsx";
        byte[] bytes = switch (type) {
            case ROLES -> ExcelSheetHelper.buildTemplate("roles",
                    new String[]{"ma_role*", "ten_role*"},
                    new String[][]{{"STUDENT_ROLE", "Hoc sinh"}, {"TEACHER_ROLE", "Giao vien"}});
            case USERS -> ExcelSheetHelper.buildTemplate("users",
                    new String[]{"email*", "ho_ten*", "mat_khau", "ma_role", "dia_chi", "tuoi", "gioi_tinh"},
                    new String[][]{{"hs01@demo.local", "Le Van A", "123456", "STUDENT_ROLE", "Ha Noi", "16", "MALE"}});
            case CLASSROOMS -> ExcelSheetHelper.buildTemplate("classrooms",
                    new String[]{"ma_lop*", "ten_lop*", "mo_ta", "email_giao_vien"},
                    new String[][]{{"L10A1", "Lop 10A1", "Khoi 10", "giaovien1@demo.local"}});
            case SUBJECTS -> ExcelSheetHelper.buildTemplate("subjects",
                    new String[]{"ma_lop*", "ten_mon*", "thu_tu"},
                    new String[][]{{"L10A1", "Toan hoc", "1"}});
            case ENROLLMENTS -> ExcelSheetHelper.buildTemplate("enrollments",
                    new String[]{"ma_lop*", "email_hoc_sinh*", "trang_thai"},
                    new String[][]{{"L10A1", "hs01@demo.local", "ACTIVE"}});
        };
        return new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };
    }

    @Transactional
    public ResCatalogImportResultDTO importFile(CatalogImportType type, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File import trong");
        }
        return switch (type) {
            case ROLES -> importRoles(file);
            case USERS -> importUsers(file);
            case CLASSROOMS -> importClassrooms(file);
            case SUBJECTS -> importSubjects(file);
            case ENROLLMENTS -> importEnrollments(file);
        };
    }

    private ResCatalogImportResultDTO importRoles(MultipartFile file) throws IOException {
        String[] headers = {"ma_role", "ten_role"};
        List<List<String>> rows = ExcelSheetHelper.readDataRows(file, 2);
        Set<String> seenCodes = new HashSet<>();
        List<ImportRowIssue> issues = new ArrayList<>();
        int inserted = 0;
        int skipped = 0;

        int rowNum = 2;
        for (List<String> row : rows) {
            String code = val(row, 0);
            String name = val(row, 1);
            String[] raw = toArray(row, 2);

            if (code.isBlank()) {
                issues.add(new ImportRowIssue(rowNum, raw, "Ma role bat buoc"));
                rowNum++;
                continue;
            }
            if (name.isBlank()) {
                name = code;
            }
            String key = code.toUpperCase(Locale.ROOT);
            if (seenCodes.contains(key)) {
                skipped++;
                issues.add(new ImportRowIssue(rowNum, raw, "Trung ma trong file, bo qua"));
                rowNum++;
                continue;
            }
            seenCodes.add(key);
            if (roleRepository.existsByCodeAndVoidedFalse(code)) {
                skipped++;
                issues.add(new ImportRowIssue(rowNum, raw, "Trung ma trong he thong, bo qua"));
                rowNum++;
                continue;
            }
            Role role = new Role();
            role.setCode(code);
            role.setName(name);
            roleRepository.save(role);
            inserted++;
            rowNum++;
        }
        return buildResult("roles_import_errors.xlsx", headers, issues, inserted, skipped);
    }

    private ResCatalogImportResultDTO importUsers(MultipartFile file) throws IOException {
        String[] headers = {"email", "ho_ten", "mat_khau", "ma_role", "dia_chi", "tuoi", "gioi_tinh"};
        List<List<String>> rows = ExcelSheetHelper.readDataRows(file, 7);
        Set<String> seenEmails = new HashSet<>();
        List<ImportRowIssue> issues = new ArrayList<>();
        int inserted = 0;
        int skipped = 0;
        String encodedDefaultPwd = passwordEncoder.encode(DEFAULT_PASSWORD);

        int rowNum = 2;
        for (List<String> row : rows) {
            String email = val(row, 0).toLowerCase(Locale.ROOT);
            String name = val(row, 1);
            String password = val(row, 2);
            String roleCode = val(row, 3);
            String address = val(row, 4);
            String ageStr = val(row, 5);
            String genderStr = val(row, 6);
            String[] raw = toArray(row, 7);

            if (email.isBlank() || name.isBlank()) {
                issues.add(new ImportRowIssue(rowNum, raw, "Email va ho ten bat buoc"));
                rowNum++;
                continue;
            }
            if (seenEmails.contains(email)) {
                skipped++;
                issues.add(new ImportRowIssue(rowNum, raw, "Trung email trong file, bo qua"));
                rowNum++;
                continue;
            }
            seenEmails.add(email);
            if (userRepository.existsByEmailAndVoidedFalse(email)) {
                skipped++;
                issues.add(new ImportRowIssue(rowNum, raw, "Trung email trong he thong, bo qua"));
                rowNum++;
                continue;
            }

            User user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setPassword(password.isBlank() ? encodedDefaultPwd : passwordEncoder.encode(password));
            user.setAddress(address.isBlank() ? null : address);
            if (!ageStr.isBlank()) {
                try {
                    user.setAge(Integer.parseInt(ageStr));
                } catch (NumberFormatException ex) {
                    issues.add(new ImportRowIssue(rowNum, raw, "Tuoi khong hop le"));
                    rowNum++;
                    continue;
                }
            }
            user.setGender(parseGender(genderStr));

            Set<Role> roles = resolveRoles(roleCode);
            if (roles.isEmpty() && !roleCode.isBlank()) {
                issues.add(new ImportRowIssue(rowNum, raw, "Khong tim thay role: " + roleCode));
                rowNum++;
                continue;
            }
            if (roles.isEmpty()) {
                roleRepository.findByNameAndVoidedFalse("USER_ROLE")
                        .ifPresent(r -> roles.add(r));
            }
            user.setRoles(roles);
            userRepository.save(user);
            inserted++;
            rowNum++;
        }
        return buildResult("users_import_errors.xlsx", headers, issues, inserted, skipped);
    }

    private ResCatalogImportResultDTO importClassrooms(MultipartFile file) throws IOException {
        String[] headers = {"ma_lop", "ten_lop", "mo_ta", "email_giao_vien"};
        List<List<String>> rows = ExcelSheetHelper.readDataRows(file, 4);
        Set<String> seenCodes = new HashSet<>();
        List<ImportRowIssue> issues = new ArrayList<>();
        int inserted = 0;
        int skipped = 0;

        int rowNum = 2;
        for (List<String> row : rows) {
            String code = val(row, 0);
            String name = val(row, 1);
            String description = val(row, 2);
            String teacherEmail = val(row, 3).toLowerCase(Locale.ROOT);
            String[] raw = toArray(row, 4);

            if (code.isBlank() || name.isBlank()) {
                issues.add(new ImportRowIssue(rowNum, raw, "Ma lop va ten lop bat buoc"));
                rowNum++;
                continue;
            }
            String key = code.toUpperCase(Locale.ROOT);
            if (seenCodes.contains(key)) {
                skipped++;
                issues.add(new ImportRowIssue(rowNum, raw, "Trung ma trong file, bo qua"));
                rowNum++;
                continue;
            }
            seenCodes.add(key);
            if (classroomRepository.existsByCodeAndVoidedFalse(code)) {
                skipped++;
                issues.add(new ImportRowIssue(rowNum, raw, "Trung ma trong he thong, bo qua"));
                rowNum++;
                continue;
            }

            Classroom classroom = new Classroom();
            classroom.setCode(code);
            classroom.setName(name);
            classroom.setDescription(description.isBlank() ? null : description);
            if (!teacherEmail.isBlank()) {
                User teacher = userRepository.findByEmailAndVoidedFalse(teacherEmail);
                if (teacher == null) {
                    issues.add(new ImportRowIssue(rowNum, raw, "Khong tim thay giao vien: " + teacherEmail));
                    rowNum++;
                    continue;
                }
                classroom.setTeacher(teacher);
            }
            classroomRepository.save(classroom);
            inserted++;
            rowNum++;
        }
        return buildResult("classrooms_import_errors.xlsx", headers, issues, inserted, skipped);
    }

    private ResCatalogImportResultDTO importSubjects(MultipartFile file) throws IOException {
        String[] headers = {"ma_lop", "ten_mon", "thu_tu"};
        List<List<String>> rows = ExcelSheetHelper.readDataRows(file, 3);
        Set<String> seenKeys = new HashSet<>();
        List<ImportRowIssue> issues = new ArrayList<>();
        int inserted = 0;
        int skipped = 0;

        int rowNum = 2;
        for (List<String> row : rows) {
            String classroomCode = val(row, 0);
            String subjectName = val(row, 1);
            String orderStr = val(row, 2);
            String[] raw = toArray(row, 3);

            if (classroomCode.isBlank() || subjectName.isBlank()) {
                issues.add(new ImportRowIssue(rowNum, raw, "Ma lop va ten mon bat buoc"));
                rowNum++;
                continue;
            }
            String dupKey = (classroomCode + "|" + subjectName).toLowerCase(Locale.ROOT);
            if (seenKeys.contains(dupKey)) {
                skipped++;
                issues.add(new ImportRowIssue(rowNum, raw, "Trung ma mon trong file, bo qua"));
                rowNum++;
                continue;
            }
            seenKeys.add(dupKey);

            Classroom classroom = findClassroomByCode(classroomCode);
            if (classroom == null) {
                issues.add(new ImportRowIssue(rowNum, raw, "Khong tim thay lop: " + classroomCode));
                rowNum++;
                continue;
            }
            if (subjectExistsInClassroom(classroom.getId(), subjectName)) {
                skipped++;
                issues.add(new ImportRowIssue(rowNum, raw, "Trung mon trong lop, bo qua"));
                rowNum++;
                continue;
            }

            int displayOrder = 0;
            if (!orderStr.isBlank()) {
                try {
                    displayOrder = Integer.parseInt(orderStr);
                } catch (NumberFormatException ex) {
                    issues.add(new ImportRowIssue(rowNum, raw, "Thu tu khong hop le"));
                    rowNum++;
                    continue;
                }
            }

            Subject subject = new Subject();
            subject.setName(subjectName);
            subject.setDisplayOrder(displayOrder);
            subject.setClassroom(classroom);
            subjectRepository.save(subject);
            inserted++;
            rowNum++;
        }
        return buildResult("subjects_import_errors.xlsx", headers, issues, inserted, skipped);
    }

    private ResCatalogImportResultDTO importEnrollments(MultipartFile file) throws IOException {
        String[] headers = {"ma_lop", "email_hoc_sinh", "trang_thai"};
        List<List<String>> rows = ExcelSheetHelper.readDataRows(file, 3);
        Set<String> seenKeys = new HashSet<>();
        List<ImportRowIssue> issues = new ArrayList<>();
        int inserted = 0;
        int skipped = 0;

        int rowNum = 2;
        for (List<String> row : rows) {
            String classroomCode = val(row, 0);
            String studentEmail = val(row, 1).toLowerCase(Locale.ROOT);
            String status = val(row, 2);
            String[] raw = toArray(row, 3);

            if (classroomCode.isBlank() || studentEmail.isBlank()) {
                issues.add(new ImportRowIssue(rowNum, raw, "Ma lop va email hoc sinh bat buoc"));
                rowNum++;
                continue;
            }
            String dupKey = (classroomCode + "|" + studentEmail).toLowerCase(Locale.ROOT);
            if (seenKeys.contains(dupKey)) {
                skipped++;
                issues.add(new ImportRowIssue(rowNum, raw, "Trung phan lop trong file, bo qua"));
                rowNum++;
                continue;
            }
            seenKeys.add(dupKey);

            Classroom classroom = findClassroomByCode(classroomCode);
            if (classroom == null) {
                issues.add(new ImportRowIssue(rowNum, raw, "Khong tim thay lop: " + classroomCode));
                rowNum++;
                continue;
            }
            User student = userRepository.findByEmailAndVoidedFalse(studentEmail);
            if (student == null) {
                issues.add(new ImportRowIssue(rowNum, raw, "Khong tim thay hoc sinh: " + studentEmail));
                rowNum++;
                continue;
            }
            if (!isStudent(student)) {
                issues.add(new ImportRowIssue(rowNum, raw, "User khong co role STUDENT_ROLE"));
                rowNum++;
                continue;
            }
            if (enrollmentRepository.existsByClassroom_IdAndStudent_IdAndVoidedFalse(classroom.getId(), student.getId())) {
                skipped++;
                issues.add(new ImportRowIssue(rowNum, raw, "Trung phan lop trong he thong, bo qua"));
                rowNum++;
                continue;
            }

            Enrollment enrollment = new Enrollment();
            enrollment.setClassroom(classroom);
            enrollment.setStudent(student);
            enrollment.setStatus(normalizeStatus(status));
            enrollment.setJoinedAt(Instant.now());
            enrollmentRepository.save(enrollment);
            inserted++;
            rowNum++;
        }
        return buildResult("enrollments_import_errors.xlsx", headers, issues, inserted, skipped);
    }

    private boolean subjectExistsInClassroom(UUID classroomId, String subjectName) {
        return subjectRepository.findAll().stream()
                .filter(s -> !s.isVoided())
                .filter(s -> s.getClassroom() != null && classroomId.equals(s.getClassroom().getId()))
                .anyMatch(s -> subjectName.equalsIgnoreCase(s.getName()));
    }

    private Classroom findClassroomByCode(String code) {
        return classroomRepository.findByCodeAndVoidedFalse(code).orElse(null);
    }

    private Set<Role> resolveRoles(String roleCode) {
        if (roleCode == null || roleCode.isBlank()) {
            return new HashSet<>();
        }
        Set<Role> roles = new HashSet<>();
        for (String part : roleCode.split("[,;]")) {
            String code = part.trim();
            if (code.isEmpty()) continue;
            Optional<Role> byCode = roleRepository.findByCodeAndVoidedFalse(code);
            if (byCode.isPresent()) {
                roles.add(byCode.get());
                continue;
            }
            roleRepository.findByNameAndVoidedFalse(code).ifPresent(roles::add);
        }
        return roles;
    }

    private boolean isStudent(User user) {
        if (user.getRoles() == null) return false;
        return user.getRoles().stream().map(Role::getName).anyMatch("STUDENT_ROLE"::equals);
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "ACTIVE";
        String n = status.trim().toUpperCase(Locale.ROOT);
        return ("INACTIVE".equals(n) || "ACTIVE".equals(n)) ? n : "ACTIVE";
    }

    private GenderEnum parseGender(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String v = raw.trim().toUpperCase(Locale.ROOT);
        if (v.startsWith("M") || "NAM".equals(v)) return GenderEnum.MALE;
        if (v.startsWith("F") || "NU".equals(v) || "NỮ".equalsIgnoreCase(raw.trim())) return GenderEnum.FEMALE;
        return null;
    }

    private ResCatalogImportResultDTO buildResult(
            String errorFileName,
            String[] headers,
            List<ImportRowIssue> issues,
            int inserted,
            int skipped
    ) throws IOException {
        ResCatalogImportResultDTO dto = new ResCatalogImportResultDTO();
        dto.setInserted(inserted);
        dto.setSkipped(skipped);
        dto.setFailed((int) issues.stream().filter(i -> !i.getReason().contains("bo qua")).count());

        if (!issues.isEmpty()) {
            List<String[]> reportRows = issues.stream()
                    .map(i -> i.toReportRow(headers.length))
                    .collect(Collectors.toList());
            byte[] reportBytes = ExcelSheetHelper.buildErrorReport("errors", headers, reportRows);
            dto.setHasErrorReport(true);
            dto.setErrorReportFileName(errorFileName);
            dto.setErrorReportBase64(Base64.getEncoder().encodeToString(reportBytes));
        } else {
            dto.setHasErrorReport(false);
        }
        return dto;
    }

    private static String val(List<String> row, int index) {
        if (index >= row.size() || row.get(index) == null) return "";
        return row.get(index).trim();
    }

    private static String[] toArray(List<String> row, int size) {
        String[] arr = new String[size];
        for (int i = 0; i < size; i++) {
            arr[i] = val(row, i);
        }
        return arr;
    }
}
