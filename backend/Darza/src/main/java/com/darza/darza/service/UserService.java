package com.darza.darza.service;

import com.darza.darza.dto.authDtos.AuthMapper;
import com.darza.darza.dto.authDtos.MyProfileUserResponse;
import com.darza.darza.dto.authDtos.PublicUserProfileResponse;
import com.darza.darza.dto.authDtos.UpdateUserRequest;
import com.darza.darza.entity.Property;
import com.darza.darza.entity.Town;
import com.darza.darza.entity.User;
import com.darza.darza.enums.ImageType;
import com.darza.darza.enums.Role;
import com.darza.darza.repository.PropertyImageRepository;
import com.darza.darza.repository.PropertyRepository;
import com.darza.darza.repository.TownRepository;
import com.darza.darza.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import com.darza.darza.util.PhoneNumbers;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class UserService {
    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private final UserRepository userRepository;
    private final PropertyImageRepository propertyImageRepository;
    private final PropertyRepository  propertyRepository;
    private final StorageService storageService;
    private final TownRepository townRepository;
    String bucketUrl;
    public UserService(
            UserRepository userRepository,
            @Value("${app.storage.public-base-url}") String bucketUrl,
            PropertyImageRepository propertyImageRepository,
            StorageService storageService,
            TownRepository townRepository,
            PropertyRepository propertyRepository) {
        this.userRepository = userRepository;
        this.bucketUrl = bucketUrl;
        this.propertyImageRepository = propertyImageRepository;
        this.propertyRepository = propertyRepository;
        this.storageService = storageService;
        this.townRepository = townRepository;
    }
    @Transactional(readOnly = true)
    public MyProfileUserResponse getMyUserProfile(UserDetails authentication){
        User user=userRepository.findByEmail(authentication.getUsername())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"حسابك لم يعد موجودا او تم حذفه"));
        return AuthMapper.toMyProfileUserResponse(user,bucketUrl);
    }

    @Transactional
    public void deleteMyUserAccount(UserDetails authentication){
        User user=userRepository.findByEmail(authentication.getUsername())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"حسابك لم يعد موجودا او تم حذفه"));
        if (user.getRole()== Role.ADMIN)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"غير مصرح للادمن بحذف حسابه");
        List<Property> userProperties=propertyRepository.findAllByCreatedById(user.getId());
        List<String> imagesPaths=new ArrayList<>();

        if (!userProperties.isEmpty()){
        List<Long> propertyIds=userProperties.stream().map((Property::getId)).toList();
        propertyImageRepository.findAllByPropertyIdInOrderByIdAsc(propertyIds)
                .forEach(image->imagesPaths.add(image.getImagePath()));
        propertyRepository.deleteAll(userProperties);
        propertyRepository.flush();
        }
        if(user.getProfileImagePath()!=null)
            imagesPaths.add(user.getProfileImagePath());

        userRepository.delete(user);
        userRepository.flush();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                if(!imagesPaths.isEmpty())
                    deleteImagesAfterCommit(imagesPaths);
            }
        });
    }

    @Transactional
    public MyProfileUserResponse updateMyUserProfile(UpdateUserRequest request, UserDetails authentication){
        User user=userRepository.findByEmail(authentication.getUsername())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"حسابك لم يعد موجودا او تم حذفه"));
        String phoneNumber=PhoneNumbers.normalize(request.countryCode(),request.phoneNumber());
        Town town=townRepository.findById(request.townId())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"البلدة التي ادخلتها غير موجودة"));
        User updatedUser=AuthMapper.updateMyProfile(request,user,town);
        updatedUser.setPhoneNumber(phoneNumber);
        String oldProfileImagePath=user.getProfileImagePath();
        boolean isSamePath=Objects.equals(oldProfileImagePath,request.profileImagePath());
        boolean isPathExistAndValid=request.profileImagePath()!=null&&!request.profileImagePath().isBlank()&&!isSamePath;
        if(isPathExistAndValid){
            if (!storageService.isValidImagePath(request.profileImagePath(), user.getId(), ImageType.PROFILE))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"مسار الصورة غير صالح أو لا ينتمي لك");
            updatedUser.setProfileImagePath(request.profileImagePath());
        }
        userRepository.flush();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                if (oldProfileImagePath!=null&&isPathExistAndValid)
                    deleteImagesAfterCommit(List.of(oldProfileImagePath));
            }
        });
        return AuthMapper.toMyProfileUserResponse(updatedUser,bucketUrl);
    }

    @Transactional
    public void deleteMyUserProfileImage(UserDetails authentication){
        User user=userRepository.findByEmail(authentication.getUsername())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"حسابك لم يعد موجودا او تم حذفه"));
        String oldProfileImagePath=user.getProfileImagePath();
        user.setProfileImagePath(null);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                if (oldProfileImagePath!=null)
                    deleteImagesAfterCommit(List.of(oldProfileImagePath));
            }
        });
    }

    @Transactional(readOnly = true)
    public PublicUserProfileResponse getPublicUserProfile(Long userId){
        User user=userRepository.findById(userId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"الحساب الذي طلبته لم يعد موجودا او تم حذفه"));
        return AuthMapper.toPublicUserProfileResponse(user,bucketUrl);
    }

    private void deleteImagesAfterCommit(List<String> imagePaths) {
        try {
            storageService.deleteImages(imagePaths);
        } catch (Exception e) {
            log.error("Failed to delete images after user transaction committed: {}", imagePaths, e);
        }
    }

}
