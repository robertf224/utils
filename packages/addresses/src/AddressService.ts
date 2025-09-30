import { Address } from "./Address.js";

export interface AutocompleteAddressResult {
    id: string;
    label: string;
    address?: Address;
}

export type AutocompleteAddressBias = { type: "ip"; ip: string };

// TODO: generics for narrowing opts and return types based on provider.
export interface AddressService {
    autocompleteAddress: (
        query: string,
        opts: { countries?: string[]; sessionToken?: string; bias?: AutocompleteAddressBias }
    ) => Promise<AutocompleteAddressResult[]>;
    getAddress: (id: string, opts: { sessionToken?: string }) => Promise<{ address: Address }>;
}
