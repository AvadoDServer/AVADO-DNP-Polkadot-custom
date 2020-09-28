const chokidar = require('chokidar');
const fs = require('fs');
const axios = require('axios');
const path = require("path");
const restify = require("restify");
const corsMiddleware = require("restify-cors-middleware");
const Controller = require('./zerotier-controller');
const Service = require('zerotier-service');
const JSONdb = require('simple-json-db');
const shell = require('shelljs');
const authTokenFilePath = process.argv[2];
const dataDir = process.argv[3];

if (!authTokenFilePath || !dataDir) {
    console.log("please provide");
    console.log("-file location of Zt secret");
    console.log("-a folder to persist data to reload after restart");
    console.log(process.argv);
    process.exit();
}

const databaseFile = path.join(dataDir, 'database.json');
console.log("databaseFile", databaseFile)
const db = new JSONdb(databaseFile);

// init edge case/Library/Application Support/ZeroTier/O
if (!db.has('mode')) {
    console.log("Initialize  DB mode = init")
    db.set("mode", "init");
}

// Get ZT auth token to create & manage networks
const authToken = fs.readFileSync(authTokenFilePath, 'utf8');

// ZT controller manages creating networks & managing members
const controller = new Controller({ authToken });

// ZT service manages network connections
const service = new Service({ authToken });


const config = {
    dataDir: dataDir,
    db: db,
    ztController: controller,
    ztService: service,
};


console.log("Monitor starting...");

const server = restify.createServer({
    name: "MONITOR",
    version: "1.0.0"
});

const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: [
        /^http:\/\/localhost(:[\d]+)?$/,
        "http://*.dappnode.eth:81",
    ]
});

server.pre(cors.preflight);
server.use(cors.actual);

server.use(restify.plugins.bodyParser());


require("./routes-supervisord")(server, config);
require("./routes-db")(server, config);
require("./routes-zt")(server, config);

// receive ping of client
server.get("/ping", async (req, res, next) => {
    if (!req.connection.remoteAddress) {
        res.send(400);
        return next();
    }
    const pingTime = Date.now();
    console.log(`received ping from ${req.connection.remoteAddress} (${pingTime})`);

    db.set(`ping-${req.connection.remoteAddress}`, pingTime);
    res.send(200);
    return next();
});

server.get("/lastseen/:ip", async (req, res, next) => {
    if (!req.params.ip) {
        res.send(400);
        return next();
    }
    const reply = db.get(`ping-${req.params.ip}`);
    res.send(200, reply || "0");
    return next();
});

const nodeinfo = require("./polkadot");

server.get("/nodeinfo", async (req, res, next) => {
    console.log("get node info");
    nodeinfo("ws://my.polkadotcustom.avado.dnp.dappnode.eth:9944/").then((info) => {
        res.send(200, info);
        return next();
    }).catch((e) => {
        res.send(401,"error" +  e);
        return next();
    })
});

server.get("/hostnodeinfo", async (req, res, next) => {
    axios.get(`http://10.191.0.1:82/nodeinfo`).then((r) => {
        res.send(200, r.data);
        return next();
    }).catch((e) => {
        res.send(402, e);
        return next();
    })
});




server.listen(82, function () {
    console.log("%s listening at %s", server.name, server.url);
});

const remoteAddress = "10.191.0.1";

const ping = () => {
    console.log(`ping network host (${remoteAddress})`);
    axios.get(`http://${remoteAddress}:82/ping`, { timeout: 5000 }).then((r) => {
        console.log("ping reply received", r.data);
        db.set(`ping-${remoteAddress}`, Date.now());
        setTimeout(ping, 60 * 1000);
    }).catch((e) => {
        console.log(`ping reply not received (${e.message})`);
        setTimeout(ping, 5 * 1000);
    })
};

ping();