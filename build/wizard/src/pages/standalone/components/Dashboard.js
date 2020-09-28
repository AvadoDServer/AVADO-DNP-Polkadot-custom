import React from "react";
import classNames from "classnames";
import axios from "axios";
import spinner from "../../../assets/spinner.svg";
import "./Dashboard.css";
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css
import ServiceToggle from "../../../components/ServiceToggle";
import { confirmAlert } from 'react-confirm-alert'; // Import

const monitorAPI = process.env["ENDPOINT"] || "http://my.polkadotcustom.avado.dnp.dappnode.eth:82";
//const monitorAPI = "http://localhost:82";


const Comp = () => {
    const [showSpinner, setShowSpinner] = React.useState(true);
    // const [appState, setAppState] = React.useState();
    // const [networkId, setNetworkId] = React.useState();
    // const [currentConfig, setCurrentConfig] = React.useState(undefined);
    const [status, setStatus] = React.useState();

    React.useEffect(() => {
        getStatus().then(() => { setShowSpinner(false) });
    }, []);

    const waitUntilTrue = (conditionPromise, args) => {
        return new Promise((resolve, reject) => {
            conditionPromise(args).then((boolResult) => {
                if (boolResult) {
                    return resolve(boolResult);
                } else {
                    setTimeout(() => {
                        conditionPromise(args).then((r) => { resolve(r) });
                    }, 2000);
                }
            }).catch((e) => {
                setTimeout(() => {
                    conditionPromise(args).then((r) => { resolve(r) });
                }, 2000);
            });
        });
    }

    const getStatus = () => {
        const p = () => {
            return new Promise((resolve, reject) => {
                console.log("Polling status from container");
                return resolve(true);
                // axios.get(`${monitorAPI}/network/status`, { timeout: 5000 })
                //     .then((res) => {
                //         if (res && res.data) {
                //             getClientStatus().then((networks) => {
                //                 const currentC = { ...currentConfig, ...res.data, networks: networks };
                //                 setCurrentConfig(currentC);
                //                 console.log(currentC);
                //                 return resolve(true);
                //             });
                //         } else {
                //             reject(new Error("No result from container"));
                //         }
                //     }).catch((e) => {
                //         return reject();
                //     });
            });
        };
        return waitUntilTrue(p);
    };

    // // which networks am I part of ?
    // const getClientStatus = () => {
    //     const p = () => {
    //         return new Promise((resolve, reject) => {
    //             console.log("Polling client status from container");
    //             axios.get(`${monitorAPI}/network/membership`, { timeout: 5000 })
    //                 .then((res) => {
    //                     if (res && res.data) {
    //                         return resolve(res.data);
    //                     }
    //                     return reject();
    //                 }).catch((e) => {
    //                     return reject();
    //                 });
    //         });
    //     };
    //     return waitUntilTrue(p);
    // };

    // const joinNetwork = (id) => {
    //     return new Promise((resolve, reject) => {
    //         axios.get(`${monitorAPI}/network/join/${id}`, { timeout: 5000 })
    //             .then((res) => {
    //                 getStatus();
    //             }).catch((e) => {
    //                 return reject();
    //             });
    //     });
    // }

    // const leaveNetwork = (id) => {

    //     confirmAlert({
    //         customUI: ({ onClose }) => {
    //             return (
    //                 <div className="modal is-active">
    //                     <div className="modal-background"></div>
    //                     <div className="modal-card">
    //                         <header className="modal-card-head">
    //                             <p className="modal-card-title">Leave network</p>
    //                             <button className="delete" onClick={onClose} aria-label="close"></button>
    //                         </header>
    //                         <section className="modal-card-body">
    //                             Are you sure you want to leave this network ? It will remove all connections to the host network.
    //                         </section>
    //                         <footer className="modal-card-foot">
    //                             <button className="button is-success" onClick={() => {
    //                                 axios.get(`${monitorAPI}/network/leave/${id}`, { timeout: 5000 })
    //                                     .then((res) => {
    //                                         getStatus();
    //                                     }).catch((e) => {
    //                                         // return reject();
    //                                         console.log("Error leaving network:", e.message);
    //                                     });
    //                                 onClose();
    //                             }}
    //                             >Yes</button>
    //                             <button onClick={onClose} className="button">No</button>
    //                         </footer>
    //                     </div>
    //                 </div>
    //             );
    //         }
    //     });




    //     // return new Promise((resolve, reject) => {
    //     //     axios.get(`${monitorAPI}/service/leave/${id}`, { timeout: 5000 })
    //     //         .then((res) => {
    //     //             getStatus();
    //     //         }).catch((e) => {
    //     //             return reject();
    //     //         });
    //     // });
    // }

    const toggleService = (command, serviceName) => {
        return new Promise((resolve, reject) => {
            axios.get(`${monitorAPI}/supervisor/${command}/${serviceName}`, { timeout: 5000 })
                .then((res) => {
                    getStatus();
                }).catch((e) => {
                    return reject();
                });
        });
    }

    // Checkbox input
    const Checkbox = ({
        field: { name, value, onChange, onBlur },
        form: { errors, touched, setFieldValue },
        id,
        label,
        className,
        ...props
    }) => {
        return (
            <div>
                <input
                    name={name}
                    id={id}
                    type="checkbox"
                    value={value}
                    checked={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    className={classNames("radio-button", className)}
                />
                <label htmlFor={id}>{label}</label>
                {/* {touched[name] && <InputFeedback error={errors[name]} />} */}
            </div>
        );
    };

    if (showSpinner) {
        return (
            <section className="is-medium has-text-white">
                <div className="">
                    <div className="container">
                        <div className="columns is-mobile">
                            <div className="column is-8-desktop is-10 is-offset-1  has-text-centered">
                                <p className="is-size-5 has-text-weight-bold">Loading</p>
                                <div className="spacer"></div>
                                <img alt="spinner" src={spinner} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // const networks = currentConfig.networks && currentConfig.networks.map((network) => {
    //     const ips = network.assignedAddresses.reduce((accum, address) => { return `${accum} ${address.split('/')[0]}` }, "");
    //     return (
    //         <>
    //             <div>You are now connected to network {network.name} ({network.id})</div>
    //             {ips && (
    //                 <div>Your IP on this network is {ips}</div>
    //             )}
    //             <button onClick={() => { leaveNetwork(network.id) }} className="button is-medium is-success">Leave this network</button>
    //         </>
    //     );
    // })

    // if ((!currentConfig || !currentConfig.networks || currentConfig.networks.length === 0)) {

    return (
        <>
            <section className="is-medium has-text-white">
                <div className="">
                    {/* <div className="container"> */}
                    <div className="columns is-mobile">
                        <div className="column is-8-desktop is-10">
                            <h1 className="title is-1 has-text-white">Standalone node</h1>
                            {/* <div className="setting">
                                <h3 className="title is-3 has-text-white">Init</h3>
                            </div> */}
                        </div>
                    </div>
                </div>
            </section>

            <section className="is-medium has-text-white">
                <p>This node can be used for testing purposes.</p>
                <p>It exposes the RPC port (9944) to the local AVADO network.</p>
            </section>
            <br /><br />
            <ServiceToggle onStatusChange={setStatus} description="Polkadot node" name="standalone" command="/usr/local/bin/polkadot --dev --alice --validator --unsafe-rpc-external --unsafe-ws-external --rpc-cors all -d /polkadot-data" />

?           {(status === "RUNNING") && (
                <>
                    <br /><br />
                    <section className="is-medium has-text-white">
                        <p>
                            You can now connect to the polkadot chain using the URL <b>ws://my.polkadotcustom.avado.dnp.dappnode.eth:9944</b>
                        </p>
                        <br />
                        <p>
                            If you have installed the  <a target="_blank" href="http://my.avado/#/installer">Polkadot UI package</a> you can inspect the chain
                        using this link: <a target="_blank" href="http://my.polkadot-ui.avado.dnp.dappnode.eth/#/explorer">http://my.polkadot-ui.avado.dnp.dappnode.eth/#/explorer</a>
                        </p>
                        <br />
                        <p>If you want to start over - go to the package <a target="_blank" href="http://my.avado/#/Packages/polkadotcustom.avado.dnp.dappnode.eth/detail">management</a> screen and click the "Remove Volumes" button.
                    Then you can go back to the <a href="/">start screen of the wizard.</a>
                        </p>
                        <p>
                            <a target="_blank" href="http://my.avado/#/Packages/polkadotcustom.avado.dnp.dappnode.eth/detail">Open node logs</a>
                        </p>

                    </section>
                </>
            )}

            {/* 
                <section className="is-medium has-text-white">
                    <p>Join a network</p>


                    <div className="field">
                        <div className="field-label is-normal">
                            <label className="label has-text-white">network ID</label>
                        </div>
                        <div className="field-body">
                            <div className="field">
                                <p className="control">
                                    <input className="input" onChange={(e) => { setNetworkId(e.target.value) }} />

                                </p>
                            </div>
                        </div>
                    </div>


                    <div className="field is-grouped">
                        <div className="control">
                            <button onClick={() => { joinNetwork(networkId) }} className="button is-primary">Join</button>
                        </div>

                    </div>

                </section> */}
        </>
    )
    // }


    // return (
    //     <>
    //         <section className="is-medium has-text-white">
    //             <div className="">
    //                 {/* <div className="container"> */}
    //                 <div className="columns is-mobile">
    //                     <div className="column is-8-desktop is-10">
    //                         <h1 className="title is-1 has-text-white">AVADO - Polkadot custom chain</h1>
    //                         {/* <div className="setting">
    //                         <h3 className="title is-3 has-text-white">Init</h3>
    //                     </div> */}
    //                     </div>
    //                 </div>
    //             </div>
    //         </section>

    //         <section className="is-medium has-text-white">
    //             {networks}
    //         </section>
    //         <br />
    //         <br />

    //         <section className="is-medium has-text-white">
    //             <div>Now that you are connected to the network - you can start your Polkadot node.
    //                 Paste the start command here from your server config
    //             </div>
    //             {/* <button onClick={() => { toggleService("start", "polkadot") }} className="button is-primary">Start Polkadot node</button> */}
    //             <ServiceToggle description="Polkadot node" name="testservice" />
    //         </section>
    //     </>
    // )

    // return (
    //     <>
    //         <section className="is-medium has-text-white">
    //             <div className="">
    //                 {/* <div className="container"> */}
    //                 <div className="columns is-mobile">
    //                     <div className="column is-8-desktop is-10">
    //                         <h1 className="title is-1 has-text-white">AVADO - Polkadot custom chain</h1>
    //                         <div className="setting">
    //                             <h3 className="title is-3 has-text-white">Server</h3>
    //                             <div >Network id: {currentConfig && currentConfig.networkid}</div>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </div>
    //         </section>
    //     </>
    // );


    // return null;
};

export default Comp;