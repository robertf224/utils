import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import { BinaryDownload } from "@bobbyfidz/binaries";
import { invariant } from "@bobbyfidz/panic";
import { Pathnames, Urls } from "@bobbyfidz/urls";
import { createConfidentialOauthClient } from "@osdk/oauth";

const execAsync = promisify(exec);

const BINARY_NAME = "apollo-cli";
const VERSION = "0.538.0";

async function ensureBinary(opts: {
    apolloUrl: string;
    clientId: string;
    clientSecret: string;
}): Promise<string> {
    const tokenProvider = createConfidentialOauthClient(opts.clientId, opts.clientSecret, opts.apolloUrl);
    const token = await tokenProvider();
    return BinaryDownload.ensure(
        BINARY_NAME,
        VERSION,
        (binaryTarget) => {
            let distribution: string;
            switch (binaryTarget.platform) {
                case "darwin":
                    distribution = "macos";
                    break;
                case "linux":
                    invariant(binaryTarget.arch === "arm64", "Apollo CLI is only supported on arm64.");
                    distribution = "linux-amd64";
                    break;
                case "windows":
                    switch (binaryTarget.arch) {
                        case "x64":
                            distribution = "windows-386";
                            break;
                        case "arm64":
                            distribution = "windows-amd64";
                            break;
                    }
                    break;
            }
            return {
                url: Urls.extend(opts.apolloUrl, {
                    // TODO: figure out how to pin version.
                    pathname: Pathnames.join("assets/dyn/apollo-cli/bin", distribution, "apollo-cli"),
                }).toString(),
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
        },
        path.join(import.meta.dirname, "..", "node_modules", ".cache", "apollo")
    );
}

async function executeCommand(
    opts: {
        apolloUrl: string;
        clientId: string;
        clientSecret: string;
    },
    args: string[],
    cwd?: string
): Promise<{ stdout: string; stderr: string }> {
    const cliPath = await ensureBinary(opts);
    return await execAsync(`${cliPath} ${args.join(" ")}`, { cwd });
}

export async function publishHelmChart(opts: {
    apolloUrl: string;
    clientId: string;
    clientSecret: string;
    helmRepositoryUrl: string;
    helmChartName: string;
    helmChartVersion: string;
    helmUsername: string;
    helmPassword: string;
    mavenCoordinate: string;
}) {
    await executeCommand(opts, [
        "publish",
        "helm-chart",
        "--apollo-url",
        opts.apolloUrl,
        "--apollo-token-provider",
        "service-user",
        "--apollo-client-id",
        opts.clientId,
        "--apollo-client-secret",
        opts.clientSecret,
        "--helm-repository-url",
        opts.helmRepositoryUrl,
        "--helm-chart-name",
        opts.helmChartName,
        "--helm-chart-version",
        opts.helmChartVersion,
        "--helm-username",
        opts.helmUsername,
        "--helm-password",
        opts.helmPassword,
        "--maven-coordinate",
        opts.mavenCoordinate,
    ]);
}

export const Apollo = {
    publishHelmChart,
};
