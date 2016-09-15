import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'vsts-task-lib/mock-test';

describe('Sample task tests', function () {
    before(() => {
    });

    after(() => {
    });

    it('should succeed with simple inputs', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'singlesln.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.Run();
        assert(tr.succeeded, 'should have succeeded');
        assert.equal(tr.invokedToolCount, 2);
        assert.equal(tr.errorIssues.length, 0, "should have no errors");
        assert(tr.stdout.indexOf('NuGet output here') >= 0, "should have run nuget");

        done();
    });
});