import { Address } from "../../Address.js";
import { AutocompleteAddressResult, AddressService, AutocompleteAddressBias } from "../../AddressService.js";
import { convertGoogleMapsAddress } from "./convertGoogleMapsAddress.js";
import type { protos } from "@googlemaps/places";

export class GoogleMapsAddressService implements AddressService {
    #apiKey: string;

    constructor(apiKey: string) {
        this.#apiKey = apiKey;
    }

    async autocompleteAddress(
        query: string,
        opts: { countries?: string[]; sessionToken?: string; bias?: AutocompleteAddressBias }
    ): Promise<AutocompleteAddressResult[]> {
        const headers: Record<string, string> = {
            "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
        };

        if (opts.bias?.type === "ip") {
            headers["X-Forwarded-For"] = opts.bias.ip;
        }

        const response = await fetch(
            `https://places.googleapis.com/v1/places:autocomplete?key=${this.#apiKey}`,
            {
                method: "POST",
                body: JSON.stringify({
                    input: query,
                    includedPrimaryTypes: ["street_address"],
                    sessionToken: opts.sessionToken,
                    // TODO: may need to convert from ccTLD to ISO 3166-1 alpha-2 code.
                    includedRegionCodes: opts.countries,
                }),
                headers,
            }
        );
        const { suggestions } = (await response.json()) as {
            suggestions: { placePrediction: { placeId: string; text: { text: string } } }[];
        };

        return suggestions.map((suggestion) => ({
            id: suggestion.placePrediction.placeId,
            label: suggestion.placePrediction.text.text,
        }));
    }

    async getAddress(id: string, opts: { sessionToken?: string }): Promise<{ address: Address }> {
        const headers: Record<string, string> = {
            "X-Goog-FieldMask": "addressComponents",
        };

        const response = await fetch(
            `https://places.googleapis.com/v1/places/${id}?key=${this.#apiKey}&sessionToken=${opts.sessionToken}`,
            {
                method: "GET",
                headers,
            }
        );
        const { addressComponents } = (await response.json()) as {
            addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[];
        };

        return {
            address: convertGoogleMapsAddress(addressComponents),
        };
    }
}
