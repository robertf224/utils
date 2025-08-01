import { cp, mkdir } from "fs/promises";
import path, { isAbsolute } from "path";
import { invariant } from "@bobbyfidz/panic";
import { Temp } from "@bobbyfidz/temp";
import * as tar from "tar";
import { Crane } from "./Crane.js";
import { Oras } from "./Oras.js";

async function publishImage(opts: {
    /** The reference image to start from. */
    from: string;
    /** Folders to copy into the image. */
    copy: Array<{ sourceFolder: string; destinationFolder: string }>;
    cmd?: string[];
    user?: string;
    workdir?: string;
    env?: Record<string, string>;
    /** The ports to expose on the image. */
    expose?: number[];
    /** The tag to apply to the new image. */
    tag: string;
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
                },
                [destinationFolder]
            );
            tarballs.push(tarball);
        }
    }

    await Crane.mutate({
        imageReference: opts.from,
        append: tarballs,
        cmd: opts.cmd,
        user: opts.user,
        workdir: opts.workdir,
        env: opts.env,
        exposedPorts: opts.expose,
        tag: opts.tag,
    });
}

async function publishArtifact(opts: {
    /** The paths to include in the artifact. */
    paths: string[];
    /** The tag to apply to the new artifact. */
    tag: string;
}): Promise<void> {
    await Oras.push({
        paths: opts.paths,
        tag: opts.tag,
    });
}

export const Oci = {
    publishImage,
    publishArtifact,
};
