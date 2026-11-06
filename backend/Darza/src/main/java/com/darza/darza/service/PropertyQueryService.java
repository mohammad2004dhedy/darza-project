package com.darza.darza.service;

import com.darza.darza.dto.propertyDtos.*;
import com.darza.darza.entity.Property;
import com.darza.darza.entity.PropertyImage;
import com.darza.darza.entity.User;
import com.darza.darza.enums.PostingStatus;
import com.darza.darza.enums.PropertySort;
import com.darza.darza.repository.PropertyImageRepository;
import com.darza.darza.repository.PropertyRepository;
import com.darza.darza.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class PropertyQueryService {
    private final int pageSize;
    private final PropertyImageRepository propertyImageRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final String bucketUrl;
    public PropertyQueryService(
            PropertyImageRepository propertyImageRepository,
            PropertyRepository propertyRepository,
            UserRepository userRepository,
            @Value("${app.storage.public-base-url}") String bucketUrl,
            @Value("${app.search.page-size:12}") int pageSize
    ) {
        this.propertyImageRepository = propertyImageRepository;
        this.propertyRepository = propertyRepository;
        this.bucketUrl=bucketUrl;
        this.userRepository = userRepository;
        this.pageSize = pageSize;
    }
    private Sort toSort(PropertySort type){
        PropertySort s=type==null?PropertySort.NEWEST:type;
        return switch (s){
            case NEWEST -> Sort.by(Sort.Order.desc("approvedAt"),Sort.Order.desc("id"));
            case OLDEST -> Sort.by(Sort.Order.asc("approvedAt"),Sort.Order.asc("id"));
            case PRICE_ASC -> Sort.by(Sort.Order.asc("price"),Sort.Order.asc("id"));
            case PRICE_DESC -> Sort.by(Sort.Order.desc("price"),Sort.Order.asc("id"));
        };
    }

    @Transactional(readOnly = true)
    public PropertyDetailsResponse getPropertyDetails(Long propertyId, UserDetails authentication){
        boolean isAuthenticated=authentication!=null;
        boolean isAdmin=isAuthenticated&&authentication.getAuthorities()
                .stream().anyMatch(a-> Objects.equals(a.getAuthority(), "ROLE_ADMIN"));
        boolean isOwner;
        Property property=propertyRepository.findById(propertyId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"العقار المطلوب غير موجود"));
        User user=property.getCreatedBy();
        isOwner=isAuthenticated&&authentication.getUsername().equals(user.getEmail());
        if(!isAdmin&&!isOwner&&property.getPostingStatus()!=PostingStatus.APPROVED){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"العقار غير موجود او غير مسموح لك بعرضه");
        }
        List<String>imagePaths=propertyImageRepository.findAllByPropertyIdOrderByIdAsc(propertyId)
                .stream().map(PropertyImage::getImagePath).toList();
        boolean includeModerationInfo=isAdmin|isOwner;
        return PropertyMapper.toPropertyDetailsResponse(property,imagePaths,includeModerationInfo,bucketUrl);
    }

    @Transactional(readOnly = true)
    public SliceResponse<PropertyCardResponse> getFeed(int page){
        if(page<0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"رقم الصفحة غير صالح");
        Pageable pageable= PageRequest.of(page,pageSize);
        Slice<Property> properties=propertyRepository.findAllByPostingStatusAndIsAvailableTrueOrderByApprovedAtDesc(PostingStatus.APPROVED,pageable);
        if(properties.isEmpty())
            return new SliceResponse<PropertyCardResponse>(List.of(),false,page);
        List<Long> propertyIds =properties.getContent().stream().map(Property::getId).toList();
        Map<Long,String> propertyImagePaths=new HashMap<>();
        propertyImageRepository.findAllByPropertyIdInOrderByIdAsc(propertyIds)
                .forEach(image->propertyImagePaths.putIfAbsent(image.getProperty().getId(),image.getImagePath()));

        List<PropertyCardResponse> cards=properties.getContent().stream()
                .map(property ->
                        PropertyMapper.toPropertyCardResponse(
                                property,
                                propertyImagePaths.get(property.getId()),
                                false,bucketUrl))
                .toList();
        return new SliceResponse<PropertyCardResponse>(cards,properties.hasNext(),page);
    }

    @Transactional(readOnly = true)
    public SliceResponse<PropertyCardResponse> getSelfProfileProperties(int page,UserDetails authentication){
        if(page<0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"رقم الصفحة غير صالح");
        User user=userRepository.findByEmail(authentication.getUsername()) //حالة نادرة اذا تم حذف الحساب في خلال عملية معالجة الطلب
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"حسابك لم يعد متاحا"));
        Pageable pageable= PageRequest.of(page,pageSize);
        Slice<Property> properties=propertyRepository.findAllByCreatedByIdOrderByCreatedAtDesc(user.getId(),pageable);
        if(properties.isEmpty())
            return new SliceResponse<>(List.of(),false,page);
        List<Long> propertyIds =properties.getContent().stream().map(Property::getId).toList();
        Map<Long,String> propertyImagePaths=new HashMap<>();
        propertyImageRepository.findAllByPropertyIdInOrderByIdAsc(propertyIds)
                .forEach(image->propertyImagePaths.putIfAbsent(image.getProperty().getId(),image.getImagePath()));
        List<PropertyCardResponse> cards=properties
                .stream()
                .map(property->
                        PropertyMapper.toPropertyCardResponse(
                                property,
                                propertyImagePaths.get(property.getId()),
                                true,bucketUrl)
                ).toList();
        return new SliceResponse<PropertyCardResponse>(cards,properties.hasNext(),page);
    }

    @Transactional(readOnly = true)
    public SliceResponse<PropertyCardResponse> getPublicProfileProperties(Long userId,int page){
        if(page<0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"رقم الصفحة غير صالح");

        if(!userRepository.existsById(userId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"المستخدم لم يعد موجودا على درزا");
        Pageable pageable= PageRequest.of(page,pageSize);
        Slice<Property> properties=propertyRepository
                .findAllByCreatedByIdAndPostingStatusOrderByApprovedAtDesc(userId,PostingStatus.APPROVED,pageable);
        if(properties.isEmpty())
            return new SliceResponse<>(List.of(),false,page);
        List<Long> propertyIds=properties.getContent().stream().map(Property::getId).toList();
        Map<Long,String> propertyImagePaths=new HashMap<>();
        propertyImageRepository.findAllByPropertyIdInOrderByIdAsc(propertyIds)
                .forEach(image->propertyImagePaths.putIfAbsent(image.getProperty().getId(),image.getImagePath()));
        List<PropertyCardResponse> cards=properties
                .stream()
                .map(property->PropertyMapper.toPropertyCardResponse(
                        property,
                        propertyImagePaths.get(property.getId()),
                        true,
                        bucketUrl
                ))
                .toList();
        return new SliceResponse<>(cards,properties.hasNext(),page);
    }

    @Transactional(readOnly = true)
    public SliceResponse<PropertyCardResponse> getFilteredProperties(PropertyFilterRequest request){
        Specification<Property> propertyTypeSpec=PropertyFilterService.hasPropertyType(request.propertyType());
        Specification<Property> listingTypeSpec=PropertyFilterService.hasListingType(request.listingType());
        Specification<Property> textSpec=Specification.anyOf(
                PropertyFilterService.inDescription(request.text()),
                PropertyFilterService.inDisplayName(request.text()),
                PropertyFilterService.inTitle(request.text())
        );
        Specification<Property> currencySpec=PropertyFilterService.hasCurrency(request.currency());
        if((request.maxPrice()!=null||request.minPrice()!=null)&&request.currency()==null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"يجب اختيار نوع العملة عند تحديد اقل او اكبر قيمة للسعر");
        }
        Specification<Property> maxPriceSpec=PropertyFilterService.hasMaxPrice(request.maxPrice());
        Specification<Property> minPriceSpec=PropertyFilterService.hasMinPrice(request.minPrice());
        Specification<Property> citySpec=PropertyFilterService.inCity(request.cityId());
        Specification<Property> townSpec=PropertyFilterService.inTown(request.townId());
        Specification<Property> specifications=Specification.allOf(
                PropertyFilterService.hasPostingStatus(PostingStatus.APPROVED),
                PropertyFilterService.isAvailable(true),
                propertyTypeSpec,
                listingTypeSpec,
                textSpec,
                currencySpec,
                maxPriceSpec,
                minPriceSpec,
                citySpec,
                townSpec
        );
        Sort sort=toSort(request.sortType());
        Pageable pageable=PageRequest.of(request.page(),pageSize,sort);
        Page<Property> properties=propertyRepository.findAll(specifications,pageable);
        if (properties.isEmpty())
            return new SliceResponse<>(List.of(),false,request.page());
        Map<Long,String> propertyImagePaths=new HashMap<>();
        List<Long> propertyIds=properties.stream().map(Property::getId).toList();
        propertyImageRepository.findAllByPropertyIdInOrderByIdAsc(propertyIds)
                .forEach(image->propertyImagePaths.putIfAbsent(image.getProperty().getId(),image.getImagePath()));
        List<PropertyCardResponse> cards=properties.stream().map(property->
                PropertyMapper.toPropertyCardResponse(
                        property,
                        propertyImagePaths.get(property.getId()),
                        false,
                        bucketUrl)
                ).toList();
        return new SliceResponse<>(cards,properties.hasNext(),request.page());
    }

    @Transactional(readOnly = true)
    public SliceResponse<PropertyCardResponse> getPropertiesForAdmin(PostingStatus postingStatus,UserDetails authentication,int page){
        if(page<0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"رقم الصفحة غير صالح");
        if(authentication==null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"يجب تسجيل الدخول قبل الوصول الى هذا المصدر");
//        الفحص للرول بيتم في الفلتر تشاين بس هون احتياط في حالة تم تجاوز الفلتر
        if(authentication.getAuthorities().stream().noneMatch(a->Objects.equals(a.getAuthority(),"ROLE_ADMIN")))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"غير مصرح لك بالوصول الى هذا المصدر");
        Pageable pageable= PageRequest.of(page,pageSize);
        Slice<Property> properties=propertyRepository.findAllByPostingStatusOrderByUpdatedAtAsc(postingStatus,pageable);
        if(properties.isEmpty())
            return new SliceResponse<>(List.of(),false,page);
        List<Long> propertyIds=properties.getContent().stream().map(Property::getId).toList();
        Map<Long,String> propertyImagePaths=new HashMap<>();
        propertyImageRepository.findAllByPropertyIdInOrderByIdAsc(propertyIds)
                .forEach(image->
                        propertyImagePaths
                                .putIfAbsent(image.getProperty().getId(),image.getImagePath())
                );

        List<PropertyCardResponse> cards=properties.stream().map(property ->
                PropertyMapper.toPropertyCardResponse(
                        property,
                        propertyImagePaths.get(property.getId()),
                        true,
                        bucketUrl
                )
                ).toList();
        return new SliceResponse<>(cards,properties.hasNext(),page);
    }
}
