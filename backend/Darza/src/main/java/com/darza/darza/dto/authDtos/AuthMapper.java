package com.darza.darza.dto.authDtos;

import com.darza.darza.dto.imagesDtos.ImagesMapper;
import com.darza.darza.dto.townDtos.TownMapper;
import com.darza.darza.entity.Town;
import com.darza.darza.entity.User;

public class AuthMapper {
    public static User toUser(CreateUserRequest request, Town town, String passwordHash){
        User user = new User();
        user.setDisplayName(request.displayName());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordHash);
        user.setPhoneNumber(request.phoneNumber());
        user.setTown(town);
        user.setAddress( request.address() == null || request.address().isBlank()
                ? null
                : request.address());
        return user;
    }

    public static MyProfileUserResponse toMyProfileUserResponse(User user,String bucketUrl){
        return new MyProfileUserResponse(
                user.getId(),
                user.getDisplayName(),
                user.getPhoneNumber(),
                user.getEmail(),
                user.getAddress(),
                TownMapper.toDetailedTownResponse(user.getTown()),
                ImagesMapper.toImageUrl(user.getProfileImagePath(),bucketUrl),
                user.getCreatedAt()
        );
    }

    public static PublicUserProfileResponse toPublicUserProfileResponse(User user,String bucketUrl){
        return new PublicUserProfileResponse(
                user.getId(),
                user.getDisplayName(),
                user.getPhoneNumber(),
                TownMapper.toDetailedTownResponse(user.getTown()),
                ImagesMapper.toImageUrl(user.getProfileImagePath(),bucketUrl),
                user.getCreatedAt()
        );
    }

    public static PropertyUserResponse toPropertyUserResponse(User user,String bucketUrl,boolean includePhone){
        return new PropertyUserResponse(
                user.getId(),
                user.getDisplayName(),
                ImagesMapper.toImageUrl(user.getProfileImagePath(),bucketUrl),
                includePhone?user.getPhoneNumber():null
        );
    }
}
