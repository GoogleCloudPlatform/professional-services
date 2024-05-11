import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import * as fs from "fs";

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBuilder(args: string[]) {
    if (args.length < 1) {
        console.error("Please specify your script as a first argument");
        process.exit(1);
    }

    // personal access token auth
    const token = process.env.GITHUB_TOKEN || process.env._GITHUB_TOKEN;

    // github app installation needs ID of the installation
    // and the private key
    const appID = process.env.APP_ID || process.env._APP_ID;
    const installationID = process.env.INSTALLATION_ID || process.env._INSTALLATION_ID;
    let installationPK = process.env.INSTALLATION_PK || process.env._INSTALLATION_PK;

    // decide how the octokit behaves (either personal or github app)
    let octokit: Octokit;

    if (token) {
        console.info("Using Personal Access Token as an authentication method");
        octokit = new Octokit({
            auth: token,
        });
    } else if (appID && installationID && installationPK) {
        console.info("Using Github App as an authentication method")

        // sm:// is used to prefix secrets stored in a Google Secret Manager
        // Since the Private Key may be stored there, we check for its pressence
        if (installationPK.startsWith("sm://")) {
            console.info("Retrieving Private Key from Secret Manager");
            // we'll authenticate only using our current runtime for now
            const sm = new SecretManagerServiceClient();

            const smPk = installationPK.replace(/^sm:\/\//, '');
            const [accessResponse] = await sm.accessSecretVersion({
                name: smPk,
            });

            installationPK = accessResponse.payload.data.toString();
        }

        octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: appID,
                privateKey: installationPK,
                installationId: installationID
            }
        });
    } else {
        console.error("Please specify either GITHUB_TOKEN or (APP_ID and INSTALLATION_ID and INSTALLATION_PK)");
        process.exit(1);
    }

    // either use the inline script or resolve to file, open it and replace contents
    // in the `script` variable for the file contents
    let script = args[0];
    try {
        if (fs.lstatSync(script).isFile()) {
            script = fs.readFileSync(script).toString();
        }
    } catch (_) {
        // ignore the error as it only means the argument wasn't a file
    }

    // we don't know when the eval ends and wrapping into async makes
    // the whole eval script await-able for users
    let __eval_done = false;
    eval(`(async () => {
        try {
            ${script};
        } catch (e) {
            console.error("Script error:", e)
        }
        __eval_done = true;
    })();`);
    while (!__eval_done) {
        await sleep(300);
    }
}

const args = process.argv.slice(2);
runBuilder(args).catch(console.error);
