import { Helm } from "../Helm.js";

async function ensureHelm(): Promise<string> {
    return Helm.ensureBinary();
}

ensureHelm()
    .then((helmPath) => {
        console.log(helmPath);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
