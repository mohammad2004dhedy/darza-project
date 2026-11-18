package com.darza.darza.util;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.regex.Pattern;

public final class PhoneNumbers {
    private static final Pattern ISRAELI_MOBILE = Pattern.compile("(?:50|52|53|54|55|58)[0-9]{7}");
    private static final Pattern PALESTINIAN_MOBILE = Pattern.compile("(?:56|59)[0-9]{7}");

    private PhoneNumbers() {
    }

    /** Returns the stored form +{countryCode}{9-digit number}, or throws 400 for an invalid combination. */
    public static String normalize(String countryCode, String phoneNumber) {
        String localNumber = phoneNumber.startsWith("0") ? phoneNumber.substring(1) : phoneNumber;
        boolean valid = switch (countryCode) {
            case "972" -> ISRAELI_MOBILE.matcher(localNumber).matches()
                    || PALESTINIAN_MOBILE.matcher(localNumber).matches();
            case "970" -> PALESTINIAN_MOBILE.matcher(localNumber).matches();
            default -> false;
        };
        if (!valid)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "كود الدولة أو رقم الهاتف غير صالح");
        return "+" + countryCode + localNumber;
    }
}
