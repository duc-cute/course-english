package com.courseenglish.api.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import com.courseenglish.api.domain.response.RestResponse;

import java.io.IOException;
import java.util.Optional;

@Component
public class CustomAuthenticationEntryPoint  implements AuthenticationEntryPoint {
   // Đây là một đối tượng của lớp BearerTokenAuthenticationEntryPoint,
   // một lớp mặc định trong Spring Security được sử dụng để xử lý các trường hợp
   // lỗi xác thực liên quan đến bearer token (JWT).
    private final AuthenticationEntryPoint delegate = new BearerTokenAuthenticationEntryPoint();
  //  ObjectMapper là một công cụ của thư viện Jackson dùng để chuyển đổi giữa đối tượng Java và JSON.
  //  Ở đây, nó được sử dụng để chuyển đổi một đối tượng Java (cụ thể là RestResponse<Object>)
  //  thành một chuỗi JSON và ghi nó vào phản hồi HTTP.
    private final ObjectMapper mapper;

    public CustomAuthenticationEntryPoint(ObjectMapper mapper) {
        this.mapper = mapper;
    }

   // Đây là phương thức sẽ được gọi khi một yêu cầu không được xác thực hoặc xác thực thất bại.
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException)  throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");

        RestResponse<Object> res = new RestResponse<Object>();
        res.setStatusCode(HttpStatus.UNAUTHORIZED.value());
        String errorMessage = Optional.ofNullable(authException.getCause()) // NULL
                .map(Throwable::getMessage)
                .orElse(authException.getMessage());
        res.setError(errorMessage);

        res.setMessage("Token không hợp lệ (hết hạn, không đúng định dạng, hoặc không truyền JWT ở header)...");
        mapper.writeValue(response.getWriter(), res);


    }

}
