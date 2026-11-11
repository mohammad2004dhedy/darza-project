package com.darza.darza.service;

import com.darza.darza.dto.propertyDtos.CreatePropertyRequest;
import com.darza.darza.dto.propertyDtos.PropertyDetailsResponse;
import com.darza.darza.dto.propertyDtos.PropertyMapper;
import com.darza.darza.entity.Property;
import com.darza.darza.entity.PropertyImage;
import com.darza.darza.entity.Town;
import com.darza.darza.entity.User;
import com.darza.darza.enums.ListingType;
import com.darza.darza.enums.PostingStatus;
import com.darza.darza.enums.PropertyType;
import com.darza.darza.repository.PropertyImageRepository;
import com.darza.darza.repository.PropertyRepository;
import com.darza.darza.repository.TownRepository;
import com.darza.darza.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
public class PropertyService {
    private final String bucketUrl;
    private final UserRepository userRepository;
    private final TownRepository townRepository;
    private final PropertyRepository propertyRepository;
    private final PropertyImageRepository propertyImageRepository;
    private final StorageService storageService;
    public PropertyService(
            @Value("${app.storage.public-base-url}") String bucketUrl,
            UserRepository userRepository,
            TownRepository townRepository,
            PropertyRepository propertyRepository,
            StorageService storageService,
            PropertyImageRepository propertyImageRepository) {
        this.bucketUrl = bucketUrl;
        this.userRepository = userRepository;
        this.townRepository = townRepository;
        this.propertyRepository = propertyRepository;
        this.propertyImageRepository = propertyImageRepository;
        this.storageService = storageService;
    }

    private void validateProperty(CreatePropertyRequest request) {
        PropertyType type=request.propertyType();
        boolean isLand=type==PropertyType.LAND;
        boolean isRent=request.listingType()==ListingType.RENT;
        if(isLand&&request.listingType()== ListingType.RENT){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"الاراضي للبيع فقط");
        }
        if(isRent == (request.rentPeriod() == null))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"فترة الإيجار مطلوبة للإيجار فقط");
        if(isLand&&(request.rooms()!=null||request.bathrooms()!=null||request.furnished()!=null||request.hasBalcony()!=null))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"حقول الغرف والحمامات والاثاث والبرندة لا يمكن ان توجد لعقار من نوع ارض");
        if((request.latitude()==null)!=(request.longitude()==null))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"يجب ادخال خط الطول والعرض معا");
    }
    @Transactional
    public PropertyDetailsResponse createProperty(CreatePropertyRequest request, UserDetails authentication) {
        User user=userRepository.findByEmail(authentication.getUsername())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"المستخدم غير موجود"));
        Town town=townRepository.findById(request.townId())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"البلدة المختارة غير موجود"));
        validateProperty(request);
        Property property= PropertyMapper.toProperty(request,town,user);
        if(authentication.getAuthorities().stream().anyMatch(a-> Objects.equals(a.getAuthority(), "ROLE_ADMIN"))){
            property.setPostingStatus(PostingStatus.APPROVED);
            property.setApprovedBy(property.getCreatedBy());
            property.setApprovedAt(Instant.now());
        }
        Property savedProperty=propertyRepository.save(property);
        List<PropertyImage> propertyImages=request.imagePaths().stream().map(path->{
            PropertyImage propertyImage=new PropertyImage();
            propertyImage.setProperty(savedProperty);
            propertyImage.setImagePath(path);
            return propertyImage;
        }).toList();
        if(new HashSet<>(request.imagePaths()).size()!=request.imagePaths().size())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"خطأ في رفع الوسائط");

        String userPrefix="properties/"+user.getId().toString()+"/";
        if(request.imagePaths().stream().anyMatch((i)->!i.startsWith(userPrefix)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"غير مسموح لك ترفع صور لشخص غيرك!");

        propertyImageRepository.saveAll(propertyImages);
        return PropertyMapper.toPropertyDetailsResponse(savedProperty,request.imagePaths(),true,bucketUrl);
    }

    @Transactional
    public void toggleAvailability(UserDetails authentication, Long propertyId) {
        if (authentication==null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"يجب تسجيل الدخول للقيام بهذا الاجراء");
        }
        Property property=propertyRepository.findById(propertyId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"العقار غير موجود او تم حذفه"));
        if(!Objects.equals(authentication.getUsername(),property.getCreatedBy().getEmail()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"غير مصرح لك بالقيام بهذا الاجراء");
        if(!Objects.equals(property.getPostingStatus(), PostingStatus.APPROVED))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"لا يمكن تغيير حالة العقار الا بعد ان يتم الموافقة عليه من قبل المشرفين");
        property.setAvailable(!property.getAvailable());
    }

    @Transactional
    public void deleteProperty(UserDetails authentication, Long propertyId) {
        if (authentication==null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"يجب تسجيل الدخول للقيام بهذا الاجراء");
        }
        Property property=propertyRepository.findById(propertyId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"العقار المطلوب غير موجود او تم حذفه"));
        if(!Objects.equals(property.getCreatedBy().getEmail(),authentication.getUsername()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"غير مصرح لك القيام بهذه العملية");
        List<PropertyImage> propertyImages=propertyImageRepository.findAllByPropertyIdOrderByIdAsc(propertyId);
        List<String> imagePaths=propertyImages.stream().map(PropertyImage::getImagePath).toList();
        propertyRepository.deleteById(propertyId);
        propertyRepository.flush();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                storageService.deleteImages(imagePaths);
            }
        });
    }

    @Transactional
    public PropertyDetailsResponse updateProperty(CreatePropertyRequest request, UserDetails authentication, Long propertyId) {
        Property property=propertyRepository.findById(propertyId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"العقار غير موجود او تم حذفه"));
        if(!Objects.equals(property.getCreatedBy().getEmail(),authentication.getUsername()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"غير مصرح لك القيام بهذه العملية");
        Town town=townRepository.findById(request.townId())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"البلدة المختارة غير موجودة"));

        validateProperty(request);

        Property updatedProperty=PropertyMapper.updateProperty(property,request,town);
        if(authentication.getAuthorities().stream().anyMatch(a-> Objects.equals(a.getAuthority(), "ROLE_ADMIN"))){
            updatedProperty.setPostingStatus(PostingStatus.APPROVED);
            updatedProperty.setApprovedBy(property.getCreatedBy());
            updatedProperty.setApprovedAt(Instant.now());
            updatedProperty.setRejectionReason(null);
        }
        List<String> requestPaths=request.imagePaths();
        List<PropertyImage> propertyImages=propertyImageRepository.findAllByPropertyIdOrderByIdAsc(propertyId);
        List<String> existingPaths=propertyImages
                .stream().map(PropertyImage::getImagePath).toList();

        Set<String> existingPathSet=new HashSet<>(existingPaths);
        Set<String> requestImageSet=new HashSet<>(requestPaths);
        if(requestImageSet.size()!=requestPaths.size())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"خطأ في رفع الوسائط");

        List<String> removedImages=existingPaths
                .stream()
                .filter((path)->!requestImageSet.contains(path))
                .toList();

        List<String> addedImages=requestImageSet
                .stream()
                .filter((path)->!existingPathSet.contains(path))
                .toList();
        String userPrefix="properties/"+property.getCreatedBy().getId().toString()+"/";
        if(addedImages.stream().anyMatch((i)->!i.startsWith(userPrefix)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"غير مسموح لك ترفع صور لشخص غيرك!");

        List<PropertyImage> toSaveImages=requestPaths.stream().map((i)->{
            PropertyImage propertyImage=new PropertyImage();
            propertyImage.setImagePath(i);
            propertyImage.setProperty(updatedProperty);
            return propertyImage;
        }).toList();
        propertyImageRepository.flush();
        propertyImageRepository.deleteAll(propertyImages);
        propertyImageRepository.flush();
        propertyImageRepository.saveAll(toSaveImages);
        propertyImageRepository.flush();
//        عملية الحذف من البوكيت بتتم بعد عمل كوميت للتعديلات في الداتابيس وحفظها , عشان اذا صار خطأ ما في الوقت بين الفلش والكوميت وفشلت عملية التعديل ما تنحذف الصور ويصير عندي بوست بدون صور
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                storageService.deleteImages(removedImages);
            }
        });
        return PropertyMapper.toPropertyDetailsResponse(updatedProperty,requestPaths,true,bucketUrl);
    }
}
