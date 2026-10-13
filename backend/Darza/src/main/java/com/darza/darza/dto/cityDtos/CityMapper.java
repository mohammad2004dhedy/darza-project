package com.darza.darza.dto.cityDtos;

import com.darza.darza.entity.City;

public class CityMapper {
    public static CityResponse toCityResponse(City city) {
        return new CityResponse(city.getId(),city.getName());
    }
    public static City toCity(CreateCityRequest request) {
        City city= new City();
        city.setName(request.name());
        return city;
    }
}
