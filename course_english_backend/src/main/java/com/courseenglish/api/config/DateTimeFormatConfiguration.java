package com.courseenglish.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.format.datetime.standard.DateTimeFormatterRegistrar;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


//Lớp này implements WebMvcConfigurer, một giao diện cho phép cấu hình tùy chỉnh các thành phần của Spring MVC.
// Bằng cách triển khai giao diện này, bạn có thể cấu hình các formatter, bộ chuyển đổi (converter),
// bộ xử lý ngoại lệ, v.v., cho các ứng dụng Spring MVC.
@Configuration
public class DateTimeFormatConfiguration implements WebMvcConfigurer {
    public  void addFormatters(FormatterRegistry registry ) {
        DateTimeFormatterRegistrar registrar = new DateTimeFormatterRegistrar();
        registrar.setUseIsoFormat(true);
      //      Dòng này sẽ đăng ký các formatter mà DateTimeFormatterRegistrar tạo ra vào FormatterRegistry.
      //  Điều này có nghĩa là các đối tượng ngày giờ sẽ tự động được định dạng theo chuẩn ISO khi chúng được
        //  chuyển đổi thành chuỗi hoặc ngược lại trong các yêu cầu và phản hồi HTTP.
        registrar.registerFormatters(registry);

    }
}
