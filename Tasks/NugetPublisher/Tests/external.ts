import ma = require('vsts-task-lib/mock-answer');
import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');
import util = require('./NugetMockHelper');

let taskPath = path.join(__dirname, '..', 'nugetpublisher.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);
let nmh: util.NugetMockHelper = new util.NugetMockHelper(tmr);

nmh.setNugetVersionInputDefault();
tmr.setInput('searchPattern', 'package.nupkg');
tmr.setInput('nuGetFeedType', 'external');
tmr.setInput('connectedServiceName', 'testFeedExternalUri');

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "osType": {},
    "checkPath": {
        "c:\\agent\\home\\directory\\package.nupkg": true
    },
    "which": {},
    "exec": {
        "c:\\agent\\home\\directory\\externals\\nuget\\nuget.exe push -NonInteractive c:\\agent\\home\\directory\\package.nupkg -Source https://example.feed.com -ApiKey secret": {
            "code": 0,
            "stdout": "NuGet output here",
            "stderr": ""
        }
    },
    "exist": {},
    "stats": {
        "c:\\agent\\home\\directory\\package.nupkg": {
            "isFile": true
        }
    }
};
nmh.setAnswers(a);

process.env['ENDPOINT_AUTH_testFeedExternalUri'] = "{\"parameters\":{\"password\":\"secret\"},\"scheme\":\"Basic\"}";
process.env['ENDPOINT_URL_testFeedExternalUri'] = "https://example.feed.com";

nmh.registerDefaultNugetVersionMock();
nmh.registerNugetConfigMock();
nmh.registerToolRunnerMock();

tmr.registerMock('nuget-task-common/Utility', {
    resolveFilterSpec: function(filterSpec, basePath?, allowEmptyMatch?) {
        return ["c:\\agent\\home\\directory\\package.nupkg"];
    },
    getBundledNuGetLocation: function(version) {
        return 'c:\\agent\\home\\directory\\externals\\nuget\\nuget.exe';
    }
} )

tmr.run();
