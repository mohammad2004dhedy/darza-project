package com.darza.darza.service;

import com.darza.darza.dto.adminDtos.RejectPropertyRequest;
import com.darza.darza.entity.Property;
import com.darza.darza.entity.User;
import com.darza.darza.enums.PostingStatus;
import com.darza.darza.repository.PropertyRepository;
import com.darza.darza.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
public class AdminService {
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    public AdminService(PropertyRepository propertyRepository, UserRepository userRepository) {
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
    }
    @Transactional
    public void rejectProperty(Long propertyId, UserDetails authentication, RejectPropertyRequest request) {
        Property property=propertyRepository.findById(propertyId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND, "العقار غير موجود او تم حذفه"));
        if(property.getPostingStatus()!=PostingStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"لا يمكن رفض عقار مرفوض او موافق عليه مسبقا");
        property.setPostingStatus(PostingStatus.REJECTED);
        property.setRejectionReason(request.rejectionReason());
        property.setApprovedAt(null);
        property.setApprovedBy(null);
    }
    @Transactional
    public void approveProperty(Long propertyId,UserDetails authentication){
        Property property=propertyRepository.findById(propertyId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND, "العقار غير موجود او تم حذفه"));
        User user=userRepository.findByEmail(authentication.getUsername())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"الحساب لم يعد موجودا"));
        if(property.getPostingStatus()!=PostingStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"لا يمكن الموافقة على عقار موافق عليه أو مرفوض مسبقاً");
        property.setPostingStatus(PostingStatus.APPROVED);
        property.setRejectionReason(null);
        property.setApprovedAt(Instant.now());
        property.setApprovedBy(user);
    }
}
