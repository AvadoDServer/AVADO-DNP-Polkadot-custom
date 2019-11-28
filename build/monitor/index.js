const chokidar = require('chokidar');
const fs = require('fs');
const axios = require('axios');
const path = require("path");
const restify = require("restify");
const corsMiddleware = require("restify-cors-middleware");
const Controller = require('./zerotier-controller');
const Service = require('zerotier-service');
const random_name = require('node-random-name');
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

var supervisord = require('supervisord');
var supervisordclient = supervisord.connect('http://localhost:9001');


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

// ************************************************************************
// DB
// ************************************************************************

// Generic getter & setter
server.post("/db/set/:name", (req, res, next) => {
    if (!req.params.name || !req.body) {
        res.send(400, "not enough parameters");
        return next();
    }

    db.set(req.params.name, req.body.value);
    res.send(200, req.body);
    return next();
});

server.get("/db/get/:name", (req, res, next) => {
    if (!req.params.name) {
        res.send(400, "not enough parameters");
        return next();
    }
    const r = db.get(req.params.name);
    res.send(200, r);
    return next();
});

// ************************************************************************
// supervisord
// ************************************************************************

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

// // starts/stops supervisor processes 
// server.get("/supervisor/:command/:name", async (req, res, next) => {
//     if (shell.exec(`supervisorctl ${req.params.command} ${req.params.name}`).code !== 0) {
//         shell.echo('Error: supervisorctl commit failed');
//         res.send(500);
//         return next();
//     } else {
//         res.send(200);
//         return next();
//     }
// });


// ************************************************************************
// ZT network
// ************************************************************************

// returns zerotier controller status & generic info about this client
// - am i in init , client or server mode
// - my network ID
// - ZT status payload
server.get("/network/status", async (req, res, next) => {
    console.log("Get network status");
    setTimeout(async () => {
        console.log("fetch status");
        const status = await controller.status();
        console.log("ok rcvg status", status.data);
        const networkId = db.get("networkid");
        let response = {
            mode: db.get("mode") || "init",
            networkid: networkId,
            status: status ? status.data : undefined,
        };
        res.send(200, response);
        return next();

    }, 0);
});


// // returns ZT network info
// server.get("/network", async (req, res, next) => {

//     console.log(`get network info`);
//     const networkId = db.get("networkid");

//     if (!networkId) {
//         res.send(404);
//         return next();
//     }
//     Promise.all([
//         controller.getNetwork(networkId),
//         // controller.getMembers(networkId)
//     ]).then(([getNetworkReply]) => {
//         console.log("Got info");
//         res.send(200, { network: getNetworkReply.data });
//         return next();
//     }).catch((e) => {
//         res.send(500, e.message);
//         return next();
//     })
// });

// // returns members of this network
// server.get("/network/members", async (req, res, next) => {

//     console.log(`get network info`);
//     const networkId = db.get("networkid");

//     if (!networkId) {
//         return res.send(404);
//     }
//     Promise.all([
//         // controller.getNetwork(networkId),
//         controller.getMembers(networkId)
//     ]).then(([getNetworkMembersReply]) => {
//         console.log("Got info", getNetworkMembersReply.data);
//         res.send(200, getNetworkMembersReply.data);
//         return next();
//     }).catch((e) => {
//         return res.send(500, e.message);
//         return next();
//     })
// });

// add member to this network
server.get("/network/add/:memberid", async (req, res, next) => {
    if (!db.get("networkid")) {
        res.send(404);
        return next();
    }
    if (!req.params.memberid) {
        res.send(400);
        return next();
    }

    try {

        const d1 = parseInt(req.params.memberid, 16) % 0b1111111111111111 >> 8;
        const d2 = parseInt(req.params.memberid, 16) % 0b11111111;

        const ip = `10.191.${d1 === 0 ? 1 : d1}.${d2 === 0 ? 1 : d2}`;

        const addMemberReply = await controller.postMember(db.get("networkid"), req.params.memberid, { authorized: true, ipAssignments: [ip] });
        res.send(200, addMemberReply.data);
        return next();
    } catch (e) {
        res.send(500, e.message);
        return next();
    }
});

server.get("/network/delete/:memberid", async (req, res, next) => {
    if (!db.get("networkid")) {
        res.send(404);
        return next();
    }
    if (!req.params.memberid) {
        res.send(400);
        return next();
    }

    try {
        console.log(`Delete member ${req.params.memberid} from ${db.get("networkid")}`)
        const deleteMemberReply = await controller.deleteMember(db.get("networkid"), req.params.memberid);
        res.send(200, deleteMemberReply.data);
        return next();
    } catch (e) {
        res.send(500, e.message);
        return next();
    }
});


const memberInfo = async (memberid) => {
    try {
        console.log(`Fetch info on member ${memberid} of network ${db.get("networkid")}`)
        const reply = await controller.getMember(db.get("networkid"), memberid);
        if (reply.data) {
            reply.data.name = random_name({ seed: memberid });
            console.log(`Setting node name to ${reply.data.name}`);

            const ip = reply.data.ipAssignments && reply.data.ipAssignments[0] ? reply.data.ipAssignments[0] : "";
            console.log(`the ip of client is ${ip}`);
            const lastPing = db.get(`ping-${ip}`) || db.get(`ping-::ffff:${ip}`);
            console.log(`last ping of client is ${lastPing}`);
            reply.data.lastping = lastPing ? Date.now() - lastPing : null;


        }
        return reply.data;
    } catch (e) {
        console.log("error", e);
        return;
    }
}


server.get("/network/overview", async (req, res, next) => {

    if (!db.get("networkid")) {
        res.send(400);
        return next();
    }

    const members = await controller.getMembers(db.get("networkid"));
    if (!members || !members.data) {
        console.log("No members found in this network.");
        res.send(200);
        return next();
    }

    console.log("Members=", members.data);

    const mi = Object.keys(members.data).map(async (member) => {
        console.log("fetching info on member", member);
        const m = await memberInfo(member);
        return m;
    });

    Promise.all(mi).then((mir) => {

        console.log("mi=", mir);

        res.send(200, mir);
        return next();

    })


});


server.get("/network/memberinfo/:memberid", async (req, res, next) => {
    if (!db.get("networkid")) {
        res.send(404);
        return next();
    }

    if (!req.params.memberid) {
        res.send(400);
        return next();
    }

    const reply = await memberInfo(req.params.memberid);
    if (reply) {
        res.send(200, reply.data);
        return next();
    } else {
        res.send(500, "no reply received");
        return next();
    }

});

server.get("/createnetwork", async (req, res, next) => {
    if (!db.get("networkid")) {
        const getStatusReply = await controller.status();
        const createNetworkReply = await controller.createNetwork(getStatusReply.data.address, {
            name: "AVADO POLKA-" + Math.floor(Math.random() * 10000000 + 1000000),
            v4AssignMode: {
                "zt": true
            },
            ipAssignmentPools: [
                {
                    "ipRangeStart": "10.191.0.100",
                    "ipRangeEnd": "10.191.255.254"
                }],
            routes: [
                {
                    "target": "10.191.0.0/16"
                }
            ],
            rules: [
                {
                    "type": "ACTION_ACCEPT"
                }
            ],
        });

        if (createNetworkReply && createNetworkReply.data && createNetworkReply.data.id) {
            const newNetworkId = createNetworkReply.data.id;
            console.log(`created a new network. ID=${newNetworkId}`);

            console.log(`adding myself ${getStatusReply.data.address} to ${newNetworkId}`);
            const addMemberRes = await controller.postMember(createNetworkReply.data.id, getStatusReply.data.address, { authorized: true, ipAssignments: ["10.191.0.1"] });
            console.log(`Added myself to ${newNetworkId} res=${addMemberRes.status}`);
            console.log(`Joining network ${newNetworkId}`);
            const joinRes = service.join(newNetworkId);
            console.log(`Join ${newNetworkId} res=`, joinRes);

            res.send(200, { networkid: newNetworkId });

            db.set("networkid", newNetworkId);
            db.set("mode", "server");
            console.log("NEXT!")
            return next();
        }
    } else {
        res.send(403);
        return next();
    }
});

server.get("/deletenetwork", async (req, res, next) => {
    const networkId = db.get("networkid");
    console.log(`Delete network ${networkId}`);
    if (!networkId) {
        res.send(404);
        return next();
    }
    try {
        const reply = await controller.deleteNetwork(networkId);
        console.log(reply);
        db.delete("networkid");
        db.set("mode", "init");
        res.send(200, reply.data);
        return next();
    } catch (e) {
        res.send(e.message);
        return next();
    }
});

// join network as a client
server.get("/network/join/:networkid", async (req, res, next) => {

    if (!req.params.networkid) {
        res.send(400);
        return next();
    }

    try {
        const reply = await service.join(req.params.networkid);
        db.set("networkid", req.params.networkid);
        db.set("mode", "client");
        res.send(200, reply.data);
        return next();
    } catch (e) {
        res.send(500, e.message);
        return next();
    }
});


// leave network as a client
server.get("/network/leave/:networkid", async (req, res, next) => {


    if (!req.params.networkid) {
        res.send(400);
        return next();
    }

    console.log(`leave network ${req.params.networkid}`)


    try {
        const reply = await service.leave(req.params.networkid);
        db.set("networkid", null);
        db.set("mode", "init");
        res.send(200, reply.data);
        return next();
    } catch (e) {
        res.send(500, e.message);
        return next();
    }
});


// which networks am I part of ?
server.get("/network/membership", async (req, res, next) => {
    service.networks(function (err, res2, body) {
        if (err) {
            console.error(err.message)
            res.send(500, err.message);
            return next();
        }
        else {
            console.log("/service/status", body);
            res.send(200, body);
            return next();
        }
    })
});


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