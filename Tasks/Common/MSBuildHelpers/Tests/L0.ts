/// <reference path="../../../../definitions/mocha.d.ts"/>
/// <reference path="../../../../definitions/node.d.ts"/>
/// <reference path="../../../../definitions/Q.d.ts"/>

import Q = require('q');
import assert = require('assert');
import path = require('path');
var psm = require('../../../../Tests/lib/psRunner');
var shell = require('shelljs');
var ps = shell.which('powershell.exe');
var psr = null;

describe('Common-MSBuildHelpers Suite', function () {
    this.timeout(20000);

    before((done) => {
        if (ps) {
            psr = new psm.PSRunner();
            psr.start();
        }

        done();
    });

    after(function () {
        psr.kill();
    });

    if (ps) {
        it('(Format-MSBuildArguments) adds configuration property', (done) => {
            psr.run(path.join(__dirname, 'Format-MSBuildArguments.AddsConfigurationProperty.ps1'), done);
        })
        it('(Format-MSBuildArguments) adds maximum CPU count', (done) => {
            psr.run(path.join(__dirname, 'Format-MSBuildArguments.AddsMaximumCpuCount.ps1'), done);
        })
        it('(Format-MSBuildArguments) adds platform property', (done) => {
            psr.run(path.join(__dirname, 'Format-MSBuildArguments.AddsPlatformProperty.ps1'), done);
        })
        it('(Format-MSBuildArguments) adds VS version property', (done) => {
            psr.run(path.join(__dirname, 'Format-MSBuildArguments.AddsVSVersionProperty.ps1'), done);
        })
        it('(Format-MSBuildArguments) adds MS deploy user agent property', (done) => {
            psr.run(path.join(__dirname, 'Format-MSBuildArguments.AddsMSDeployUserAgentProperty.ps1'), done);
        })
        it('(Get-SolutionFiles) resolves wildcards', (done) => {
            psr.run(path.join(__dirname, 'Get-SolutionFiles.ResolvesWildcards.ps1'), done);
        })
        it('(Get-SolutionFiles) returns non wildcard solution', (done) => {
            psr.run(path.join(__dirname, 'Get-SolutionFiles.ReturnsNonWildcardSolution.ps1'), done);
        })
        it('(Get-SolutionFiles) throws if no solution', (done) => {
            psr.run(path.join(__dirname, 'Get-SolutionFiles.ThrowsIfNoSolution.ps1'), done);
        })
        it('(Get-SolutionFiles) throws if no solution found', (done) => {
            psr.run(path.join(__dirname, 'Get-SolutionFiles.ThrowsIfNoSolutionFound.ps1'), done);
        })
        it('(Invoke-BuildTools) invokes all tools for all files', (done) => {
            psr.run(path.join(__dirname, 'Invoke-BuildTools.InvokesAllToolsForAllFiles.ps1'), done);
        })
        it('(Invoke-BuildTools) skips clean if specified', (done) => {
            psr.run(path.join(__dirname, 'Invoke-BuildTools.SkipsCleanIfSpecified.ps1'), done);
        })
        it('(Invoke-BuildTools) skips create log file if specified', (done) => {
            psr.run(path.join(__dirname, 'Invoke-BuildTools.SkipsCreateLogFileIfSpecified.ps1'), done);
        })
        it('(Invoke-BuildTools) skips restore if specified', (done) => {
            psr.run(path.join(__dirname, 'Invoke-BuildTools.SkipsRestoreIfSpecified.ps1'), done);
        })
        it('(Invoke-MSBuild) combines msbuildexe', (done) => {
            psr.run(path.join(__dirname, 'Invoke-MSBuild.CombinesMsbuildexe.ps1'), done);
        })
        it('(Invoke-MSBuild) fails root timeline detail on exit code', (done) => {
            psr.run(path.join(__dirname, 'Invoke-MSBuild.FailsRootTimelineDetailOnExitCode.ps1'), done);
        })
        it('(Invoke-MSBuild) omits timeline detail', (done) => {
            psr.run(path.join(__dirname, 'Invoke-MSBuild.OmitsTimelineDetail.ps1'), done);
        })
        it('(Invoke-MSBuild) writes root timeline detail', (done) => {
            psr.run(path.join(__dirname, 'Invoke-MSBuild.WritesRootTimelineDetail.ps1'), done);
        })
    }
});