package stockflow.controller;

import stockflow.dto.RegisterRequest;
import stockflow.dto.LoginRequest;
import stockflow.entity.AppUser;
import stockflow.entity.Organization;
import stockflow.repository.AppUserRepository;
import stockflow.repository.OrganizationRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AppUserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            AppUserRepository userRepository,
            OrganizationRepository organizationRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request) {

        if (request.getUsername() == null ||
            request.getUsername().isBlank() ||
            request.getPassword() == null ||
            request.getPassword().isBlank() ||
            request.getOrganizationName() == null ||
            request.getOrganizationName().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(Map.of("message", "All fields are required"));
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Username already exists"));
        }

        Organization organization =
                new Organization(request.getOrganizationName());

        organization = organizationRepository.save(organization);

        AppUser user = new AppUser();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setOrganization(organization);

        user = userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of(
                    "message", "Registration successful",
                    "userId", user.getId(),
                    "organizationId", organization.getId(),
                    "username", user.getUsername()
                )
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request) {

        if (request.getUsername() == null ||
            request.getPassword() == null) {

            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Username and password are required"));
        }

        AppUser user = userRepository
                .findByUsername(request.getUsername())
                .orElse(null);

        if (user == null ||
            !passwordEncoder.matches(
                    request.getPassword(), user.getPassword())) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password"));
        }

        return ResponseEntity.ok(
                Map.of(
                    "message", "Login successful",
                    "userId", user.getId(),
                    "organizationId", user.getOrganization().getId(),
                    "username", user.getUsername()
                )
        );
    }
}