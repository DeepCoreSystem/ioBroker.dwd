var expect = require('chai').expect;
var setup  = require(__dirname + '/lib/setup');

var objects = null;
var states  = null;
var onStateChanged = null;
var onObjectChanged = null;

function checkConnectionOfAdapter(cb, counter) {
    counter = counter || 0;
    if (counter > 20) {
        cb && cb('Cannot check connection');
        return;
    }

    states.getState('system.adapter.dwd.0.alive', function (err, state) {
        if (err) console.error(err);
        if (state && state.val) {
            cb && cb();
        } else {
            setTimeout(function () {
                checkConnectionOfAdapter(cb, counter + 1);
            }, 1000);
        }
    });
}

function checkValueOfState(id, value, cb, counter) {
    counter = counter || 0;
    if (counter > 20) {
        cb && cb('Cannot check value Of State ' + id);
        return;
    }

    states.getState(id, function (err, state) {
        if (err) console.error(err);
        if (value === null && !state) {
            cb && cb();
        } else
        if (state && (value === undefined || state.val === value)) {
            cb && cb();
        } else {
            setTimeout(function () {
                checkValueOfState(id, value, cb, counter + 1);
            }, 500);
        }
    });
}

describe('Test DWD', function() {
    before('Test DWD: Start js-controller', function (_done) {
        this.timeout(600000); // because of first install from npm

        setup.setupController(function () {
            var config = setup.getAdapterConfig();
            // enable adapter
            config.common.enabled  = true;
            config.common.loglevel = 'debug';

            config.native.warnings = "3";
            config.native.region   = "Kreis Ravensburg";

            setup.setAdapterConfig(config.common, config.native);

            setup.startController(true, function (id, obj) {
                    if (onObjectChanged) onObjectChanged(id, obj);
                }, function (id, state) {
                    if (onStateChanged) onStateChanged(id, state);
            },
            function (_objects, _states) {
                objects = _objects;
                states  = _states;
                states.subscribe('*');
                objects.subscribe('*');
                _done();
            });
        });
    });

    it('Test DWD: Check if adapter started', function (done) {
        this.timeout(5000);
        checkConnectionOfAdapter(done);
    });

    it('Test DWD: check creation of state', function (done) {
        this.timeout(2000);
        // add script
        var script = {
            "common": {
                "name":         "check creation of state",
                "engineType":   "Javascript/js",
                "source":       "createState('test1', 5);",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.check_creation_of_state",
            "native": {}
        };
        onStateChanged = function (id, state) {
            if (id === 'javascript.0.test1' && state.val === 5) {
                onStateChanged = null;
                states.getState('javascript.0.test1', function (err, state) {
                    expect(err).to.be.not.ok;
                    expect(state.val).to.be.equal(5);
                    objects.getObject('javascript.0.test1', function (err, obj) {
                        expect(err).to.be.not.ok;
                        expect(obj).to.be.ok;
                        done();
                    });
                });
            }
        };
        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;
        });
    });
    /*
    it('Test DWD: check deletion of state', function (done) {
        this.timeout(2000);
        // add script
        var script = {
            "common": {
                "name":         "check deletion of state",
                "engineType":   "Javascript/js",
                "source":       "deleteState('test1');",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.check_deletion_of_state",
            "native": {}
        };

        objects.getObject('javascript.0.test1', function (err, obj) {
            expect(err).to.be.not.ok;
            expect(obj).to.be.ok;
            states.getState('javascript.0.test1', function (err, state) {
                expect(err).to.be.not.ok;
                expect(state).to.be.ok;
                expect(state.val).to.be.equal(5);

                onStateChanged = function (id, state) {
                    if (id === 'javascript.0.test1' && state === null) {
                        onStateChanged = null;
                        states.getState('javascript.0.test1', function (err, state) {
                            expect(err).to.be.not.ok;
                            expect(state).to.be.equal(undefined);
                            objects.getObject('javascript.0.test1', function (err, obj) {
                                expect(err).to.be.not.ok;
                                expect(obj).to.be.not.ok;
                                done();
                            });
                        });
                    }
                };

                objects.setObject(script._id, script, function (err) {
                    expect(err).to.be.not.ok;
                });
            });
        });
    });

    it('Test DWD: open objects.json file must not work', function (done) {
        this.timeout(20000);
        // add script
        var script = {
            "common": {
                "name":         "open objects",
                "engineType":   "Javascript/js",
                "source":       "var fs=require('fs'); try{fs.readFileSync('" + __dirname + "/../tmp/" + setup.appName + "-data/objects.json');}catch(err){createState('error', err.toString());}",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.open_objects",
            "native": {}
        };

        onStateChanged = function (id, state) {
            if (id === 'javascript.0.error' && state.val === 'Error: Permission denied') {
                onStateChanged = null;
                done();
            }
        };

        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;
        });
    });

    it('Test DWD: write objects.json file must not work', function (done) {
        this.timeout(2000);
        // add script
        var script = {
            "common": {
                "name":         "open objects",
                "engineType":   "Javascript/js",
                "source":       "var fs=require('fs'); try{fs.writeFileSync('" + __dirname + "/../tmp/" + setup.appName + "-data/objects.json', '');}catch(err){createState('error1', err.toString());}",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.open_objects",
            "native": {}
        };
        onStateChanged = function (id, state) {
            if (id === 'javascript.0.error1' && state.val === 'Error: Permission denied') {
                onStateChanged = null;
                done();
            }
        };
        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;
        });
    });

    it('Test DWD: write objects.json not in data directory must work', function (done) {
        this.timeout(2000);
        var time = new Date().toString();
        var fs = require('fs');

        if (fs.existsSync(__dirname + "/../tmp/objects.json")) fs.unlinkSync(__dirname + "/../tmp/objects.json");

        // add script
        var script = {
            "common": {
                "name":         "open objects",
                "engineType":   "Javascript/js",
                "source":       "var fs=require('fs'); try{fs.writeFileSync('" + __dirname.replace(/\\/g, "/") + "/../tmp/objects.json', '" + time + "');}catch(err){createState('error3', err.toString());}",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.open_objects",
            "native": {}
        };

        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;
            setTimeout(function () {
                if (!fs.existsSync(__dirname + '/../tmp/objects.json')) {
                    setTimeout(function () {
                        expect(fs.readFileSync(__dirname + "/../tmp/objects.json").toString()).to.be.equal(time);
                        fs.unlinkSync(__dirname + "/../tmp/objects.json");
                        done();
                    }, 500);
                } else {
                    expect(fs.readFileSync(__dirname + "/../tmp/objects.json").toString()).to.be.equal(time);
                    fs.unlinkSync(__dirname + "/../tmp/objects.json");
                    done();
                }
            }, 500);
        });
    });

    it('Test DWD: test getAstroDate', function (done) {
        this.timeout(3000);
        var types = [
            "sunrise",
            "sunriseEnd",
            "goldenHourEnd",
            "solarNoon",
            "goldenHour",
            "sunsetStart",
            "sunset",
            "dusk",
            "nauticalDusk",
            "night",
            "nightEnd",
            "nauticalDawn",
            "dawn",
            "nadir"
        ];
        // add script
        var script = {
            "common": {
                "name":         "getAstroDate",
                "engineType":   "Javascript/js",
                "source":       "",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.getAstroDate",
            "native": {}
        };
        for (var t = 0; t < types.length; t++) {
            script.common.source += "createState('" + types[t] + "', getAstroDate('" + types[t] + "') ? getAstroDate('" + types[t] + "').toString() : '');"
        }

        var responses = 0;
        onStateChanged = function (id, state) {
            if (types.indexOf(id.substring('javascript.0.'.length)) !== -1) {
                responses++;
                if (responses === types.length) {
                    onStateChanged = null;

                    var count = types.length;
                    for (var t = 0; t < types.length; t++) {
                        states.getState('javascript.0.' + types[t], function (err, state) {
                            expect(err).to.be.not.ok;
                            expect(state).to.be.ok;
                            expect(state.val).to.be.ok;
                            console.log(types[types.length - count] + ': ' + state.val);
                            if (!--count) done();
                        });
                    }
                }
            }
        };

        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;
        });
    });

    it('Test DWD: test setStateDelayed simple', function (done) {
        this.timeout(5000);
        // add script
        var script = {
            "common": {
                "name":         "setStateDelayed",
                "engineType":   "Javascript/js",
                "source":       "createState('delayed', 4, function () {setStateDelayed('delayed', 5, 1000);});",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.setStateDelayed",
            "native": {}
        };

        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;
            checkValueOfState('javascript.0.delayed', 4, function (err) {
                expect(err).to.be.not.ok;
                states.getState('javascript.0.delayed', function (err, stateStart) {
                    expect(err).to.be.not.ok;
                    checkValueOfState('javascript.0.delayed', 5, function (err) {
                        expect(err).to.be.not.ok;
                        states.getState('javascript.0.delayed', function (err, stateStop) {
                            expect(err).to.be.not.ok;
                            expect(stateStop.ts - stateStart.ts).to.be.equal(1);
                            done();
                        });
                    });
                });
            });
        });
    });

    it('Test DWD: test setStateDelayed nested', function (done) {
        this.timeout(5000);
        // add script
        var script = {
            "common": {
                "name":         "setStateDelayed",
                "engineType":   "Javascript/js",
                "source":       "setStateDelayed('delayed', 6, 500); setStateDelayed('delayed', 7, 1500, false);",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.setStateDelayed",
            "native": {}
        };

        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;
            checkValueOfState('javascript.0.delayed', 6, function (err) {
                expect(err).to.be.not.ok;
                states.getState('javascript.0.delayed', function (err, stateStart) {
                    expect(err).to.be.not.ok;
                    checkValueOfState('javascript.0.delayed', 7, function (err) {
                        expect(err).to.be.not.ok;
                        states.getState('javascript.0.delayed', function (err, stateStop) {
                            expect(err).to.be.not.ok;
                            expect(stateStop.ts - stateStart.ts).to.be.equal(1);
                            done();
                        });
                    });
                });
            });
        });
    });

    it('Test DWD: test setStateDelayed overwritten', function (done) {
        this.timeout(5000);
        // add script
        var script = {
            "common": {
                "name":         "setStateDelayed",
                "engineType":   "Javascript/js",
                "source":       "setStateDelayed('delayed', 8, 500); setStateDelayed('delayed', 9, 1500);",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.setStateDelayed",
            "native": {}
        };

        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;
            checkValueOfState('javascript.0.delayed', 8, function (err) {
                expect(err).to.be.ok;

                states.getState('javascript.0.delayed', function (err, stateStart) {
                    expect(err).to.be.not.ok;
                    expect(stateStart.val).to.be.not.equal(8);

                    checkValueOfState('javascript.0.delayed', 9, function (err) {
                        expect(err).to.be.not.ok;
                        states.getState('javascript.0.delayed', function (err, stateStop) {
                            expect(err).to.be.not.ok;
                            done();
                        });
                    });
                });
            }, 18);
        });
    });

    it('Test DWD: test setStateDelayed canceled', function (done) {
        this.timeout(5000);
        // add script
        var script = {
            "common": {
                "name":         "setStateDelayed",
                "engineType":   "Javascript/js",
                "source":       "setStateDelayed('delayed', 10, 500); clearStateDelayed('delayed');",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.setStateDelayed",
            "native": {}
        };

        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;

            checkValueOfState('javascript.0.delayed', 10, function (err) {
                expect(err).to.be.ok;

                states.getState('javascript.0.delayed', function (err, stateStart) {
                    expect(err).to.be.not.ok;
                    expect(stateStart.val).to.be.not.equal(10);
                    done();
                });
            }, 18);
        });
    });

    it('Test DWD: test global scripts New', function (done) {
        this.timeout(5000);
        // add script
        var script = {
            "common": {
                "name":         "new script non global",
                "engineType":   "Javascript/js",
                "source":       "setTestState(16);",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.TestGlobalNew.Script",
            "native": {}
        };
        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;
            checkValueOfState('javascript.0.testGlobal', 16, function (err) {
                expect(err).to.be.not.ok;

                states.getState('javascript.0.testGlobal', function (err, state) {
                    expect(err).to.be.not.ok;
                    expect(state).to.be.ok;
                    expect(state.val).to.be.equal(16);
                    done();
                });
            }, 18);
        });
    });

    it('Test DWD: test global scripts Old', function (done) {
        this.timeout(5000);
        // add script
         var script = {
            "common": {
                "name":         "Old script non global",
                "engineType":   "Javascript/js",
                "source":       "setTestStateOld(17);",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.TestGlobalOld.Script",
            "native": {}
        };
        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;
            checkValueOfState('javascript.0.testGlobalOld', 17, function (err) {
                expect(err).to.be.not.ok;

                states.getState('javascript.0.testGlobalOld', function (err, state) {
                    expect(err).to.be.not.ok;
                    expect(state).to.be.ok;
                    expect(state.val).to.be.equal(17);
                    done();
                });
            }, 18);
        });
    });

    it('Test DWD: test ON default', function (done) {
        this.timeout(5000);
        // add script
        var script = {
            "common": {
                "name":         "test ON default",
                "engineType":   "Javascript/js",
                "source":       "createState('testResponse', false);createState('testVar', 0, function () {on('testVar', function (obj) {setState('testResponse', obj.state.val, true);});});",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.test_ON_default",
            "native": {}
        };

        onStateChanged = function (id, state) {
            if (id === 'javascript.0.testVar' && state.val === 0) {
                states.setState('javascript.0.testVar', 6, function (err) {
                    expect(err).to.be.not.ok;
                });
            }
            if (id === 'javascript.0.testResponse' && state.val === 6) {
                onStateChanged = null;
                done();
            }
        };

        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;
        });
    });

    it('Test DWD: test ON any', function (done) {
        this.timeout(5000);
        // add script
        var script = {
            "common": {
                "name":         "test ON any",
                "engineType":   "Javascript/js",
                "source":       "createState('testResponse1', false);createState('testVar1', 1, function () {on({id:'testVar1', change:'any'}, function (obj) {setState('testResponse1', obj.state.val, true);});});",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.test_ON_any",
            "native": {}
        };

        onStateChanged = function (id, state) {
            if (id === 'javascript.0.testVar1' && state.val === 1) {
                setTimeout(function () {
                    states.setState('javascript.0.testVar1', 1, function (err) {
                        expect(err).to.be.not.ok;
                    });
                }, 1000);
            }
            if (id === 'javascript.0.testResponse1' && state.val === 1) {
                onStateChanged = null;
                done();
            }
        };

        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;
        });
    });

    it('Test DWD: test schedule for seconds', function (done) {
        this.timeout(4000);
        var d = new Date();

        console.log('Must wait 2 seconds[' + ((d.getSeconds() + 2) % 60) + ' * * * * *]' + d.toISOString());
        // add script
        var script = {
            "common": {
                "name":         "test ON any",
                "engineType":   "Javascript/js",
                "source":       "createState('testScheduleResponse', false);schedule('" + ((d.getSeconds() + 2) % 60) + " * * * * *', function (obj) {setState('testScheduleResponse', true, true);});",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.test_ON_any",
            "native": {}
        };

        onStateChanged = function (id, state) {
            if (id === 'javascript.0.testScheduleResponse' && state.val === true) {
                onStateChanged = null;
                done();
            }
        };

        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;
        });
    });

    it('Test DWD: test schedule for minutes', function (done) {
        var d = new Date();
        console.log('Must wait ' + (60 - d.getSeconds()) + ' seconds[' + ((d.getMinutes() + 1) % 60) + ' * * * *] ' + d.toISOString());
        this.timeout((64 - d.getSeconds()) * 1000);

        // add script
        var script = {
            "common": {
                "name":         "test ON any",
                "engineType":   "Javascript/js",
                "source":       "createState('testScheduleResponse1', false);schedule('" + ((d.getMinutes() + 1) % 60) + " * * * *', function (obj) {setState('testScheduleResponse1', true, true);});",
                "enabled":      true,
                "engine":       "system.adapter.javascript.0"
            },
            "type":             "script",
            "_id":              "script.js.test_ON_any",
            "native": {}
        };

        onStateChanged = function (id, state) {
            if (id === 'javascript.0.testScheduleResponse1' && state.val === true) {
                onStateChanged = null;
                done();
            }
        };

        objects.setObject(script._id, script, function (err) {
            expect(err).to.be.not.ok;
        });
    });*/

    after('Test DWD: Stop js-controller', function (done) {
        this.timeout(6000);

        setup.stopController(function (normalTerminated) {
            console.log('Adapter normal terminated: ' + normalTerminated);
            done();
        });
    });
});