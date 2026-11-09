package com.darza.darza.service;

import com.darza.darza.dto.imagesDtos.ImageUploadUrlsResponse;
import com.darza.darza.entity.User;
import com.darza.darza.enums.ImageType;
import com.darza.darza.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class StorageService {
    private static final Logger log = LoggerFactory.getLogger(StorageService.class);
    private final String bucketName;
    private final String supabaseUrl;
    private final RestClient restClient;
    private final UserRepository userRepository;
    public StorageService(
            @Value("${app.storage.supabase-url}") String supabaseUrl,
            @Value("${app.storage.bucket-name}") String bucketName,
            @Value("${app.storage.supabase-secret-key}") String bucketSecretKey,
            RestClient.Builder builder,
            UserRepository userRepository
    ){
        this.bucketName = bucketName;
        this.supabaseUrl = supabaseUrl;
        this.userRepository = userRepository;
        this.restClient=builder
                .baseUrl(supabaseUrl+"/storage/v1")
                .defaultHeader("apikey",bucketSecretKey)
                .build();
    }

    public void deleteImages(List<String> imagePaths){
//        مستحيل تكون نل او فاضية لانه عند انشاء العقار اجباري يكون معه صورة واحدة على الاقل ولكن هاي للاحتياط
        if(imagePaths==null || imagePaths.isEmpty()) return;
        try {
        restClient.method(HttpMethod.DELETE)
                .uri("/object/"+bucketName)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("prefixes",imagePaths))
                .retrieve()
                .toBodilessEntity();
        }catch (RestClientException e){
            log.warn("Failed to delete files from storage: {}", imagePaths, e);
        }
    }

    private String createSignedUploadUrl(String path){
        Map<?,?> response=restClient.post()
                .uri("/object/upload/sign/"+bucketName+"/"+path)
                .retrieve()
                .body(Map.class);
        return supabaseUrl+"/storage/v1"+response.get("url");
    }
    public ImageUploadUrlsResponse createUploadUrls(int count, UserDetails authentication, ImageType type){
        if (count<1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"عدد روابط الرفع المطلوبة غير صالح ");
        if (authentication==null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"يجب تسجيل الدخول أولا");
        User user=userRepository.findByEmail(authentication.getUsername())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"حسابك لم يعد موجودا او تم حذفه/تعطيله"));
        Long userId = user.getId();
        String folder=switch (type){
            case PROPERTY ->"properties/"+userId+"/" ;
            case PROFILE ->"profiles/"+userId+"/" ;
        };
        List<String> imagePaths=new ArrayList<>();
        List<String> imageUrls=new ArrayList<>();
        for (int i=0;i<count;i++){
            String path=folder+UUID.randomUUID()+".webp";
            imagePaths.add(path);
            imageUrls.add(createSignedUploadUrl(path));
        }
        return new ImageUploadUrlsResponse(imageUrls,imagePaths);
    }
}
