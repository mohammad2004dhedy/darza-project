package com.darza.darza.dto.imagesDtos;

public class ImagesMapper {
    public static String toImageUrl(String path,String bucketUrl){
        if (path == null || path.isBlank()) {
            return null;
        }
        return bucketUrl.replaceAll("/+$", "")
                + "/"
                + path.replaceAll("^/+", "");
    }
}
