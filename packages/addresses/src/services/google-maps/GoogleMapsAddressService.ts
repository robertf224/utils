import { PlacesClient } from "@googlemaps/places";
import { Address } from "../../Address.js";
import { AutocompleteAddressResult, AddressService, AutocompleteAddressBias } from "../../AddressService.js";
import { convertGoogleMapsAddress } from "./convertGoogleMapsAddress.js";

export class GoogleMapsAddressService implements AddressService {
    #client: PlacesClient;

    constructor(apiKey: string) {
        this.#client = new PlacesClient({ apiKey });
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

        const [response] = await this.#client.autocompletePlaces(
            {
                input: query,
                includedPrimaryTypes: ["street_address"],
                sessionToken: opts.sessionToken,
                // TODO: may need to convert from ccTLD to ISO 3166-1 alpha-2 code.
                includedRegionCodes: opts.countries,
            },
            {
                otherArgs: {
                    headers,
                },
            }
        );

        return response.suggestions!.map((suggestion) => ({
            id: suggestion.placePrediction!.placeId!,
            label: suggestion.placePrediction!.text!.text!,
        }));
    }

    async getAddress(id: string, opts: { sessionToken?: string }): Promise<{ address: Address }> {
        const headers: Record<string, string> = {
            "X-Goog-FieldMask": "addressComponents",
        };

        const [response] = await this.#client.getPlace(
            { name: `places/${id}`, sessionToken: opts.sessionToken },
            {
                otherArgs: {
                    headers,
                },
            }
        );

        return {
            address: convertGoogleMapsAddress(response.addressComponents!),
        };
    }
}
