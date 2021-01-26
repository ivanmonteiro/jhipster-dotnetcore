const path = require('path');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');
const fse = require('fs-extra');
const sinon = require('sinon');
const ChildProcess = require('child_process');
const Which = require('which');

const pathToHerokuExecutable = '/path/to/heroku';

const expectedFiles = {
    monolith: ['Procfile'],
};

describe('JHipster Heroku Sub Generator', () => {
    const herokuAppName = 'jhipster-test';
    let stub;
    let stubExecFile;
    let stubExecSync;
    let stubWhich;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        stub = sandbox.stub(ChildProcess, 'exec');
        stub.withArgs('heroku --version').yields(false);
        stub.withArgs('heroku plugins').yields(false, 'heroku-cli-deploy');
        stub.withArgs('git init')
            .yields([false, '', ''])
            .returns({
                stdout: {
                    on: () => {},
                },
            });
        stubExecSync = sandbox.stub(ChildProcess, 'execSync');
        stubExecSync.withArgs('npm init -y').returns(true);
        stubWhich = sandbox.stub(Which, 'sync');
        stubWhich.withArgs('heroku').returns(pathToHerokuExecutable);
        stubExecFile = sandbox.stub(ChildProcess, 'execFile');
        stubExecFile
            .withArgs(pathToHerokuExecutable, ['create', herokuAppName, '--region', 'eu'], { shell: false })
            .yields(false, '', '')
            .returns({
                stdout: {
                    on: () => {},
                },
            });
        stubExecFile
            .withArgs(pathToHerokuExecutable, ['create', herokuAppName, '--region', 'us'], { shell: false })
            .yields(false, '', '')
            .returns({
                stdout: {
                    on: () => {},
                },
            });
    });
    afterEach(() => {
        sandbox.restore();
    });

    describe('monolith application', () => {
        describe('with an unavailable app name', () => {
            const autogeneratedAppName = 'jhipster-new-name';
            beforeEach(done => {
                stubExecFile
                    .withArgs(pathToHerokuExecutable, ['create', herokuAppName, '--region', 'us'], { shell: false })
                    .yields(true, '', `Name ${herokuAppName} is already taken`)
                    .returns({
                        stdout: {
                            on: () => {},
                        },
                    });
                stubExecFile
                    .withArgs(pathToHerokuExecutable, ['create', '--region', 'us'], { shell: false })
                    .yields(false, `https://${autogeneratedAppName}.herokuapp.com`);
                stubExecFile
                    .withArgs(pathToHerokuExecutable, ['git:remote', '--app', autogeneratedAppName], { shell: false })
                    .yields(false, `https://${autogeneratedAppName}.herokuapp.com`);
                stubExecFile
                    .withArgs(
                        pathToHerokuExecutable,
                        ['addons:create', 'jawsdb:kitefin', '--as', 'DATABASE', '--app', autogeneratedAppName],
                        {
                            shell: false,
                        }
                    )
                    .yields(false, '', '');
                helpers
                    .run(require.resolve('../generators/heroku'))
                    .inTmpDir(dir => {
                        fse.copySync(path.join(__dirname, './templates/default'), dir);
                    })
                    .withOptions({ skipBuild: true })
                    .withPrompts({
                        herokuAppName,
                        herokuRegion: 'us',
                        herokuDeployType: 'git',
                        herokuForceName: 'No',
                        useOkta: false,
                    })
                    .on('end', done);
            });
            it('creates expected monolith files', () => {
                assert.file(expectedFiles.monolith);
                assert.fileContent('.yo-rc.json', `"herokuAppName": "${autogeneratedAppName}"`);
                assert.fileContent('.yo-rc.json', '"herokuDeployType": "git"');
            });
        });

        describe('with Git deployment', () => {
            beforeEach(done => {
                stubExecFile
                    .withArgs(
                        pathToHerokuExecutable,
                        ['addons:create', 'jawsdb:kitefin', '--as', 'DATABASE', '--app', this.herokuAppName],
                        {
                            shell: false,
                        }
                    )
                    .yields(false, '', '');
                stub.withArgs('git add .').yields(false, '', '');
                stub.withArgs('git commit -m "Deploy to Heroku" --allow-empty').yields(false, '', '');
                stub.withArgs(`heroku config:set ASPNETCORE_ENVIRONMENT=Production --app ${herokuAppName}`).yields(false, '', '');
                stub.withArgs(
                    `heroku buildpacks:add https://github.com/jincod/dotnetcore-buildpack#v5.0.100 --app ${herokuAppName}`
                ).yields(false, '', '');
                stub.withArgs(`heroku buildpacks:add --index 1 heroku/nodejs --app ${herokuAppName}`).yields(false, '', '');
                stub.withArgs('git push heroku HEAD:master').yields(false, '', '');
                helpers
                    .run(require.resolve('../generators/heroku'))
                    .inTmpDir(dir => {
                        fse.copySync(path.join(__dirname, './templates/default'), dir);
                    })
                    .withPrompts({
                        herokuAppName,
                        herokuRegion: 'us',
                        herokuDeployType: 'git',
                        useOkta: false,
                    })
                    .on('end', done);
            });
            it('creates expected monolith files', () => {
                assert.file(expectedFiles.monolith);
                assert.fileContent('.yo-rc.json', '"herokuDeployType": "git"');
            });
        });

        describe('in the US', () => {
            beforeEach(done => {
                stubExecFile
                    .withArgs(
                        pathToHerokuExecutable,
                        ['addons:create', 'jawsdb:kitefin', '--as', 'DATABASE', '--app', this.herokuAppName],
                        {
                            shell: false,
                        }
                    )
                    .yields(false, '', '');
                helpers
                    .run(require.resolve('../generators/heroku'))
                    .inTmpDir(dir => {
                        fse.copySync(path.join(__dirname, './templates/default/'), dir);
                    })
                    .withOptions({ skipBuild: true })
                    .withPrompts({
                        herokuAppName,
                        herokuRegion: 'us',
                        herokuDeployType: 'git',
                        useOkta: false,
                    })
                    .on('end', done);
            });
            it('creates expected monolith files', () => {
                assert.file(expectedFiles.monolith);
                assert.fileContent('.yo-rc.json', '"herokuDeployType": "git"');
            });
        });

        describe('in the EU', () => {
            beforeEach(done => {
                stubExecFile
                    .withArgs(
                        pathToHerokuExecutable,
                        ['addons:create', 'jawsdb:kitefin', '--as', 'DATABASE', '--app', this.herokuAppName],
                        {
                            shell: false,
                        }
                    )
                    .yields(false, '', '');
                helpers
                    .run(require.resolve('../generators/heroku'))
                    .inTmpDir(dir => {
                        fse.copySync(path.join(__dirname, './templates/default/'), dir);
                    })
                    .withOptions({ skipBuild: true })
                    .withPrompts({
                        herokuAppName,
                        herokuRegion: 'eu',
                        herokuDeployType: 'git',
                        useOkta: false,
                    })
                    .on('end', done);
            });
            it('creates expected monolith files', () => {
                assert.file(expectedFiles.monolith);
            });
        });

        describe('with PostgreSQL', () => {
            beforeEach(done => {
                stubExecFile
                    .withArgs(
                        pathToHerokuExecutable,
                        ['addons:create', 'heroku-postgresql', '--as', 'DATABASE', '--app', this.herokuAppName],
                        {
                            shell: false,
                        }
                    )
                    .yields(false, '', '');
                helpers
                    .run(require.resolve('../generators/heroku'))
                    .inTmpDir(dir => {
                        fse.copySync(path.join(__dirname, './templates/default-psql/'), dir);
                    })
                    .withOptions({ skipBuild: true })
                    .withPrompts({
                        herokuAppName,
                        herokuRegion: 'eu',
                        herokuDeployType: 'git',
                        useOkta: false,
                    })
                    .on('end', done);
            });
            it('creates expected monolith files', () => {
                assert.file(expectedFiles.monolith);
            });
        });

        describe('with Microsoft Sql Server', () => {
            beforeEach(done => {
                stubExecFile
                    .withArgs(pathToHerokuExecutable, ['addons:create', 'mssql:micro', '--as', 'DATABASE', '--app', this.herokuAppName], {
                        shell: false,
                    })
                    .yields(false, '', '');
                helpers
                    .run(require.resolve('../generators/heroku'))
                    .inTmpDir(dir => {
                        fse.copySync(path.join(__dirname, './templates/default-mssql/'), dir);
                    })
                    .withOptions({ skipBuild: true })
                    .withPrompts({
                        herokuAppName,
                        herokuRegion: 'eu',
                        herokuDeployType: 'git',
                        useOkta: false,
                    })
                    .on('end', done);
            });
            it('creates expected monolith files', () => {
                assert.file(expectedFiles.monolith);
            });
        });

        describe('with existing app', () => {
            const existingHerokuAppName = 'jhipster-existing';
            beforeEach(done => {
                stub.withArgs('heroku apps:info --json').yields(false, `{"app":{"name":"${existingHerokuAppName}"}, "dynos":[]}`);
                stubExecFile
                    .withArgs(
                        pathToHerokuExecutable,
                        ['addons:create', 'jawsdb:kitefin', '--as', 'DATABASE', '--app', existingHerokuAppName],
                        {
                            shell: false,
                        }
                    )
                    .yields(false, '', '');
                helpers
                    .run(require.resolve('../generators/heroku'))
                    .inTmpDir(dir => {
                        fse.copySync(path.join(__dirname, './templates/heroku/'), dir);
                    })
                    .withOptions({ skipBuild: true })
                    .on('end', done);
            });
            it('creates expected monolith files', () => {
                assert.file(expectedFiles.monolith);
                assert.fileContent('.yo-rc.json', `"herokuAppName": "${existingHerokuAppName}"`);
            });
        });
    });
});