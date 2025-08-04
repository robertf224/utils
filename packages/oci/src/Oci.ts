import { cp, mkdir } from "fs/promises";
import path, { isAbsolute } from "path";
import { invariant } from "@bobbyfidz/panic";
import { Temp } from "@bobbyfidz/temp";
import * as tar from "tar";
import { Crane } from "./Crane.js";
import { Oras } from "./Oras.js";

async function publishImage(opts: {
    username?: string;
    password?: string;
    /** The reference image to start from. */
    from: string;
    /** Folders to copy into the image. */
    copy: Array<{ sourceFolder: string; destinationFolder: string }>;
    cmd?: string[];
    user?: string;
    workdir?: string;
    env?: Record<string, string>;
    labels?: Record<string, string>;
    /** The ports to expose on the image. */
    expose?: number[];
    /** The tag to apply to the new image. */
    tag: string;
    dryRun?: boolean;
}): Promise<void> {
    invariant(
        opts.copy.every((copy) => isAbsolute(copy.destinationFolder)),
        "Destination folders must be absolute."
    );

    const tarballs: string[] = [];
    if (opts.copy.length > 0) {
        for (const copy of opts.copy) {
            const tempFolder = await Temp.folder();
            const destinationFolder = path.join(tempFolder, copy.destinationFolder);
            await mkdir(destinationFolder, { recursive: true });
            await cp(copy.sourceFolder, destinationFolder, { recursive: true });
            const tarball = await Temp.file(".tar");
            await tar.create(
                {
                    file: tarball,
                    cwd: tempFolder,
                },
                [copy.destinationFolder.slice(1)]
            );
            tarballs.push(tarball);
        }
    }

    if (opts.username && opts.password) {
        await Crane.login({
            registry: opts.tag.split("/")[0]!,
            username: opts.username,
            password: opts.password,
        });
    }

    let output: string | undefined;
    if (opts.dryRun) {
        const [name, version] = opts.tag.split("/")[2]!.split(":");
        output = `${name}-${version}.tar`;
    }

    await Crane.mutate({
        imageReference: opts.from,
        append: tarballs,
        cmd: opts.cmd,
        user: opts.user,
        workdir: opts.workdir,
        env: opts.env,
        labels: opts.labels,
        exposedPorts: opts.expose,
        tag: opts.tag,
        output,
    });
}

async function publishArtifact(opts: {
    username?: string;
    password?: string;
    /** The paths to include in the artifact. */
    paths: string[];
    /** The tag to apply to the new artifact. */
    tag: string;
}): Promise<void> {
    await Oras.push({
        username: opts.username,
        password: opts.password,
        paths: opts.paths,
        tag: opts.tag,
    });
}

async function pullArtifact(opts: {
    username?: string;
    password?: string;
    /** The tag to pull the artifact from. */
    tag: string;
    /** The folder to output the artifact to. */
    outputFolder: string;
}): Promise<void> {
    await mkdir(opts.outputFolder, { recursive: true });
    await Oras.pull({
        username: opts.username,
        password: opts.password,
        tag: opts.tag,
        cwd: opts.outputFolder,
    });
}

export const Oci = {
    publishImage,
    publishArtifact,
    pullArtifact,
};
