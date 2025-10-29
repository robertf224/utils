import { invariant } from "@bobbyfidz/panic";
import { Address } from "../Address.js";
import { GoogleMapsAddressService } from "../services/google-maps/index.js";

async function autocomplete(query: string): Promise<Address> {
    invariant(process.env.GOOGLE_MAPS_API_KEY, "GOOGLE_MAPS_API_KEY is not set.");
    const services = new GoogleMapsAddressService({ apiKey: process.env.GOOGLE_MAPS_API_KEY });

    const sessionToken = crypto.randomUUID();

    const [firstResult] = await services.autocompleteAddress(query, {
        countries: ["US"],
        sessionToken,
    });
    invariant(firstResult, "No results found.");

    const { address } = await services.getAddress(firstResult.id, {
        sessionToken,
    });

    return address;
}

autocomplete(process.argv[2]!)
    .then(console.log)
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
