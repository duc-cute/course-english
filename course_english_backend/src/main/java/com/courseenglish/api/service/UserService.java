package com.courseenglish.api.service;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.response.ResCreateUserDTO;
import com.courseenglish.api.domain.response.ResUpdateUserDTO;
import com.courseenglish.api.domain.response.ResUserDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;

public interface UserService {

    User handleCreateUser(User user);

    User handleSaveUser(User user);

    void deleteUser(UUID id);

    boolean isEmailExist(String email);

    User handleGetUserByUserName(String userName);

    User getUserById(UUID id);

    ResultPaginationDTO getAllUsers(Specification<User> spec, Pageable pageable);

    User updateUser(User userUpdate);

    User updateUserByAdmin(User userUpdate);

    void updateUserToken(String token, String email);

    ResCreateUserDTO convertToResCreateUserDTO(User user);

    ResUpdateUserDTO convertToResUpdateUserDTO(User user);

    ResUserDTO convertToResUserDTO(User user);

    User getUserByRefreshTokenAndEmail(String token, String email);
}
