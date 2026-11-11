package com.darza.darza.service;

import com.darza.darza.dto.cityDtos.CityMapper;
import com.darza.darza.dto.cityDtos.CityResponse;
import com.darza.darza.dto.cityDtos.CreateCityRequest;
import com.darza.darza.dto.townDtos.CreateTownRequest;
import com.darza.darza.dto.townDtos.TownMapper;
import com.darza.darza.dto.townDtos.TownResponse;
import com.darza.darza.entity.City;
import com.darza.darza.entity.Town;
import com.darza.darza.repository.CityRepository;
import com.darza.darza.repository.PropertyRepository;
import com.darza.darza.repository.TownRepository;
import com.darza.darza.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@Service
public class LocationService {
    private final TownRepository townRepository;
    private final CityRepository cityRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    public LocationService(
            TownRepository townRepository,
            CityRepository cityRepository,
            PropertyRepository propertyRepository,
            UserRepository userRepository) {
        this.townRepository=townRepository;
        this.cityRepository=cityRepository;
        this.propertyRepository=propertyRepository;
        this.userRepository=userRepository;
    }

    public CityResponse createCity(CreateCityRequest request) {
        if (cityRepository.existsByName(request.name()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"المدينة مسجلة مسبقا");
        City city=new City();
        city.setName(request.name());
        cityRepository.save(city);
        return CityMapper.toCityResponse(city);
    }
    public CityResponse updateCity(CreateCityRequest request,Long cityId) {
        City city=cityRepository.findById(cityId)
                .orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,"المدينة التي تحاول تعديل اسمها لم تعد موجودة او تم حذفها"));
        if (Objects.equals(request.name(),city.getName()))
            return CityMapper.toCityResponse(city);
        if (cityRepository.existsByName(request.name()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"اسم المدينة الجديد موجود مسبقا");
        city.setName(request.name());
        cityRepository.save(city);
        return CityMapper.toCityResponse(city);
    }
    public void deleteCity(Long cityId) {
        if (!cityRepository.existsById(cityId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"المدينة التي تحاول حذفها غير موجودة");
        if(townRepository.existsByCityId(cityId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"المدينة التي تحاول حذفها مرتبطة ببلدان اخرى");
        cityRepository.deleteById(cityId);
    }
    public List<CityResponse> getAllCities() {
        return cityRepository.findAll()
                .stream()
                .map(CityMapper::toCityResponse)
                .toList();
    }
    public TownResponse createTown(CreateTownRequest request) {
        City city=cityRepository.findById(request.cityId())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"يرجى اختيار مدينة صالحة"));
        if (townRepository.existsByCityIdAndName(request.cityId(),request.townName()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"اسم البلدة موجود مسبقا في هذه المدينة");

        Town town=TownMapper.toTown(request,city);
        Town savedTown=townRepository.save(town);
        return TownMapper.toTownResponse(savedTown);
    }
    public TownResponse updateTown(CreateTownRequest request,Long townId) {
        City city=cityRepository.findById(request.cityId())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"يرجى اختيار مدينة صالحة"));
        Town town=townRepository.findById(townId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"البلدة التي تحاول تعديلها غير موجودة"));
        if (Objects.equals(request.cityId(),town.getCity().getId())&&Objects.equals(request.townName(),town.getName()))
            return TownMapper.toTownResponse(town);
        if (townRepository.existsByCityIdAndName(request.cityId(),request.townName()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"اسم البلدة موجود مسبقا في هذه المدينة");
        town.setName(request.townName());
        town.setCity(city);
        townRepository.save(town);
        return TownMapper.toTownResponse(town);
    }
    public void deleteTown(Long townId) {
        if(!townRepository.existsById(townId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"البلدة التي تحاول تعديلها غير موجودة");
        if(propertyRepository.existsByTownId(townId)||userRepository.existsByTownId(townId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"البلدة التي تحاول حذفها مستخدمة");
        townRepository.deleteById(townId);
    }
    public List<TownResponse> getAllTowns() {
        return townRepository.findAll()
                .stream()
                .map(TownMapper::toTownResponse)
                .toList();
    }
}

