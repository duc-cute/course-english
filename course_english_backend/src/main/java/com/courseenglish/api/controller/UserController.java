package com.courseenglish.api.controller;

import com.courseenglish.api.domain.request.ReqSearchUserDTO;
import jakarta.validation.Valid;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.courseenglish.api.domain.User;
import com.courseenglish.api.domain.response.ResCreateUserDTO;
import com.courseenglish.api.domain.response.ResUpdateUserDTO;
import com.courseenglish.api.domain.response.ResUserDTO;
import com.courseenglish.api.domain.response.ResultPaginationDTO;
import com.courseenglish.api.service.UserService;
import com.courseenglish.api.util.CatalogSearchSpecs;
import com.courseenglish.api.util.PagingSearchUtil;
import com.courseenglish.api.util.annotation.ApiMessage;
import com.courseenglish.api.util.error.IdInvalidException;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/")
public class UserController {
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserService userService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/user")
    @ApiMessage("Create a user")
    public ResponseEntity<ResCreateUserDTO> createUser(@Valid @RequestBody User user) throws IdInvalidException {
        boolean isExistUser = this.userService.isEmailExist(user.getEmail());
        if (isExistUser)
            throw new IdInvalidException("User" + user.getEmail() + " đã tồn tại,vui lòng nhập email khác!");
        String hashPassword = this.passwordEncoder.encode(user.getPassword());
        user.setPassword(hashPassword);
        User newUser = this.userService.handleCreateUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userService.convertToResCreateUserDTO(newUser));
    }

    @DeleteMapping("/users/{id}")
    @ApiMessage("Delete user by id")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") UUID id) throws IdInvalidException {
        User currentUser = this.userService.getUserById(id);
        if (currentUser == null)
            throw new IdInvalidException("User không tồn tại!");
        this.userService.deleteUser(id);
        return ResponseEntity.ok(null);
    }

    @PostMapping("/users/search")
    @ApiMessage("Fetch user")
    public ResponseEntity<ResultPaginationDTO> fetchUsers(@RequestBody(required = false) ReqSearchUserDTO req) {
        ReqSearchUserDTO payload = req == null ? new ReqSearchUserDTO() : req;
        Specification<User> spec = CatalogSearchSpecs.userSearch(payload);
        var pageable = PagingSearchUtil.toPageable(payload);
        ResultPaginationDTO result = this.userService.getAllUsers(spec, pageable);
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    @GetMapping("/users/{id}")
    @ApiMessage("Get user by id")
    public ResponseEntity<ResUserDTO> getUserById(@PathVariable("id") UUID id) {
        User user = this.userService.getUserById(id);
        return ResponseEntity.status(HttpStatus.OK).body(this.userService.convertToResUserDTO(user));
    }

    @PutMapping("/users")
    @ApiMessage("Update a user")
    public ResponseEntity<ResUpdateUserDTO> updateUserById(@RequestBody User user) throws IdInvalidException {
        User userUpdate = this.userService.updateUser(user);
        if (userUpdate == null)
            throw new IdInvalidException("User với Id =" + user.getId() + " không tồn tại!");
        return ResponseEntity.ok(this.userService.convertToResUpdateUserDTO(userUpdate));
    }

    @PutMapping("/user-by-admin")
    @ApiMessage("Update a user by admin")
    public ResponseEntity<ResUpdateUserDTO> updateUserByAdmin(@RequestBody User user) throws IdInvalidException {
        User existingUser = this.userService.getUserById(user.getId());
        if (existingUser == null)
            throw new IdInvalidException("User với Id =" + user.getId() + " không tồn tại!");

        if (user.getEmail() != null && !user.getEmail().isBlank()
                && !user.getEmail().trim().equals(existingUser.getEmail())
                && this.userService.isEmailExist(user.getEmail().trim())) {
            throw new IdInvalidException("User" + user.getEmail() + " đã tồn tại,vui lòng nhập email khác!");
        }

        User userUpdate = this.userService.updateUserByAdmin(user);
        return ResponseEntity.ok(this.userService.convertToResUpdateUserDTO(userUpdate));
    }
}
