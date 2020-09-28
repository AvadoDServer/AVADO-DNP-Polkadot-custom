
module.exports = (server, config) => {

// Generic getter & setter
server.post("/db/set/:name", (req, res, next) => {
    if (!req.params.name || !req.body) {
        res.send(400, "not enough parameters");
        return next();
    }

    config.db.set(req.params.name, req.body.value);
    res.send(200, req.body);
    return next();
});

server.get("/db/get/:name", (req, res, next) => {
    if (!req.params.name) {
        res.send(400, "not enough parameters");
        return next();
    }
    const r = config.db.get(req.params.name);
    res.send(200, r);
    return next();
});

}
