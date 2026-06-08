package com.courseenglish.api.util;

import com.nimbusds.jose.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import com.courseenglish.api.domain.response.ResLoginDTO;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class SercurityUtil {
    private JwtEncoder jwtEncoder;//dùng để mã hóa + tạo jwt

    public SercurityUtil(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public static  final MacAlgorithm JWT_ALGORITHM =MacAlgorithm.HS256;

    @Value("${duccute.jwt.base64-secret}")
    private String jwtKey;//khóa bí mật


    @Value("${duccute.jwt.access-token-validity-in-seconds}")
    private long accessTokenExpiration;

    @Value("${duccute.jwt.refresh-token-validity-in-seconds}")
    private long refreshTokenExpiration;

    public String createAccessToken(String email,ResLoginDTO dto ) {
        ResLoginDTO.UserInsightToken userToken = new ResLoginDTO.UserInsightToken();
        userToken.setId(dto.getUser().getId());
        userToken.setName(dto.getUser().getName());
        userToken.setEmail(dto.getUser().getEmail());

        Instant now = Instant.now();
        Instant validity =now.plus(this.accessTokenExpiration, ChronoUnit.SECONDS);//tính thời gian hết hạn = lấy now + thời gian expire

        List<String> listAuthority = new ArrayList<String>();
        listAuthority.add("ROLE_USER_CREATE");
        listAuthority.add("ROLE_USER_UPDATE");
        JwtClaimsSet claims =JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(validity)
                .subject(email)
                .claim("duccute",userToken)
                .claim("permission",listAuthority)
                .build();

        JwsHeader jwsHeader =JwsHeader.with(JWT_ALGORITHM).build();

        return this.jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader,claims)).getTokenValue();

    }

    public String createRefreshToken(String email, ResLoginDTO dto) {
        ResLoginDTO.UserInsightToken userToken = new ResLoginDTO.UserInsightToken();
        userToken.setId(dto.getUser().getId());
        userToken.setName(dto.getUser().getName());
        userToken.setEmail(dto.getUser().getEmail());
        Instant now = Instant.now();
        Instant validity =now.plus(this.refreshTokenExpiration, ChronoUnit.SECONDS);//tính thời gian hết hạn = lấy now + thời gian expire

        JwtClaimsSet claims =JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(validity)
                .subject(email)
                .claim("user",userToken)
                .build();

        JwsHeader jwsHeader =JwsHeader.with(JWT_ALGORITHM).build();

        return this.jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader,claims)).getTokenValue();

    }
    public static Optional<String> getCurrentUserLogin() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        return Optional.ofNullable(extractPrincipal(securityContext.getAuthentication()));

    }

    /** UUID từ JWT claim `duccute.id` (access token sau login). */
    @SuppressWarnings("unchecked")
    public static Optional<UUID> getCurrentUserId() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        Authentication authentication = securityContext.getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return Optional.empty();
        }
        Object claim = jwt.getClaim("duccute");
        if (claim instanceof Map<?, ?> map) {
            Object id = map.get("id");
            if (id != null) {
                try {
                    return Optional.of(UUID.fromString(id.toString()));
                } catch (IllegalArgumentException ignored) {
                    return Optional.empty();
                }
            }
        }
        return Optional.empty();
    }

    private static String extractPrincipal(Authentication authentication) {
        if(authentication == null) return null;
        else if(authentication.getPrincipal() instanceof UserDetails springSecurityUser) {
            return springSecurityUser.getUsername();
        }else if(authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getSubject();

        }else if(authentication.getPrincipal() instanceof  String s) {
            return s;
        }
        return null;
    }
    public static Optional<String> getCurrentUserJWT() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        return Optional.ofNullable(securityContext.getAuthentication())
                .filter(authentication -> authentication.getCredentials() instanceof String)
                .map(authentication -> (String) authentication.getCredentials());
    }

    public SecretKey getSecretKey() {
        byte[] keyBytes = Base64.from(jwtKey).decode();
        return new SecretKeySpec(keyBytes,0,keyBytes.length, SercurityUtil.JWT_ALGORITHM.getName());
    }

    public Jwt checkValidRefreshToken(String token) {
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withSecretKey(
                getSecretKey()).macAlgorithm(SercurityUtil.JWT_ALGORITHM).build();
            try {
                return jwtDecoder.decode(token);
            } catch (Exception e) {
                System.out.println(">>> JWT error: " + e.getMessage());
                throw e;
            }
    }

}
