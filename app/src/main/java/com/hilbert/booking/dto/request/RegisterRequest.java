package com.hilbert.booking.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @Email(message = "Invalid email format")
    @NotBlank
    String email;
    @NotBlank
    @Size(min = 6, message = "Password must be at least 6 characters long")
    String password;
    String firstName;
    String lastName;
}
