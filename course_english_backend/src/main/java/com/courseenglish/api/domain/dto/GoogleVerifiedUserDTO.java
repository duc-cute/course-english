package com.courseenglish.api.domain.dto;

public record GoogleVerifiedUserDTO(
        String sub,
        String email,
        String name,
        String picture
) {}
