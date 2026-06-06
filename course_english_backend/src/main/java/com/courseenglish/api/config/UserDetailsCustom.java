package com.courseenglish.api.config;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import com.courseenglish.api.service.UserService;

import com.courseenglish.api.domain.Role;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
@Component("userDetailsService")
public class UserDetailsCustom implements UserDetailsService {
    private final UserService userService;

    public UserDetailsCustom(UserService userService) {
        this.userService = userService;
    }

    public UserDetails loadUserByUsername(String userName) throws UsernameNotFoundException {
        com.courseenglish.api.domain.User user = this.userService.handleGetUserByUserName(userName);
        if(user == null) {
            throw  new UsernameNotFoundException("UserName/Password không hợp lệ");
        }

        List<String> roleNames = user.getRoles() == null
                ? Collections.emptyList()
                : user.getRoles().stream().map(Role::getName).filter(Objects::nonNull).collect(Collectors.toList());

        List<SimpleGrantedAuthority> authorities = roleNames.isEmpty()
                ? Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                : roleNames.stream()
                .map(this::toSpringAuthority)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        return new User(user.getEmail(), user.getPassword(), authorities);

    }

    private String toSpringAuthority(String roleName) {
        if (roleName == null || roleName.isBlank()) return "ROLE_USER";
        String trimmed = roleName.trim();
        if (trimmed.startsWith("ROLE_")) return trimmed;
        if (trimmed.endsWith("_ROLE")) {
            String prefix = trimmed.substring(0, trimmed.length() - "_ROLE".length());
            return "ROLE_" + (prefix.isBlank() ? "USER" : prefix);
        }
        return "ROLE_" + trimmed;
    }
}
