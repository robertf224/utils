import { Helm } from "../Helm.js";

async function ensureHelm(): Promise<void> {
    const helmPath = await Helm.ensureBinary();
    console.log(helmPath);
}

ensureHelm()
    .then(console.log)
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
