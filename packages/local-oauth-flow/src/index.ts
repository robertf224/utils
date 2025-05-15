import { Hono } from "hono";
import { serve } from "@hono/node-server";
import open from "open";
import {
    authorizationCodeGrantRequest,
    processAuthorizationCodeResponse,
    generateRandomCodeVerifier,
    calculatePKCECodeChallenge,
    Client,
    None,
    AuthorizationServer,
    validateAuthResponse,
    generateRandomState,
    processDiscoveryResponse,
    discoveryRequest,
} from "oauth4webapi";
import { invariant } from "@bobbyfidz/panic";

export interface OAuthFlowOpts {
    issuerUrl: string;
    authorizationUrl?: string;
    tokenUrl?: string;
    clientId: string;
    redirectUrl: string;
    scopes: string[];
}

export interface OAuthFlowResult {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
}

export async function performLocalOAuthFlow({
    issuerUrl,
    authorizationUrl,
    tokenUrl,
    clientId,
    redirectUrl,
    scopes,
}: OAuthFlowOpts): Promise<OAuthFlowResult> {
    const { hostname, port, pathname } = new URL(redirectUrl);

    let resolvePromise: (value: OAuthFlowResult) => void;
    let rejectPromise: (error: Error) => void;
    const flowResultPromise = new Promise<OAuthFlowResult>((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
    });

    if (!authorizationUrl || !tokenUrl) {
        const discoveryResponse = await discoveryRequest(new URL(issuerUrl));
        const discoveryResult = await processDiscoveryResponse(new URL(issuerUrl), discoveryResponse);
        authorizationUrl = discoveryResult.authorization_endpoint;
        tokenUrl = discoveryResult.token_endpoint;
        invariant(
            authorizationUrl && tokenUrl,
            "Authorization and token endpoints not found in discovery metadata."
        );
    }

    const authorizationServer: AuthorizationServer = {
        issuer: issuerUrl,
        authorization_endpoint: authorizationUrl,
        token_endpoint: tokenUrl,
    };

    const client: Client = {
        client_id: clientId,
        token_endpoint_auth_method: "none",
    };

    const codeVerifier = generateRandomCodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
    const state = generateRandomState();

    const app = new Hono();
    app.get(pathname, async (context) => {
        try {
            const callbackParameters = validateAuthResponse(
                authorizationServer,
                client,
                new URL(context.req.url).searchParams,
                state
            );

            const authorizationCodeGrantResponse = await authorizationCodeGrantRequest(
                authorizationServer,
                client,
                None(),
                callbackParameters,
                redirectUrl,
                codeVerifier
            );

            const result = await processAuthorizationCodeResponse(
                authorizationServer,
                client,
                authorizationCodeGrantResponse
            );

            resolvePromise({
                accessToken: result.access_token,
                refreshToken: result.refresh_token,
                expiresIn: result.expires_in,
            });

            return context.text("Authentication successful!");
        } catch (error) {
            rejectPromise(error instanceof Error ? error : new Error(String(error)));
            return context.text("Authentication failed!");
        }
    });

    const server = serve({
        fetch: app.fetch,
        port: Number.parseInt(port, 10),
        hostname,
    });

    try {
        const authorizationEndpoint = authorizationServer.authorization_endpoint;
        invariant(authorizationEndpoint, "Authorization endpoint not found in server metadata.");
        const authorizationUrl = new URL(authorizationEndpoint);
        authorizationUrl.searchParams.set("client_id", clientId);
        authorizationUrl.searchParams.set("redirect_uri", redirectUrl);
        authorizationUrl.searchParams.set("response_type", "code");
        authorizationUrl.searchParams.set("scope", scopes.join(" "));
        authorizationUrl.searchParams.set("code_challenge", codeChallenge);
        authorizationUrl.searchParams.set("code_challenge_method", "S256");
        authorizationUrl.searchParams.set("state", state);

        await open(authorizationUrl.toString(), { background: true });
        const flowResult = await flowResultPromise;
        return flowResult;
    } finally {
        server.close();
    }
}
