package com.darza.darza.dto.townDtos;

import com.darza.darza.entity.City;
import com.darza.darza.entity.Town;

public class TownMapper {
    public static TownResponse toTownResponse(Town town) {
        return new TownResponse(
                town.getId(),
                town.getName()
        );
    }

    public static DetailedTownResponse toDetailedTownResponse(Town town) {
        if(town == null) {return null;}
        return new DetailedTownResponse(
                town.getId(),
                town.getName(),
                town.getCity().getId(),
                town.getCity().getName()
        );
    }

    public static Town toTown(CreateTownRequest request,City city){
        Town town = new Town();
        town.setName(request.townName());
        town.setCity(city);
        return town;
    }
}
