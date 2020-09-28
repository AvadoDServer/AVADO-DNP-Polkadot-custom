

var supervisord = require('supervisord');
var supervisordclient = supervisord.connect('http://localhost:9001');

module.exports = (server, config) => {


    // get status of a supervisor process
    server.get("/supervisord/status/:name", (req, res, next) => {
        if (req.params.name) {
            supervisordclient.getProcessInfo(req.params.name, function (err, result) {
                if (err) {
                    res.send(500, err);
                    return next();
                }
                res.send(200, result);
                return next();
            });
        } else {
            supervisordclient.getAllProcessInfo(function (err, result) {
                if (err) {
                    res.send(500, err);
                    return next();
                }
                res.send(200, result);
                return next();
            });
        }
    })

    server.get("/supervisord/readstdoutlogs/:name/:offset/:length", (req, res, next) => {
        if (req.params.name && req.params.offset && req.params.length) {

            supervisordclient.readProcessStdoutLog(req.params.name, req.params.offset, req.params.length, function (err, result) {
                if (err) {
                    res.send(500, err);
                    return next();
                }
                res.send(200, result);
                return next();
            });
        } else {
            res.send(400, "missing parameters", req.params);
            return next();
        }
    });

    server.get("/supervisord/start/:name", (req, res, next) => {
        if (req.params.name) {
            supervisordclient.startProcess(req.params.name, function (err, result) {
                if (err) {
                    res.send(500, err);
                    return next();
                }
                res.send(200, result);
                return next();
            });
        } else {
            res.send(400, "no name specified");
            return next();
        }
    })

    server.get("/supervisord/stop/:name", (req, res, next) => {
        if (req.params.name) {
            supervisordclient.stopProcess(req.params.name, function (err, result) {
                if (err) {
                    res.send(500, err);
                    return next();
                }
                res.send(200, result);
                return next();
            });
        } else {
            res.send(400, "no name specified");
            return next();
        }
    })

}
