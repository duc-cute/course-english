package com.courseenglish.api.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import com.courseenglish.api.service.UserService;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.Role;
import com.courseenglish.api.domain.response.ResCreateUserDTO;
import com.courseenglish.api.domain.response.ResUpdateUserDTO;
import com.courseenglish.api.domain.response.ResUserDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.repository.RoleRepository;
import com.courseenglish.api.repository.UserRepository;
import com.courseenglish.api.util.SercurityUtil;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserServiceImpl(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    public User handleCreateUser(User user) {
        Set<Role> roles = resolveRolesFromRequest(user);
        if (roles != null && !roles.isEmpty()) {
            user.setRoles(roles);
        }
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            Role userRole = ensureRole("USER_ROLE");
            Set<Role> fallback = new HashSet<>();
            fallback.add(userRole);
            user.setRoles(fallback);
        }
        user.setAvatarUrl(trimOrNull(user.getAvatarUrl()));
        return this.userRepository.save(user);
    }

    public User handleSaveUser(User user) {
        return this.userRepository.save(user);
    }

    public void deleteUser(UUID id) {
        User user = this.getUserById(id);
        if (user != null) {
            user.setVoided(true);
            this.userRepository.save(user);
        }
    }

    public boolean isEmailExist(String email) {
        return this.userRepository.existsByEmailAndVoidedFalse(email);
    }

    public User handleGetUserByUserName(String userName) {
        return this.userRepository.findByEmailAndVoidedFalse(userName);
    }

    public User getUserById(UUID id) {
        Optional<User> user = this.userRepository.findByIdAndVoidedFalse(id);
        return user.orElse(null);
    }

    public ResultPaginationDTO getAllUsers(Specification<User> spec, Pageable pageable) {
        Specification<User> notVoidedSpec = (root, query, cb) -> cb.isFalse(root.get("voided"));
        Specification<User> finalSpec = spec == null
                ? notVoidedSpec
                : spec.and(notVoidedSpec);
        Page<User> pUser = this.userRepository.findAll(finalSpec, pageable);
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();
        ResultPaginationDTO result = new ResultPaginationDTO();
        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());
        mt.setTotal(pUser.getTotalElements());
        mt.setPages(pUser.getTotalPages());
        result.setMeta(mt);

        List<ResUserDTO> listUser = pUser.getContent()
                .stream().map(this::convertToResUserDTO).collect(Collectors.toList());
        result.setResult(listUser);
        return result;
    }

    public User updateUser(User userUpdate) {
        String email = SercurityUtil.getCurrentUserLogin().isPresent() ? SercurityUtil.getCurrentUserLogin().get() : "";
        User currentUser = this.handleGetUserByUserName(email);
        if (userUpdate != null) {
            currentUser.setAge(userUpdate.getAge());
            currentUser.setName(userUpdate.getName());
            currentUser.setAddress(userUpdate.getAddress());
            currentUser.setGender(userUpdate.getGender());
            if (userUpdate.getAvatarUrl() != null) {
                currentUser.setAvatarUrl(trimOrNull(userUpdate.getAvatarUrl()));
            }

            currentUser = this.userRepository.save(currentUser);
        }
        return currentUser;
    }

    public User updateUserByAdmin(User userUpdate) {
        User user = this.getUserById(userUpdate.getId());

        if (user != null && userUpdate != null) {
            user.setAge(userUpdate.getAge());
            user.setName(userUpdate.getName());
            user.setAddress(userUpdate.getAddress());
            user.setGender(userUpdate.getGender());
            if (userUpdate.getEmail() != null && !userUpdate.getEmail().isBlank()) {
                user.setEmail(userUpdate.getEmail().trim());
            }
            if (userUpdate.getAvatarUrl() != null) {
                user.setAvatarUrl(trimOrNull(userUpdate.getAvatarUrl()));
            }

            Set<Role> roles = resolveRolesFromRequest(userUpdate);
            if (roles != null && !roles.isEmpty()) {
                user.setRoles(roles);
            }

            user = this.userRepository.save(user);
        }
        return user;
    }

    private Set<Role> resolveRolesFromRequest(User requestUser) {
        // Prefer `rolesRequested` if present; otherwise fall back to single `role`.
        List<String> requestedNames = new ArrayList<>();

        // roleNames (via @JsonProperty("roleNames")) takes priority — no UUID collision
        if (requestUser.getRolesRequested() != null && !requestUser.getRolesRequested().isEmpty()) {
            requestedNames.addAll(requestUser.getRolesRequested());
        } else if (requestUser.getRole() != null && !requestUser.getRole().isBlank()) {
            // allow comma-separated roles in legacy payload
            String raw = requestUser.getRole();
            String[] parts = raw.split("[,;]");
            for (String p : parts) {
                if (p != null && !p.isBlank()) {
                    requestedNames.add(p.trim());
                }
            }
        }

        // If nothing specified => return empty to mean "don't touch roles" (except create flow).
        if (requestedNames.isEmpty()) {
            return new HashSet<>();
        }

        return requestedNames.stream()
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .map(this::ensureRole)
                .collect(Collectors.toSet());
    }

    private Role ensureRole(String roleName) {
        String normalized = roleName == null ? "" : roleName.trim();
        if (normalized.isEmpty()) {
            normalized = "USER_ROLE";
        }
        Optional<Role> existing = roleRepository.findByNameAndVoidedFalse(normalized);
        if (existing.isPresent()) {
            return existing.get();
        }
        Optional<Role> byCode = roleRepository.findByCodeAndVoidedFalse(normalized);
        if (byCode.isPresent()) {
            return byCode.get();
        }

        Role created = new Role();
        created.setName(normalized);
        created.setCode(normalized);
        created.setVoided(false);
        return roleRepository.save(created);
    }

    public void updateUserToken(String token, String email) {
        User currentUser = this.handleGetUserByUserName(email);
        if (currentUser != null) {
            currentUser.setRefreshToken(token);
            this.userRepository.save(currentUser);
        }
    }

    public ResCreateUserDTO convertToResCreateUserDTO(User user) {
        ResCreateUserDTO res = new ResCreateUserDTO();
        res.setEmail(user.getEmail());
        res.setName(user.getName());
        res.setAge(user.getAge());
        res.setGender(user.getGender());
        res.setCreatedAt(user.getCreatedAt());
        res.setId(user.getId());

        return res;
    }

    public ResUpdateUserDTO convertToResUpdateUserDTO(User user) {
        ResUpdateUserDTO res = new ResUpdateUserDTO();

        res.setAge(user.getAge());
        res.setEmail(user.getEmail());
        res.setName(user.getName());
        res.setGender(user.getGender());
        res.setUpdatedAt(user.getUpdatedAt());
        res.setAddress(user.getAddress());
        res.setId(user.getId());

        List<String> roleNames = user.getRoles() == null
                ? List.of()
                : user.getRoles().stream().map(Role::getName).collect(Collectors.toList());
        res.setRoles(roleNames);
        res.setRole(roleNames.stream().findFirst().orElse(null));

        return res;
    }

    public ResUserDTO convertToResUserDTO(User user) {
        ResUserDTO res = new ResUserDTO();
        res.setId(user.getId());
        res.setName(user.getName());
        res.setAge(user.getAge());
        res.setGender(user.getGender());
        res.setAddress(user.getAddress());
        res.setCreatedAt(user.getCreatedAt());
        res.setUpdatedAt(user.getUpdatedAt());
        res.setEmail(user.getEmail());
        res.setAvatarUrl(user.getAvatarUrl());

        List<String> roleNames = user.getRoles() == null
                ? List.of()
                : user.getRoles().stream().map(Role::getName).collect(Collectors.toList());
        res.setRoles(roleNames);
        res.setRole(roleNames.stream().findFirst().orElse(null));

        return res;
    }

    public User getUserByRefreshTokenAndEmail(String token, String email) {
        return this.userRepository.findByRefreshTokenAndEmailAndVoidedFalse(token, email);
    }

    private String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
