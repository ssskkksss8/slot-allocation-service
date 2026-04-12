package com.hilbert.booking.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hilbert.booking.entity.UserRole;

public interface UserRoleRepository extends JpaRepository<UserRole, Integer> {
}