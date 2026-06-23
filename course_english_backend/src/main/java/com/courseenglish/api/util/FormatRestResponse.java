package com.courseenglish.api.util;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.MethodParameter;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.courseenglish.api.domain.response.RestResponse;
import com.courseenglish.api.util.annotation.ApiMessage;

@ControllerAdvice
public class FormatRestResponse implements ResponseBodyAdvice<Object> {

    public boolean supports(MethodParameter returnType,Class converterType) {
        return true;
    }

    public Object beforeBodyWrite(Object body,
                                  MethodParameter returnType,
                                  MediaType selectedContenType,
                                  Class  selectedConverterType,
                                  ServerHttpRequest request,
                                  ServerHttpResponse response) {
        if (body instanceof String || body instanceof Resource || body instanceof SseEmitter) {
            return body;
        }
        HttpServletResponse servletResponse = ((ServletServerHttpResponse) response).getServletResponse();
        int status = servletResponse.getStatus();

        RestResponse<Object> res = new RestResponse<Object>();
        res.setStatusCode(status);

        if(status >= 400) {
            return body;
        }else {
            res.setData(body);
            ApiMessage message = returnType.getMethodAnnotation(ApiMessage.class);
            res.setMessage(message != null ? message.value() : "CALL API SUCCESS");
        }
        return res;

    }

}
