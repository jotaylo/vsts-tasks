/// <reference path="../../definitions/node.d.ts"/>
/// <reference path="../../definitions/Q.d.ts" />
/// <reference path="../../definitions/vsts-task-lib.d.ts" />
/// <reference path="../../definitions/nuget-task-common.d.ts" />

import * as path from "path";
import * as Q  from "q";
import * as tl from "vsts-task-lib/task";

import * as auth from "nuget-task-common/Authentication";
import INuGetCommandOptions from "nuget-task-common/INuGetCommandOptions";
import locationHelpers = require("nuget-task-common/LocationHelpers");
import {NuGetConfigHelper} from "nuget-task-common/NuGetConfigHelper";
import * as ngToolRunner from "nuget-task-common/NuGetToolRunner";
import * as nutil from "nuget-task-common/Utility";

class RestoreOptions implements INuGetCommandOptions {
    constructor(
        public restoreMode: string,
        public nuGetPath: string,
        public configFile: string,
        public noCache: boolean,
        public verbosity: string,
        public extraArgs: string,
        public environment: ngToolRunner.NuGetEnvironmentSettings
    ) { }
}

async function main(): Promise<void> {
    let buildIdentityDisplayName: string = null;
    let buildIdentityAccount: string = null;

    try {
        tl.setResourcePath(path.join(__dirname, "task.json"));

        // set the console code page to "UTF-8"
        if (process.platform === "win32") {
            tl.execSync(path.resolve(process.env.windir, "system32", "chcp.com"), ["65001"]);
        }

        // read inputs
        let solution = tl.getPathInput("solution", true, false);
        let filesList = nutil.resolveFilterSpec(
            solution,
            tl.getVariable("System.DefaultWorkingDirectory") || process.cwd());
        filesList.forEach(solutionFile => {
            if (!tl.stats(solutionFile).isFile()) {
                throw new Error(tl.loc("NotARegularFile", solutionFile));
            }
        });

        let noCache = tl.getBoolInput("noCache");
        let nuGetRestoreArgs = tl.getInput("nuGetRestoreArgs");
        let verbosity = tl.getInput("verbosity");

        let restoreMode = tl.getInput("restoreMode") || "Restore";
        // normalize the restore mode for display purposes, and ensure it's a known one
        let normalizedRestoreMode = ["restore", "install"].find(x => restoreMode.toUpperCase() === x.toUpperCase());
        if (!normalizedRestoreMode) {
            throw new Error(tl.loc("UnknownRestoreMode", restoreMode));
        }

        restoreMode = normalizedRestoreMode;

        let nugetConfigPath = tl.getPathInput("nugetConfigPath", false, true);
        if (!tl.filePathSupplied("nugetConfigPath")) {
            nugetConfigPath = null;
        }

        // due to a bug where we accidentally allowed nuGetPath to be surrounded by quotes before,
        // locateNuGetExe() will strip them and check for existence there.
        let userNuGetPath = tl.getPathInput("nuGetPath", false, false);
        if (!tl.filePathSupplied("nuGetPath")) {
            userNuGetPath = null;
        }

        let serviceUri = tl.getEndpointUrl("SYSTEMVSSCONNECTION", false);

        // find nuget location to use
        let nuGetPathToUse = ngToolRunner.locateNuGetExe(userNuGetPath);
        let credProviderPath = ngToolRunner.locateCredentialProvider();

        const quirks = await ngToolRunner.getNuGetQuirksAsync(nuGetPathToUse);

        // clauses ordered in this way to avoid short-circuit evaluation, so the debug info printed by the functions
        // is unconditionally displayed
        const useCredProvider = ngToolRunner.isCredentialProviderEnabled(quirks) && credProviderPath;
        const useCredConfig = ngToolRunner.isCredentialConfigEnabled(quirks) && !useCredProvider;

        let accessToken = auth.getSystemAccessToken();
        let urlPrefixes = await locationHelpers.assumeNuGetUriPrefixes(serviceUri);
        tl.debug(`discovered URL prefixes: ${urlPrefixes}`);

        // Note to readers: This variable will be going away once we have a fix for the location service for
        // customers behind proxies
        let testPrefixes = tl.getVariable("NuGetTasks.ExtraUrlPrefixesForTesting");
        if (testPrefixes) {
            urlPrefixes = urlPrefixes.concat(testPrefixes.split(";"));
            tl.debug(`all URL prefixes: ${urlPrefixes}`);
        }

        const authInfo = new auth.NuGetAuthInfo(urlPrefixes, accessToken);
        let environmentSettings: ngToolRunner.NuGetEnvironmentSettings = {
            authInfo: authInfo,
            credProviderFolder: useCredProvider ? path.dirname(credProviderPath) : null,
            extensionsDisabled: !userNuGetPath,
        };

        let configFile = nugetConfigPath;
        let credCleanup = () => { return; };
        if (useCredConfig) {
            if (nugetConfigPath) {
                let nuGetConfigHelper = new NuGetConfigHelper(
                    nuGetPathToUse,
                    nugetConfigPath,
                    authInfo,
                    environmentSettings);
                const packageSources = await nuGetConfigHelper.getSourcesFromConfig();

                if (packageSources.length !== 0) {
                    nuGetConfigHelper.setSources(packageSources);
                    credCleanup = () => tl.rmRF(nuGetConfigHelper.tempNugetConfigPath, true);
                    configFile = nuGetConfigHelper.tempNugetConfigPath;
                }
            }
            else {
                if (credProviderPath) {
                    tl.warning(tl.loc("Warning_NoConfigForOldNuGet"));
                }
                else {
                    tl._writeLine(tl.loc("Warning_NoConfigForNoCredentialProvider"));
                }
            }
        }

        try {
            let restoreOptions = new RestoreOptions(
                restoreMode,
                nuGetPathToUse,
                configFile,
                noCache,
                verbosity,
                nuGetRestoreArgs,
                environmentSettings);

            for (const solutionFile of filesList) {
                await restorePackagesAsync(solutionFile, restoreOptions);
            }
        } finally {
            credCleanup();
        }

        tl.setResult(tl.TaskResult.Succeeded, tl.loc("PackagesInstalledSuccessfully"));
    } catch (err) {
        tl.error(err);

        if (buildIdentityDisplayName || buildIdentityAccount) {
            tl.warning(tl.loc("BuildIdentityPermissionsHint", buildIdentityDisplayName, buildIdentityAccount));
        }

        tl.setResult(tl.TaskResult.Failed, tl.loc("PackagesFailedToInstall"));
    }
}

main();

function restorePackagesAsync(solutionFile: string, options: RestoreOptions): Q.Promise<number> {
    let nugetTool = ngToolRunner.createNuGetToolRunner(options.nuGetPath, options.environment);
    nugetTool.arg(options.restoreMode);
    nugetTool.arg("-NonInteractive");

    nugetTool.arg(solutionFile);

    if (options.configFile) {
        nugetTool.arg("-ConfigFile");
        nugetTool.arg(options.configFile);
    }

    if (options.noCache) {
        nugetTool.arg("-NoCache");
    }

    if (options.verbosity && options.verbosity !== "-") {
        nugetTool.arg("-Verbosity");
        nugetTool.arg(options.verbosity);
    }

    if (options.extraArgs) {
        nugetTool.argString(options.extraArgs);
    }

    return nugetTool.exec({ cwd: path.dirname(solutionFile) });
}
