package com.darza.darza.entity;

import com.darza.darza.enums.Role;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name="users")
public class User {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;
    @Column(name = "display_name", nullable = false)
    private String displayName;
    @Column(name = "email", nullable = false,unique = true)
    private String email;
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Column(name = "phone_number" , nullable = false)
    private String phoneNumber;
    @Column(name = "role",nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role=Role.PUBLISHER;
    @JoinColumn(name = "town_id",nullable = true)
    @ManyToOne(fetch = FetchType.LAZY)
    private Town town;
    @Column(name = "address",nullable = true)
    private String address;
    @Column(name = "profile_image_path",nullable = true)
    private String profileImagePath;
    @CreationTimestamp
    @Column(name = "created_at",nullable = false,updatable = false)
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Town getTown() {
        return town;
    }

    public void setTown(Town town) {
        this.town = town;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getProfileImagePath() {
        return profileImagePath;
    }

    public void setProfileImagePath(String profileImagePath) {
        this.profileImagePath = profileImagePath;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
