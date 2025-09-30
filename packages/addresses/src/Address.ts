// TODO: generics for narrowing types based on country.
export interface Address {
    address: string;
    address2?: string;
    city: string;
    /** State/province code. */
    state?: string;
    postalCode: string;
    /**
     * {@link https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2 ISO 3166-1 alpha-2 code}.
     */
    country: string;
}
