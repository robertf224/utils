import { invariant } from "@bobbyfidz/panic";
import { protos } from "@googlemaps/places";
import { Address } from "../../Address.js";

// https://developers.google.com/maps/documentation/geocoding/requests-geocoding#Types

export function convertGoogleMapsAddress(
    addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[]
): Address {
    const componentsByType = Object.fromEntries(
        addressComponents
            .filter((component) => component.types && component.types.length > 0)
            .flatMap((component) => component.types!.map((type) => [type, component]))
    );

    const address = [
        componentsByType["street_number"],
        componentsByType["route"],
        componentsByType["premise"],
        componentsByType["sublocality_level_2"],
        componentsByType["sublocality_level_3"],
        componentsByType["sublocality_level_4"],
    ]
        .filter((component) => component !== undefined)
        .map((component) => component.longText)
        .join(" ");

    const city =
        componentsByType["locality"]?.longText ??
        componentsByType["postal_town"]?.longText ??
        componentsByType["administrative_area_level_2"]?.longText;
    invariant(city, "City is required but not present in address.");

    // TODO: make sure these match up with ISO 3166-2 codes eventually.
    // From Google's docs: "In most cases, administrative_area_level_1 short names will closely match ISO 3166-2 subdivisions and other widely circulated lists; however this is not guaranteed as our geocoding results are based on a variety of signals and location data."
    const state = componentsByType["administrative_area_level_1"]?.shortText ?? undefined;

    const postalCode = componentsByType["postal_code"]?.longText;
    invariant(postalCode, "Postal code is required but not present in address.");

    const country = componentsByType["country"]?.shortText;
    invariant(country, "Country is required but not present in address.");

    return {
        address,
        city,
        state,
        postalCode,
        country,
    };
}
