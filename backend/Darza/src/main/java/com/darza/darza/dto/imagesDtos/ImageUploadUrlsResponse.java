package com.darza.darza.dto.imagesDtos;

import java.util.List;

public record ImageUploadUrlsResponse(
        List<String> imageUrls,
        List<String> imagePaths
) {
}
