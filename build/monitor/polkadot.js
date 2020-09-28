const { ApiPromise, WsProvider } = require('@polkadot/api');


const nodeinfo = async (nodeURL) => {
    
    console.log(`Connecting to ${nodeURL}`);
    
    const provider = new WsProvider(nodeURL);
    const api = new ApiPromise({ provider });

    return new Promise((resolve, reject) => {
        api.on("ready", async () => {

            console.log(api.rpc.system);

            console.log("API ready. start query");
            try {
                const [chain, nodeName, nodeVersion, block, peerId] = await Promise.all([
                    api.rpc.system.chain(),
                    api.rpc.system.name(),
                    api.rpc.system.version(),
                    api.rpc.chain.getBlock(),
                    api.rpc.system.localPeerId()
                ]);
                // if (chain.toString() !== "Kusama") {
                //     return reject(new Error(`chain is not Kusama but ${chain.toString()}`));
                // }
                console.log("disconnecting");
                await api.disconnect();
                return resolve({ peerid: peerId.toString(), chain: chain.toString(), nodeName: nodeName.toString(), nodeVersion: nodeVersion.toString(), blockNumber: block.block.header.number.toNumber() || 1 });
            } catch (e) {
                return reject(e);
            }
        });

        api.on("error", async (e) => {
            console.log(`API Error `,e);
            try {
                await api.disconnect();
                return reject("error in polkadot WS connection", e);
            } catch (e) {
                console.log(e.message);
                return reject("error in WS connection");
            }

        });


        api.on("disconnect", () => {
            console.log(`disconnected from ${nodeURL}`);
        });

    })
}

module.exports = nodeinfo;


