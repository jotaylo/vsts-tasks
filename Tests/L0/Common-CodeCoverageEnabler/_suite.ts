/// <reference path="../../../definitions/mocha.d.ts"/>
/// <reference path="../../../definitions/node.d.ts"/>
/// <reference path="../../../definitions/Q.d.ts"/>
import Q = require('q');
import assert = require('assert');
import mockHelper = require('../../lib/mockHelper');
import path = require('path');
import fs = require('fs');
import tl = require('../../lib/vsts-task-lib/toolRunner');

// Paths aren't the same between compile time and run time. This will need some work
let realrequire = require;
function myrequire(module: string): any {
    return realrequire(path.join(__dirname, "../../../Tasks/Ant/node_modules", module));
}
require = <typeof require>myrequire;
import { CodeCoverageEnablerFactory } from 'codecoverage-tools/codecoveragefactory';
let xml2js = require('xml2js'); 

function setResponseFile(name: string) {
    process.env['MOCK_RESPONSES'] = path.join(__dirname, name);
}

describe('Code Coverage enable tool tests', function () {
    this.timeout(20000);

    let data = path.join(__dirname, "data");
    let buildProps: { [key: string]: string } = {};
    buildProps['classfilter'] = "+:com.abc,-:com.xyz"
    buildProps['classfilesdirectories'] = "cfd";
    buildProps['sourcedirectories'] = "sd";
    buildProps['summaryfile'] = "coverage.xml";
    buildProps['reportdirectory'] = path.join(data, "CCReport43F6D5EF");
    buildProps['ccreporttask'] = "CodeCoverage_9064e1d0"
    buildProps['reportbuildfile'] = path.join(data, "CCReportBuildA4D283EG.xml");

    before((done) => {
        Q.longStackSupport = true;
        done();
    });

    after(function () {
    });

    /* Maven build tool - Code Coverage */
    it('Maven single module build file with Jacoco CC', (done) => {
        let buildFile = path.join(data, "single_module_pom.xml");
        buildProps['buildfile'] = buildFile;

        let ccEnabler = new CodeCoverageEnablerFactory().getTool("maven", "jacoco");
        ccEnabler.enableCodeCoverage(buildProps).then(function () {
            let content = fs.readFileSync(buildFile, "utf-8");
            assert.notEqual(content.indexOf(`<include>**/com/abc.class</include>`), -1, "Include filter must be present");
            assert.notEqual(content.indexOf(`<exclude>**/com/xyz.class</exclude>`), -1, "Exclude filter must be present");
            assert.notEqual(content.indexOf(`jacoco-maven-plugin`), -1, "Jacoco maven plugin must be enabled");
            done();
        }).catch(function (err) {
            done(err);
        });
    })

    it('Maven multi module build file with Jacoco CC', (done) => {
        let buildFile = path.join(data, "multi_module_pom.xml");
        buildProps['buildfile'] = buildFile;

        let ccEnabler = new CodeCoverageEnablerFactory().getTool("maven", "jacoco");
        ccEnabler.enableCodeCoverage(buildProps).then(function (resp) {
            let content = fs.readFileSync(buildFile, "utf-8");
            assert.notEqual(content.indexOf(`<include>**/com/abc.class</include>`), -1, "Include filter must be present");
            assert.notEqual(content.indexOf(`<exclude>**/com/xyz.class</exclude>`), -1, "Exclude filter must be present");
            assert.notEqual(content.indexOf(`jacoco-maven-plugin`), -1, "Jacoco maven plugin must be enabled");
            done();
        }).catch(function (err) {
            done(err);
        });
    })

    it('Maven single module build file with Cobertura CC', (done) => {
        let buildFile = path.join(data, "single_module_pom.xml");
        buildProps['buildfile'] = buildFile;

        let ccEnabler = new CodeCoverageEnablerFactory().getTool("maven", "cobertura");
        ccEnabler.enableCodeCoverage(buildProps).then(function (resp) {
            let content = fs.readFileSync(buildFile, "utf-8");
            assert.notEqual(content.indexOf(`<include>com/abc.class</include>`), -1, "Include filter must be present");
            assert.notEqual(content.indexOf(`<exclude>com/xyz.class</exclude>`), -1, "Exclude filter must be present");
            assert.notEqual(content.indexOf(`cobertura-maven-plugin`), -1, "Cobertura maven plugin must be enabled");
            done();
        }).catch(function (err) {
            done(err);
        });
    })

    it('Maven single module build with reporting extensions - Cobertura CC', (done) => {
        let buildFile = path.join(data, "pom_with_reporting_plugins.xml");
        buildProps['buildfile'] = buildFile;

        let ccEnabler = new CodeCoverageEnablerFactory().getTool("maven", "cobertura");
        ccEnabler.enableCodeCoverage(buildProps).then(function (resp) {
            let content = fs.readFileSync(buildFile, "utf-8");
            assert.notEqual(content.indexOf(`<include>com/abc.class</include>`), -1, "Include filter must be present");
            assert.notEqual(content.indexOf(`<exclude>com/xyz.class</exclude>`), -1, "Exclude filter must be present");
            assert.notEqual(content.indexOf(`cobertura-maven-plugin`), -1, "Cobertura maven plugin must be enabled");
            let xmlContent = xml2js.parseString(content, function (err, res) {
                assert.equal(res.project.reporting[0].plugins[0].plugin.length, 3, "Cobertura plugin added in the right place");
            })
            done();
        }).catch(function (err) {
            done(err);
        });
    })

    it('Maven multi module build file with Cobertura CC', (done) => {
        let buildFile = path.join(data, "multi_module_pom.xml");
        buildProps['buildfile'] = buildFile;

        let ccEnabler = new CodeCoverageEnablerFactory().getTool("maven", "cobertura");
        ccEnabler.enableCodeCoverage(buildProps).then(function (resp) {
            let content = fs.readFileSync(buildFile, "utf-8");
            assert.notEqual(content.indexOf(`<include>com/abc.class</include>`), -1, "Include filter must be present");
            assert.notEqual(content.indexOf(`<exclude>com/xyz.class</exclude>`), -1, "Exclude filter must be present");
            assert.notEqual(content.indexOf(`cobertura-maven-plugin`), -1, "Cobertura maven plugin must be enabled");
            done();
        }).catch(function (err) {
            done(err);
        });
    })

    /* Gradle build tool - Code Coverage */
    it('Gradle single module build file with Jacoco CC', (done) => {
        let buildFile = path.join(data, "single_module_build.gradle");
        buildProps['buildfile'] = buildFile;

        let ccEnabler = new CodeCoverageEnablerFactory().getTool("gradle", "jacoco");
        ccEnabler.enableCodeCoverage(buildProps).then(function (resp) {
            let content = fs.readFileSync(buildFile, "utf-8");
            assert.notEqual(content.indexOf(`def jacocoIncludes = ['com/abc.class']`), -1, "Include filter must be present");
            assert.notEqual(content.indexOf(`def jacocoExcludes = ['com/xyz.class']`), -1, "Exclude filter must be present");
            assert.notEqual(content.indexOf(`finalizedBy jacocoTestReport`), -1, "Jacoco report task must be present");
            assert.notEqual(content.indexOf(`apply plugin: 'jacoco'`), -1, "Jacoco gradle plugin must be enabled");
            done();
        }).catch(function (err) {
            done(err);
        });
    })

    it('Gradle multi module build file with Jacoco CC', (done) => {
        let buildFile = path.join(data, "multi_module_build.gradle");
        buildProps['buildfile'] = buildFile;
        buildProps['ismultimodule'] = "true";

        let ccEnabler = new CodeCoverageEnablerFactory().getTool("gradle", "jacoco");
        ccEnabler.enableCodeCoverage(buildProps).then(function (resp) {
            let content = fs.readFileSync(buildFile, "utf-8");
            assert.notEqual(content.indexOf(`def jacocoExcludes = ['com/xyz.class']`), -1, "Include filter must be present");
            assert.notEqual(content.indexOf(`def jacocoIncludes = ['com/abc.class']`), -1, "Exclude filter must be present");
            assert.notEqual(content.indexOf(`jacocoRootReport`), -1, "Jacoco task must be enabled");
            done();
        }).catch(function (err) {
            done(err);
        });
    })

    it('Gradle single module build file with Cobertura CC', (done) => {
        let buildFile = path.join(data, "single_module_build.gradle");
        buildProps['buildfile'] = buildFile;

        let ccEnabler = new CodeCoverageEnablerFactory().getTool("gradle", "cobertura");
        ccEnabler.enableCodeCoverage(buildProps).then(function (resp) {
            let content = fs.readFileSync(buildFile, "utf-8");
            assert.notEqual(content.indexOf(`cobertura.coverageIncludes = ['.*com.abc']`), -1, "Include filter must be present");
            assert.notEqual(content.indexOf(`cobertura.coverageExcludes = ['.*com.xyz']`), -1, "Exclude filter must be present");
            assert.notEqual(content.indexOf(`net.saliman:gradle-cobertura-plugin`), -1, "Cobertura Plugin must be present");
            done();
        }).catch(function (err) {
            done(err);
        });
    })

    it('Gradle multi module build file with Cobertura CC', (done) => {
        let buildFile = path.join(data, "multi_module_build.gradle");
        buildProps['buildfile'] = buildFile;
        buildProps['ismultimodule'] = "true";

        let ccEnabler = new CodeCoverageEnablerFactory().getTool("gradle", "cobertura");
        ccEnabler.enableCodeCoverage(buildProps).then(function (resp) {
            let content = fs.readFileSync(buildFile, "utf-8");
            assert.notEqual(content.indexOf(`cobertura.coverageIncludes = ['.*com.abc']`), -1, "Include filter must be present");
            assert.notEqual(content.indexOf(`cobertura.coverageExcludes = ['.*com.xyz']`), -1, "Exclude filter must be present");
            assert.notEqual(content.indexOf(`net.saliman:gradle-cobertura-plugin`), -1, "Cobertura Plugin must be present");
            done();
        }).catch(function (err) {
            done(err);
        });
    })

    /* Ant build tool - Code Coverage */
    it('Ant build file with Jacoco CC', (done) => {
        let buildFile = path.join(data, "ant_build.xml");
        buildProps['buildfile'] = buildFile;

        let ccEnabler = new CodeCoverageEnablerFactory().getTool("ant", "jacoco");
        ccEnabler.enableCodeCoverage(buildProps).then(function (resp) {
            let content = fs.readFileSync(buildFile, "utf-8");
            assert.notEqual(content.indexOf(`excludes="**/com/xyz.class"`), -1, "Exclude filter must be present");
            assert.notEqual(content.indexOf(`includes="**/com/abc.class"`), -1, "Include filter must be present");
            assert.notEqual(content.indexOf(`jacoco:coverage destfile="jacoco.exec"`), -1, "Jacoco Plugin must be present");
            done();
        }).catch(function (err) {
            done(err);
        });
    })

    it('Ant build file with Cobertura CC', (done) => {
        let buildFile = path.join(data, "ant_build.xml");
        buildProps['buildfile'] = buildFile;

        let ccEnabler = new CodeCoverageEnablerFactory().getTool("ant", "cobertura");
        ccEnabler.enableCodeCoverage(buildProps).then(function (resp) {
            let content = fs.readFileSync(buildFile, "utf-8");
            assert.notEqual(fs.existsSync(path.join(data, buildProps['reportbuildfile'])), true, "Report file must be present");
            assert.notEqual(content.indexOf(`cobertura-classpath`), -1, "Jacoco Plugin must be present");
            done();
        }).catch(function (err) {
            done(err);
        });
    })

});