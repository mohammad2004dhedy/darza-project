package com.darza.darza.entity;

import com.darza.darza.enums.*;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

import static com.darza.darza.enums.PostingStatus.*;

@Entity
@Table(name = "properties")
public class Property {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "title",nullable = false)
    private String title;
    @Column(name = "description",nullable = true)
    private String description;
    @Column(name = "property_type",nullable = false)
    @Enumerated(EnumType.STRING)
    private PropertyType propertyType;
    @Column(name = "listing_type",nullable = false)
    @Enumerated(EnumType.STRING)
    private ListingType listingType;
    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;
    @Column(name = "currency",nullable = false)
    @Enumerated(EnumType.STRING)
    private Currency currency;
    @Column(name = "rent_period",nullable = true)
    @Enumerated(EnumType.STRING)
    private RentPeriod rentPeriod;
    @Column(name = "area_size",nullable = true,precision =10,scale = 2)
    private BigDecimal areaSize;
    @Column(name = "rooms",nullable = true)
    private Integer rooms;
    @Column(name = "bathrooms",nullable = true)
    private Integer bathrooms;
    @Column(name = "furnished",nullable = true)
    private Boolean furnished;
    @Column(name = "has_balcony",nullable = true)
    private Boolean hasBalcony;
    @JoinColumn(name = "town_id",nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Town town;
    @Column(name = "address",nullable = true)
    private String address;
    @Column(name = "latitude",nullable = true,precision = 9,scale = 6)
    private BigDecimal latitude;
    @Column(name = "longitude",nullable = true,precision = 9,scale = 6)
    private BigDecimal longitude;
    @Column(name = "is_available",nullable = false)
    private Boolean isAvailable=true;
    @Column(name = "posting_status",nullable = false)
    @Enumerated(EnumType.STRING)
    private PostingStatus postingStatus= PENDING;
    @Column(name = "rejection_reason",nullable = true)
    private String rejectionReason;
    @Column(name = "approved_at",nullable = true)
    private Instant approvedAt;
    @JoinColumn(name = "approved_by",nullable = true)
    @ManyToOne(fetch = FetchType.LAZY)
    private User approvedBy;
    @CreationTimestamp
    @Column(name = "created_at",nullable = false,updatable = false)
    private Instant createdAt;
    @JoinColumn(name = "created_by",nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private User createdBy;
    @Column(name = "updated_at",nullable = false)
    @UpdateTimestamp
    private Instant updatedAt;

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public PropertyType getPropertyType() {
        return propertyType;
    }

    public void setPropertyType(PropertyType propertyType) {
        this.propertyType = propertyType;
    }

    public ListingType getListingType() {
        return listingType;
    }

    public void setListingType(ListingType listingType) {
        this.listingType = listingType;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Currency getCurrency() {
        return currency;
    }

    public void setCurrency(Currency currency) {
        this.currency = currency;
    }

    public RentPeriod getRentPeriod() {
        return rentPeriod;
    }

    public void setRentPeriod(RentPeriod rentPeriod) {
        this.rentPeriod = rentPeriod;
    }

    public BigDecimal getAreaSize() {
        return areaSize;
    }

    public void setAreaSize(BigDecimal areaSize) {
        this.areaSize = areaSize;
    }

    public Integer getRooms() {
        return rooms;
    }

    public void setRooms(Integer rooms) {
        this.rooms = rooms;
    }

    public Integer getBathrooms() {
        return bathrooms;
    }

    public void setBathrooms(Integer bathrooms) {
        this.bathrooms = bathrooms;
    }

    public Boolean getFurnished() {
        return furnished;
    }

    public void setFurnished(Boolean furnished) {
        this.furnished = furnished;
    }

    public Boolean getHasBalcony() {
        return hasBalcony;
    }

    public void setHasBalcony(Boolean hasBalcony) {
        this.hasBalcony = hasBalcony;
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

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public Boolean getAvailable() {
        return isAvailable;
    }

    public void setAvailable(Boolean available) {
        isAvailable = available;
    }

    public PostingStatus getPostingStatus() {
        return postingStatus;
    }

    public void setPostingStatus(PostingStatus postingStatus) {
        this.postingStatus = postingStatus;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(Instant approvedAt) {
        this.approvedAt = approvedAt;
    }

    public User getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(User approvedBy) {
        this.approvedBy = approvedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void resubmitForReview(){
        if (postingStatus == APPROVED || postingStatus == REJECTED) {
            postingStatus = PENDING;
            rejectionReason = null;
            approvedAt = null;
            approvedBy = null;
        }
    }
}
