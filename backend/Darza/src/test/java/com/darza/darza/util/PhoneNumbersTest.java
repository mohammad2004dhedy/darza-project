package com.darza.darza.util;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PhoneNumbersTest {

    @ParameterizedTest
    @CsvSource({
            "970, 599123456, +970599123456",
            "970, 0569123456, +970569123456",
            "972, 0599123456, +972599123456",
            "972, 509123456, +972509123456",
            "972, 0589123456, +972589123456",
    })
    void normalizesValidNumbers(String countryCode, String phoneNumber, String expected) {
        assertEquals(expected, PhoneNumbers.normalize(countryCode, phoneNumber));
    }

    @ParameterizedTest
    @CsvSource({
            "970, 509123456",
            "970, 0549123456",
            "972, 519123456",
            "970, 579123456",
            "971, 599123456",
            "970, 59912345",
    })
    void rejectsInvalidNumbers(String countryCode, String phoneNumber) {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> PhoneNumbers.normalize(countryCode, phoneNumber));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }
}
