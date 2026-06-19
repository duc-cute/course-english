package com.courseenglish.api.util.constant;

/**
 * Cách user xác thực với hệ thống.
 * LOCAL — email + mật khẩu
 * GOOGLE — chỉ đăng nhập Google (không có mật khẩu local)
 * LINKED — đã liên kết cả email/password và Google
 */
public enum AuthProviderEnum {
    LOCAL,
    GOOGLE,
    LINKED
}
