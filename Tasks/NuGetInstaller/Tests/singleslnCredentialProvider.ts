import ma = require('vsts-task-lib/mock-answer');
import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');
import VersionInfoVersion from 'nuget-task-common/pe-parser/VersionInfoVersion'
import {VersionInfo, VersionStrings} from 'nuget-task-common/pe-parser/VersionResource'

let taskPath = path.join(__dirname, '..', 'nugetinstaller.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('solution', 'single.sln');
tmr.setInput('nuGetVersion', '3.3.0');

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "osType": {
        "osType" : "Windows_NT"
    },
    "checkPath": {
        "c:\\agent\\home\\directory\\single.sln": true,
        "c:\\foo\\system32\\chcp.com": true
    },
    "which": {
        "c:\\foo\\system32\\chcp.com":"c:\\foo\\system32\\chcp.com"
    },
    "exec": {
        "c:\\agent\\home\\directory\\externals\\nuget\\nuget.exe restore -NonInteractive c:\\agent\\home\\directory\\single.sln": {
            "code": 0,
            "stdout": "NuGet output here",
            "stderr": ""
        },
        "c:\\foo\\system32\\chcp.com 65001": {
            "code": 0,
            "stdout": "",
            "stderr": ""
        }
    },
    "exist": {
        "c:\\agent\\home\\directory\\externals\\nuget\\nuget.exe": true,
        "c:\\agent\\home\\directory\\externals\\nuget\\CredentialProvider.TeamBuild.exe": true
    },
    "stats": {
        "c:\\agent\\home\\directory\\single.sln": {
            "isFile": true
        }
    }
};
tmr.setAnswers(a);

process.env['NUGET_FORCEENABLECREDENTIALPROVIDER'] = "true";
process.env['AGENT_HOMEDIRECTORY'] = "c:\\agent\\home\\directory";
process.env['BUILD_SOURCESDIRECTORY'] = "c:\\agent\\home\\directory\\sources";
process.env['ENDPOINT_AUTH_SYSTEMVSSCONNECTION'] = "{\"parameters\":{\"AccessToken\":\"cert\"},\"scheme\":\"OAuth\"}";
process.env['ENDPOINT_URL_SYSTEMVSSCONNECTION'] = "https://example.visualstudio.com/defaultcollection";
process.env['SYSTEM_DEFAULTWORKINGDIRECTORY'] = "c:\\agent\\home\\directory";
process.env['SYSTEM_TEAMFOUNDATIONCOLLECTIONURI'] = "https://example.visualstudio.com/defaultcollection";
process.env.windir = "c:\\foo";


tmr.registerMock('./pe-parser', {
    getFileVersionInfoAsync: function(nuGetExePath) {
        let result: VersionInfo = { strings: {} };
        result.fileVersion = new VersionInfoVersion(3, 3, 0, 212);
        result.strings['ProductVersion'] = "3.3.0";
        return result;
    }
} )

tmr.registerMock('nuget-task-common/Utility', {
    resolveFilterSpec: function(filterSpec, basePath?, allowEmptyMatch?) {
        return ["c:\\agent\\home\\directory\\single.sln"];
    },
    getBundledNuGetLocation: function(version) {
        return 'c:\\agent\\home\\directory\\externals\\nuget\\nuget.exe';
    }
} )

// Required for NuGetToolRunner
var mtt = require('vsts-task-lib/mock-toolrunner');
tmr.registerMock('vsts-task-lib/toolrunner', mtt);

tmr.run();
