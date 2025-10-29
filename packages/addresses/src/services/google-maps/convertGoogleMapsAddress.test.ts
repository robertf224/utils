import { describe, it, expect } from "vitest";
import { convertGoogleMapsAddress } from "./convertGoogleMapsAddress";
import type { protos } from "@googlemaps/places";

describe("convertGoogleMapsAddress", () => {
    it("should convert a US address correctly", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "Google Building 41",
                shortText: "Google Building 41",
                types: ["premise"],
            },
            {
                longText: "1600",
                shortText: "1600",
                types: ["street_number"],
            },
            {
                longText: "Amphitheatre Parkway",
                shortText: "Amphitheatre Pkwy",
                types: ["route"],
            },
            {
                longText: "Mountain View",
                shortText: "Mountain View",
                types: ["locality", "political"],
            },
            {
                longText: "Santa Clara County",
                shortText: "Santa Clara County",
                types: ["administrative_area_level_2", "political"],
            },
            {
                longText: "California",
                shortText: "CA",
                types: ["administrative_area_level_1", "political"],
            },
            {
                longText: "United States",
                shortText: "US",
                types: ["country", "political"],
            },
            {
                longText: "94043",
                shortText: "94043",
                types: ["postal_code"],
            },
        ];

        const result = convertGoogleMapsAddress(addressComponents);

        expect(result).toEqual({
            address: "1600 Amphitheatre Parkway Google Building 41",
            city: "Mountain View",
            state: "CA",
            postalCode: "94043",
            country: "US",
        });
    });

    it("should convert a UK address correctly", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "221B",
                shortText: "221B",
                types: ["street_number"],
            },
            {
                longText: "Baker Street",
                shortText: "Baker St",
                types: ["route"],
            },
            {
                longText: "London",
                shortText: "London",
                types: ["postal_town"],
            },
            {
                longText: "Greater London",
                shortText: "Greater London",
                types: ["administrative_area_level_2", "political"],
            },
            {
                longText: "England",
                shortText: "England",
                types: ["administrative_area_level_1", "political"],
            },
            {
                longText: "United Kingdom",
                shortText: "GB",
                types: ["country", "political"],
            },
            {
                longText: "NW1 6XE",
                shortText: "NW1 6XE",
                types: ["postal_code"],
            },
        ];

        const result = convertGoogleMapsAddress(addressComponents);

        expect(result).toEqual({
            address: "221B Baker Street",
            city: "London",
            state: "England",
            postalCode: "NW1 6XE",
            country: "GB",
        });
    });

    it("should convert a Japanese address correctly", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "2",
                shortText: "2",
                types: ["premise"],
            },
            {
                longText: "1",
                shortText: "1",
                types: ["political", "sublocality", "sublocality_level_4"],
            },
            {
                longText: "1-chōme",
                shortText: "1-chōme",
                types: ["political", "sublocality", "sublocality_level_3"],
            },
            {
                longText: "Narihira",
                shortText: "Narihira",
                types: ["political", "sublocality", "sublocality_level_2"],
            },
            {
                longText: "Sumida City",
                shortText: "Sumida City",
                types: ["locality", "political"],
            },
            {
                longText: "Tokyo",
                shortText: "Tokyo",
                types: ["administrative_area_level_1", "political"],
            },
            {
                longText: "Japan",
                shortText: "JP",
                types: ["country", "political"],
            },
            {
                longText: "130-0002",
                shortText: "130-0002",
                types: ["postal_code"],
            },
        ];

        const result = convertGoogleMapsAddress(addressComponents);

        expect(result).toEqual({
            address: "2 Narihira 1-chōme 1",
            city: "Sumida City",
            state: "Tokyo",
            postalCode: "130-0002",
            country: "JP",
        });
    });

    it("should convert a French address correctly", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "Avenue des Champs-Élysées",
                shortText: "Av. des Champs-Élysées",
                types: ["route"],
            },
            {
                longText: "Paris",
                shortText: "Paris",
                types: ["locality", "political"],
            },
            {
                longText: "Paris",
                shortText: "Paris",
                types: ["administrative_area_level_2", "political"],
            },
            {
                longText: "Île-de-France",
                shortText: "IDF",
                types: ["administrative_area_level_1", "political"],
            },
            {
                longText: "France",
                shortText: "FR",
                types: ["country", "political"],
            },
            {
                longText: "75008",
                shortText: "75008",
                types: ["postal_code"],
            },
        ];

        const result = convertGoogleMapsAddress(addressComponents);

        expect(result).toEqual({
            address: "Avenue des Champs-Élysées",
            city: "Paris",
            state: "IDF",
            postalCode: "75008",
            country: "FR",
        });
    });

    it("should convert an Australian address correctly", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "1",
                shortText: "1",
                types: ["street_number"],
            },
            {
                longText: "Martin Place",
                shortText: "Martin Pl",
                types: ["route"],
            },
            {
                longText: "Sydney",
                shortText: "Sydney",
                types: ["locality", "political"],
            },
            {
                longText: "Council of the City of Sydney",
                shortText: "Sydney",
                types: ["administrative_area_level_2", "political"],
            },
            {
                longText: "New South Wales",
                shortText: "NSW",
                types: ["administrative_area_level_1", "political"],
            },
            {
                longText: "Australia",
                shortText: "AU",
                types: ["country", "political"],
            },
            {
                longText: "2000",
                shortText: "2000",
                types: ["postal_code"],
            },
        ];

        const result = convertGoogleMapsAddress(addressComponents);

        expect(result).toEqual({
            address: "1 Martin Place",
            city: "Sydney",
            state: "NSW",
            postalCode: "2000",
            country: "AU",
        });
    });

    it("should throw when city is missing", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "Some Street",
                shortText: "Some St",
                types: ["route"],
            },
            {
                longText: "United States",
                shortText: "US",
                types: ["country", "political"],
            },
            {
                longText: "12345",
                shortText: "12345",
                types: ["postal_code"],
            },
        ];

        expect(() => convertGoogleMapsAddress(addressComponents)).toThrow(
            "City is required but not present in address."
        );
    });

    it("should throw when postal code is missing", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "Some Street",
                shortText: "Some St",
                types: ["route"],
            },
            {
                longText: "Some City",
                shortText: "Some City",
                types: ["locality"],
            },
            {
                longText: "United States",
                shortText: "US",
                types: ["country", "political"],
            },
        ];

        expect(() => convertGoogleMapsAddress(addressComponents)).toThrow(
            "Postal code is required but not present in address."
        );
    });

    it("should throw when country is missing", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "Some Street",
                shortText: "Some St",
                types: ["route"],
            },
            {
                longText: "Some City",
                shortText: "Some City",
                types: ["locality"],
            },
            {
                longText: "12345",
                shortText: "12345",
                types: ["postal_code"],
            },
        ];

        expect(() => convertGoogleMapsAddress(addressComponents)).toThrow(
            "Country is required but not present in address."
        );
    });

    it("should handle address with only premise", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "Building A",
                shortText: "Building A",
                types: ["premise"],
            },
            {
                longText: "Some City",
                shortText: "Some City",
                types: ["locality"],
            },
            {
                longText: "Some State",
                shortText: "SS",
                types: ["administrative_area_level_1"],
            },
            {
                longText: "United States",
                shortText: "US",
                types: ["country", "political"],
            },
            {
                longText: "12345",
                shortText: "12345",
                types: ["postal_code"],
            },
        ];

        const result = convertGoogleMapsAddress(addressComponents);

        expect(result).toEqual({
            address: "Building A",
            city: "Some City",
            state: "SS",
            postalCode: "12345",
            country: "US",
        });
    });

    it("should handle address with street number and route", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "123",
                shortText: "123",
                types: ["street_number"],
            },
            {
                longText: "Main Street",
                shortText: "Main St",
                types: ["route"],
            },
            {
                longText: "Some City",
                shortText: "Some City",
                types: ["locality"],
            },
            {
                longText: "Some State",
                shortText: "SS",
                types: ["administrative_area_level_1"],
            },
            {
                longText: "United States",
                shortText: "US",
                types: ["country", "political"],
            },
            {
                longText: "12345",
                shortText: "12345",
                types: ["postal_code"],
            },
        ];

        const result = convertGoogleMapsAddress(addressComponents);

        expect(result).toEqual({
            address: "123 Main Street",
            city: "Some City",
            state: "SS",
            postalCode: "12345",
            country: "US",
        });
    });

    it("should handle address with all components", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "123",
                shortText: "123",
                types: ["street_number"],
            },
            {
                longText: "Main Street",
                shortText: "Main St",
                types: ["route"],
            },
            {
                longText: "Building A",
                shortText: "Building A",
                types: ["premise"],
            },
            {
                longText: "Some City",
                shortText: "Some City",
                types: ["locality"],
            },
            {
                longText: "Some State",
                shortText: "SS",
                types: ["administrative_area_level_1"],
            },
            {
                longText: "United States",
                shortText: "US",
                types: ["country", "political"],
            },
            {
                longText: "12345",
                shortText: "12345",
                types: ["postal_code"],
            },
        ];

        const result = convertGoogleMapsAddress(addressComponents);

        expect(result).toEqual({
            address: "123 Main Street Building A",
            city: "Some City",
            state: "SS",
            postalCode: "12345",
            country: "US",
        });
    });

    it("should use postal_town when locality is not available", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "123 Main Street",
                shortText: "123 Main St",
                types: ["route"],
            },
            {
                longText: "London",
                shortText: "London",
                types: ["postal_town"],
            },
            {
                longText: "England",
                shortText: "England",
                types: ["administrative_area_level_1"],
            },
            {
                longText: "United Kingdom",
                shortText: "GB",
                types: ["country", "political"],
            },
            {
                longText: "SW1A 1AA",
                shortText: "SW1A 1AA",
                types: ["postal_code"],
            },
        ];

        const result = convertGoogleMapsAddress(addressComponents);

        expect(result).toEqual({
            address: "123 Main Street",
            city: "London",
            state: "England",
            postalCode: "SW1A 1AA",
            country: "GB",
        });
    });

    it("should use administrative_area_level_2 when locality and postal_town are not available", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "123 Main Street",
                shortText: "123 Main St",
                types: ["route"],
            },
            {
                longText: "Some County",
                shortText: "Some County",
                types: ["administrative_area_level_2"],
            },
            {
                longText: "Some State",
                shortText: "SS",
                types: ["administrative_area_level_1"],
            },
            {
                longText: "United States",
                shortText: "US",
                types: ["country", "political"],
            },
            {
                longText: "12345",
                shortText: "12345",
                types: ["postal_code"],
            },
        ];

        const result = convertGoogleMapsAddress(addressComponents);

        expect(result).toEqual({
            address: "123 Main Street",
            city: "Some County",
            state: "SS",
            postalCode: "12345",
            country: "US",
        });
    });

    it("should convert a Japanese Shibuya address correctly", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "Shibuya Station",
                shortText: "Shibuya Station",
                types: ["establishment"],
            },
            {
                longText: "24",
                shortText: "24",
                types: ["sublocality_level_4"],
            },
            {
                longText: "2-chōme",
                shortText: "2-chōme",
                types: ["sublocality_level_3"],
            },
            {
                longText: "Shibuya",
                shortText: "Shibuya",
                types: ["sublocality_level_2"],
            },
            {
                longText: "Shibuya",
                shortText: "Shibuya",
                types: ["locality", "political"],
            },
            {
                longText: "Tokyo",
                shortText: "Tokyo",
                types: ["administrative_area_level_1", "political"],
            },
            {
                longText: "Japan",
                shortText: "JP",
                types: ["country", "political"],
            },
            {
                longText: "150-0002",
                shortText: "150-0002",
                types: ["postal_code"],
            },
        ];

        const result = convertGoogleMapsAddress(addressComponents);

        expect(result).toEqual({
            address: "Shibuya 2-chōme 24",
            city: "Shibuya",
            state: "Tokyo",
            postalCode: "150-0002",
            country: "JP",
        });
    });

    it("should handle undefined state when shortText is not available", () => {
        const addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[] = [
            {
                longText: "123 Main Street",
                shortText: "123 Main St",
                types: ["route"],
            },
            {
                longText: "Some City",
                shortText: "Some City",
                types: ["locality"],
            },
            {
                longText: "Some State",
                types: ["administrative_area_level_1"], // No shortText
            },
            {
                longText: "United States",
                shortText: "US",
                types: ["country", "political"],
            },
            {
                longText: "12345",
                shortText: "12345",
                types: ["postal_code"],
            },
        ];

        const result = convertGoogleMapsAddress(addressComponents);

        expect(result).toEqual({
            address: "123 Main Street",
            city: "Some City",
            state: undefined,
            postalCode: "12345",
            country: "US",
        });
    });
});
