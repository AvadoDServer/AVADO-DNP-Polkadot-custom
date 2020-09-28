const random_name = require('node-random-name');

module.exports = (server, config) => {

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
            const status = await config.ztController.status();
            console.log("ok rcvg status", status.data);
            const networkId = config.db.get("networkid");
            const discoveryNetworkId = config.db.get("discoverynetworkid");
            let response = {
                mode: config.db.get("mode") || "init",
                networkid: networkId,
                discoverynetworkid: discoveryNetworkId,
                status: status ? status.data : undefined,
            };
            res.send(200, response);
            return next();

        }, 0);
    });


    // add member to this network
    server.get("/network/add/:memberid", async (req, res, next) => {
        if (!config.db.get("networkid")) {
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

            const addMemberReply = await config.ztController.postMember(config.db.get("networkid"), req.params.memberid, { authorized: true, ipAssignments: [ip] });
            res.send(200, addMemberReply.data);
            return next();
        } catch (e) {
            res.send(500, e.message);
            return next();
        }
    });

    server.get("/network/delete/:memberid", async (req, res, next) => {
        if (!config.db.get("networkid")) {
            res.send(404);
            return next();
        }
        if (!req.params.memberid) {
            res.send(400);
            return next();
        }

        try {
            console.log(`Delete member ${req.params.memberid} from ${config.db.get("networkid")}`)
            const deleteMemberReply = await config.ztController.deleteMember(config.db.get("networkid"), req.params.memberid);
            res.send(200, deleteMemberReply.data);
            return next();
        } catch (e) {
            res.send(500, e.message);
            return next();
        }
    });


    const memberInfo = async (memberid) => {
        try {
            console.log(`Fetch info on member ${memberid} of network ${config.db.get("networkid")}`)
            const reply = await config.ztController.getMember(config.db.get("networkid"), memberid);
            if (reply.data) {
                reply.data.name = random_name({ seed: memberid });
                console.log(`Setting node name to ${reply.data.name}`);

                const ip = reply.data.ipAssignments && reply.data.ipAssignments[0] ? reply.data.ipAssignments[0] : "";
                console.log(`the ip of client is ${ip}`);
                const lastPing = config.db.get(`ping-${ip}`) || config.db.get(`ping-::ffff:${ip}`);
                console.log(`last ping of client is ${lastPing}`);
                reply.data.lastping = lastPing ? Date.now() - lastPing : null;


            }
            return reply.data;
        } catch (e) {
            console.log("error", e);
            return;
        }
    }

    // // join through the discovery network
    // server.get("/clientjoin/:address",  async (req, res, next) => {


    // });

    server.get("/network/overview", async (req, res, next) => {

        if (!config.db.get("networkid")) {
            res.send(400);
            return next();
        }

        const members = await config.ztController.getMembers(config.db.get("networkid"));
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
        if (!config.db.get("networkid")) {
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

    const getZtAddress = async () => {
        const getStatusReply = await config.ztController.status();
        return getStatusReply.data.address;
    }


    server.get("/createnetwork", async (req, res, next) => {
        if (!config.db.get("networkid")) {
            const myZtAddress = await getZtAddress();
            const mainNetworkName = "AVADO POLKA-" + Math.floor(Math.random() * 10000000 + 1000000);
            console.log(`Creating main network ${mainNetworkName}`);
            const mainNetwork = await config.ztController.createNetwork(
                myZtAddress,
                {
                    name: mainNetworkName,
                    v4AssignMode: {
                        "zt": true
                    },
                    private: true,
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
            console.log(`Creating discovery network`);
            const discoveryNetwork = await config.ztController.createNetwork(
                myZtAddress,
                {
                    name: "discovery",
                    v4AssignMode: {
                        "zt": true
                    },
                    private: false,
                    ipAssignmentPools: [
                        {
                            "ipRangeStart": "10.192.0.100",
                            "ipRangeEnd": "10.192.255.254"
                        }],
                    routes: [
                        {
                            "target": "10.192.0.0/16"
                        }
                    ],
                    rules: [
                        {
                            "type": "ACTION_ACCEPT"
                        }
                    ],
                });
            console.log(`created discovery network`);

            if (
                mainNetwork && mainNetwork.data && mainNetwork.data.id &&
                discoveryNetwork && discoveryNetwork.data && discoveryNetwork.data.id
            ) {
                const mainNetworkId = mainNetwork.data.id;
                console.log(`created a new main network. ID=${mainNetworkId}`);
                console.log(`adding myself ${myZtAddress} to ${mainNetworkId}`);
                const addMemberRes = await config.ztController.postMember(
                    mainNetwork.data.id,
                    myZtAddress,
                    {
                        authorized: true,
                        ipAssignments: ["10.191.0.1"]
                    }
                );
                console.log(`Added myself to ${mainNetworkId} res=${addMemberRes.status}`);
                console.log(`Joining network ${mainNetworkId}`);
                const joinRes = await config.ztService.join(mainNetworkId);
                // console.log(`Join ${mainNetworkId} res=`, joinRes);

                const discoveryNetworkId = discoveryNetwork.data.id;
                console.log(`created a new discovery network. ID=${discoveryNetworkId}`);
                console.log(`adding myself ${myZtAddress} to ${discoveryNetworkId}`);
                const discoveryAddMemberRes = await config.ztController.postMember(
                    discoveryNetwork.data.id,
                    myZtAddress,
                    {
                        authorized: true,
                        ipAssignments: ["10.192.0.1"]
                    }
                );
                console.log(`Added myself to ${discoveryNetworkId} res=${discoveryAddMemberRes.status}`);
                console.log(`Joining network ${discoveryNetworkId}`);
                const discoveryJoinRes = await config.ztService.join(discoveryNetworkId);
                // console.log(`Join ${discoveryNetworkId} res=`, discoveryJoinRes);

                config.db.set("networkid", mainNetworkId);
                config.db.set("discoverynetworkid", discoveryNetworkId);

                // this should be done higher up ?
                config.db.set("mode", "server");

                res.send(200, {
                    networkid: mainNetworkId,
                    discoverynetworkid: discoveryNetworkId
                });
                return next();
            }
        } else {
            console.log(`problem on network creation`);
            res.send(403);
            return next();
        }
    });

    server.get("/deletenetwork", async (req, res, next) => {
        const networkId = config.db.get("networkid");
        console.log(`Delete network ${networkId}`);
        if (!networkId) {
            res.send(404);
            return next();
        }
        try {
            const reply = await config.ztController.deleteNetwork(networkId);
            console.log(reply);
            config.db.delete("networkid");
            config.db.set("mode", "init");
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
            const reply = await config.ztService.join(req.params.networkid);
            config.db.set("networkid", req.params.networkid);
            config.db.set("mode", "client");
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
            const reply = await config.ztService.leave(req.params.networkid);
            config.db.set("networkid", null);
            config.db.set("mode", "init");
            res.send(200, reply.data);
            return next();
        } catch (e) {
            res.send(500, e.message);
            return next();
        }
    });


    // which networks am I part of ?
    server.get("/network/membership", async (req, res, next) => {
        config.ztService.networks(function (err, res2, body) {
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

}
