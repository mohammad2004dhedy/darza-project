package com.darza.darza.dto.propertyDtos;

import java.util.List;

public record SliceResponse<T>(
        List<T> content,
        boolean hasNext,
        int page
) {
}
