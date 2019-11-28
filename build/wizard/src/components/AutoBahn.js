import autobahn from "autobahn-browser";
import React from "react";

const url = "ws://my.wamp.dnp.dappnode.eth:8080/ws";
const realm = "dappnode_admin";

const Home = () => {




    React.useEffect(() => {
        const connection = new autobahn.Connection({
            url,
            realm
        });

        connection.onopen = session => {
            console.log("CONNECTED to \nurl: " + url + " \nrealm: " + realm);


            session
            .call("listPackages.dappmanager.dnp.dappnode.eth")
            .then(res => {
                res = JSON.parse(res).result.reduce((accum, curr) => {
                    accum[curr.packageName] = curr;
                    return accum;
                }, {});
                console.log(res);
                // debugger;
                // this.setState({ packagesList: res || [] });
            });

        };

        // connection closed, lost or unable to connect
        connection.onclose = (reason, details) => {
            console.error("CONNECTION_CLOSE", { reason, details });
        };

        connection.open();
    }, []);

    return null;

};

export default Home;

