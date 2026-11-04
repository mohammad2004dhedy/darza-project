package com.darza.darza.service;

import com.darza.darza.entity.Property;
import com.darza.darza.enums.*;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.Locale;


public class PropertyFilterService {
    public static Specification<Property> hasPropertyType(PropertyType type){
        return (root,query,cb)->
                type==null?null
                        :cb.equal(root.get("propertyType"),type);
    }
    public static Specification<Property> hasListingType(ListingType type){
        return (root,query,cb)->
                type==null?null
                        :cb.equal(root.get("listingType"),type);
    }
    public static Specification<Property> hasMaxPrice(BigDecimal max){
        return (root,query,cb)->
                max==null?null:
                        cb.lessThanOrEqualTo(root.get("price"),max);
    }
    public static Specification<Property> hasMinPrice(BigDecimal min){
        return (root,query,cb)->
                min==null?null:
                        cb.greaterThanOrEqualTo(root.get("price"),min);
    }
//    يمكن اختيارها دون وجود اقل او اكبر سعر عادي ولكن لا يمكن وجود سعر دونها وهاي بالسيرفيس دعملها
    public static Specification<Property> hasCurrency(Currency currency){
        return (root,query,cb)->
                currency==null?null
                        :cb.equal(root.get("currency"),currency);
    }
//     في السيرفيس,اذا كان في مدينة وما في بلدة بستدعي هاي واذا كان في بلدة ما بحتاج استدعيها هاي تاعت السيتي واذا ما في ولا وحدة فيهن برجع نل من السيرفيس للكويري , يعني فحص النل هون داخل الميثود زيادة
    public static Specification<Property> inCity(Long cityId){
        return (root,query,cb)->
                cityId==null?null
                        :cb.equal(root.get("town").get("city").get("id"),cityId);
    }
    public static Specification<Property> inTown(Long townId){
        return (root,query,cb)->
                townId==null?null
                        :cb.equal(root.get("town").get("id"),townId);
    }
    public static Specification<Property> inTitle(String text){
        return (root,query,cb)->
                text==null||text.isBlank()?null:
                    cb.like(cb.lower(root.get("title")),"%"+text.toLowerCase()+"%");
    }
    public static Specification<Property> inDescription(String text){
        return(root,query,cb)->
                text==null||text.isBlank()?null:
                        cb.like(cb.lower(root.get("description")),"%"+text.toLowerCase()+"%");
    }
    public static Specification<Property> inDisplayName(String text){
        return (root,query,cb)->
                text==null||text.isBlank()?null: cb.like(
                                cb.lower(root.get("createdBy").get("displayName")),
                                "%"+text.toLowerCase()+"%"
                        );
    }
    public static Specification<Property> hasPostingStatus(PostingStatus postingStatus){
        return (root,query,cb)->
                postingStatus==null?cb.equal(root.get("postingStatus"),PostingStatus.APPROVED)
                :cb.equal(root.get("postingStatus"), postingStatus);
    }
    public static Specification<Property> isAvailable(boolean isAvailable){
        return (root,query,cb)->
                cb.equal(root.get("isAvailable"),isAvailable);
    }
}
