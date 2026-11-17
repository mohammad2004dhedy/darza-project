package com.darza.darza.dto.propertyDtos;

import com.darza.darza.dto.authDtos.AuthMapper;
import com.darza.darza.dto.imagesDtos.ImageResponse;
import com.darza.darza.dto.imagesDtos.ImagesMapper;
import com.darza.darza.dto.townDtos.TownMapper;
import com.darza.darza.entity.Property;
import com.darza.darza.entity.Town;
import com.darza.darza.entity.User;
import com.darza.darza.enums.PostingStatus;

import java.awt.*;
import java.util.List;

public class PropertyMapper {
    public static Property toProperty(CreatePropertyRequest request, Town town, User user){
        Property property = new Property();
        property.setTitle(request.title());
        property.setDescription(request.description());
        property.setPropertyType(request.propertyType());
        property.setListingType(request.listingType());
        property.setPrice(request.price());
        property.setCurrency(request.currency());
        property.setRentPeriod(request.rentPeriod());
        property.setAreaSize(request.areaSize());
        property.setRooms(request.rooms());
        property.setBathrooms(request.bathrooms());
        property.setFurnished(request.furnished());
        property.setHasBalcony(request.hasBalcony());
        property.setTown(town);
        property.setCreatedBy(user);
        property.setAddress(request.address());
        property.setLatitude(request.latitude());
        property.setLongitude(request.longitude());
        return property;
    }
    public static Property updateProperty(Property property,CreatePropertyRequest request, Town town){
        property.setTitle(request.title());
        property.setDescription(request.description());
        property.setPropertyType(request.propertyType());
        property.setListingType(request.listingType());
        property.setPrice(request.price());
        property.setCurrency(request.currency());
        property.setRentPeriod(request.rentPeriod());
        property.setAreaSize(request.areaSize());
        property.setRooms(request.rooms());
        property.setBathrooms(request.bathrooms());
        property.setFurnished(request.furnished());
        property.setHasBalcony(request.hasBalcony());
        property.setTown(town);
        property.setAddress(request.address());
        property.setLatitude(request.latitude());
        property.setLongitude(request.longitude());
        return property;
    }

    public static PropertyDetailsResponse toPropertyDetailsResponse(Property property, List<String> imagePaths,boolean includeModerationInfo,String bucketUrl){
        List<ImageResponse> imageResponses=imagePaths.stream().map(i->new ImageResponse(i, ImagesMapper.toImageUrl(i,bucketUrl))).toList();
        return new PropertyDetailsResponse(
                property.getId(),
                property.getTitle(),
                property.getDescription(),
                property.getPropertyType(),
                property.getListingType(),
                property.getPrice(),
                property.getCurrency(),
                property.getRentPeriod(),
                property.getAreaSize(),
                property.getRooms(),
                property.getBathrooms(),
                property.getFurnished(),
                property.getHasBalcony(),
                property.getAddress(),
                property.getLatitude(),
                property.getLongitude(),
                TownMapper.toDetailedTownResponse(property.getTown()),
                property.getAvailable(),
                includeModerationInfo?property.getPostingStatus():null,
                includeModerationInfo?property.getRejectionReason():null,
                property.getApprovedAt(),
                AuthMapper.toPropertyUserResponse(property.getCreatedBy(),bucketUrl,true),
                imageResponses
        );
    }
    public static PropertyCardResponse toPropertyCardResponse(Property property,String coverImagePath,boolean includeModerationInfo,String bucketUrl){
        String coverImageUrl=ImagesMapper.toImageUrl(coverImagePath,bucketUrl);
        return new PropertyCardResponse(
                property.getId(),
                property.getTitle(),
                property.getPropertyType(),
                property.getListingType(),
                includeModerationInfo?property.getPostingStatus():null,
                includeModerationInfo?property.getRejectionReason():null,
                property.getRentPeriod(),
                property.getPrice(),
                property.getCurrency(),
                property.getAreaSize(),
                property.getRooms(),
                property.getBathrooms(),
                TownMapper.toDetailedTownResponse(property.getTown()),
                property.getAvailable(),
                property.getApprovedAt(),
                AuthMapper.toPropertyUserResponse(property.getCreatedBy(),bucketUrl,false),
                coverImageUrl
        );
    }
}
