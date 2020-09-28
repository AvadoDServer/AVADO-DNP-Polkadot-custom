import React from "react";
import { Link, Redirect } from "react-router-dom";
// import styled from "styled-components";
import autobahn from "autobahn-browser";
import QrReader from 'react-qr-reader'
import { Formik, Form, Field, ErrorMessage } from "formik";
// import { listPackages } from "../../../util/avado";
import classNames from "classnames";
import axios from "axios";
import spinner from "../../../assets/spinner.svg";
import avadobox from "../../../assets/avado-box.png";
import "./Dashboard.css";
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ServiceToggle from "../../../components/ServiceToggle";
import { parse } from "../../../../node_modules/@fortawesome/fontawesome-svg-core";

const url = "ws://my.wamp.dnp.dappnode.eth:8080/ws";
const realm = "dappnode_admin";
const monitorAPI = process.env["ENDPOINT"] || "http://my.polkadotcustom.avado.dnp.dappnode.eth:82";
//const monitorAPI = "http://localhost:82";


const Comp = () => {

    const [showSpinner, setShowSpinner] = React.useState(true);
    const [appState, setAppState] = React.useState();
    const [addmemberid, setAddmemberid] = React.useState("");
    const [currentConfig, setCurrentConfig] = React.useState(undefined);
    const [memberInfo, setMemberInfo] = React.useState({});
    const [nodeIdentity, setNodeIdentity] = React.useState();
    const [nodeStatus, setNodeStatus] = React.useState();

    const base_cmd = "/usr/local/bin/polkadot --pruning archive --chain polkadot-dev --validator --unsafe-rpc-external --unsafe-ws-external --rpc-cors all -d /polkadot-data";
    const def_cmd = base_cmd + " --alice";
    const client_cmd = base_cmd + " --bob";

    React.useEffect(() => {
        getStatus().then(() => { setShowSpinner(false) });
    }, []);

    // const setCommand = (cmd) => {
    //     axios.post(`${monitorAPI}/db/set/command`, { value: cmd }, { timeout: 5000 })
    //         .then((res) => {
    //             if (res) {
    //                 console.log("Command set");
    //             }
    //         });
    // }

    // setCommand(def_cmd);


    const getnodeid  =  () =>  {
        axios.get(`${monitorAPI}/nodeinfo`).then((res)=>{
            setNodeIdentity(res.data.peerid);
        })
    }

    // // try to parse the nodeID out of logfile of Polkadot
    // const getnodeid = () => {
    //     axios.get(`${monitorAPI}/supervisord/readstdoutlogs/testservice/0/10000`, { timeout: 5000 })
    //         .then((res) => {
    //             if (res && res.data) {
    //                 const lines = res.data.split("\n");
    //                 let idline;
    //                 lines.forEach((line) => {
    //                     if (line.indexOf("node identity is") > 0) {
    //                         console.log(line);
    //                         const parts = line.split(":");
    //                         idline = (parts[parts.length - 1]).trim();
    //                     }
    //                 })
    //                 console.log("IDLINE=", idline);
    //                 if (idline) {
    //                     console.log("setting idline", idline);
    //                     setNodeIdentity(idline);
    //                 }
    //             }
    //         });
    // }

    React.useEffect(() => {
        if (currentConfig && currentConfig.mode) {
            switch (currentConfig.mode) {
                case "server":
                    setAppState("server");
                    // getClientStatus();
                    break;
                case "client":
                    setAppState("client");
                    break;
                case "standalone":
                    setAppState("standalone");
                    break;

                case "init":
                default:
                    setAppState("init");
                    break;
            }
        }
    }, [currentConfig]);


    const waitUntilTrue = (conditionPromise, args) => {
        return new Promise((resolve, reject) => {
            conditionPromise(args).then((boolResult) => {
                if (boolResult) {
                    return resolve();
                } else {
                    setTimeout(() => {
                        conditionPromise(args).then(() => { resolve() });
                    }, 2000);
                }
            }).catch((e) => {
                setTimeout(() => {
                    conditionPromise(args).then(() => { resolve() });
                }, 2000);
            });
        });
    }


    const getStatus = () => {
        const p = () => {
            return new Promise((resolve, reject) => {
                console.log("Polling status from container");
                axios.get(`${monitorAPI}/network/status`, { timeout: 5000 })
                    .then((res) => {
                        if (res && res.data) {
                            if (res.data.networkid && res.data.mode === "server") {
                                axios.get(`${monitorAPI}/network/overview`, { timeout: 5000 })
                                    .then((memberres) => {
                                        setCurrentConfig({ ...currentConfig, ...res.data, members: memberres.data });
                                        return resolve(true);
                                    });
                            } else {
                                setCurrentConfig(res.data);
                                return resolve(true);
                            }
                        }
                    }).catch((e) => {
                        return reject();
                    });
            });
        };
        return waitUntilTrue(p);
    };

    const createNetwork = () => {
        axios.get(`${monitorAPI}/createnetwork`).then((res) => {
            if (res && res.data) {
                setShowSpinner(true);
                getStatus().then(() => { setShowSpinner(false) });
            }
        });
    }

    const deleteNetwork = (networkid) => {
        confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className="modal is-active">
                        <div className="modal-background"></div>
                        <div className="modal-card">
                            <header className="modal-card-head">
                                <p className="modal-card-title">Delete network</p>
                                <button className="delete" onClick={onClose} aria-label="close"></button>
                            </header>
                            <section className="modal-card-body">
                                Are you sure you want to delete this network ? It will remove all connections and permanently delete this private network.
                            </section>
                            <footer className="modal-card-foot">
                                <button className="button is-success" onClick={() => {
                                    axios.get(`${monitorAPI}/deletenetwork`).then((res) => {
                                        setShowSpinner(true);
                                        getStatus().then(() => { setShowSpinner(false) });
                                    });
                                    onClose();
                                }}
                                >Yes</button>
                                <button onClick={onClose} className="button">No</button>
                            </footer>
                        </div>
                    </div>
                );
            }
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

    const addmember = (memberid) => {
        console.log(`Add ${memberid}`);
        if (memberid.length !== 10) {
            setAddmemberid("invalid");
            return;
        }
        axios.get(`${monitorAPI}/network/add/${memberid}`).then((res) => {
            setShowSpinner(true);
            setAddmemberid("");
            getStatus().then(() => { setShowSpinner(false) });
        });
    };

    const deleteMember = (memberid) => {
        confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className="modal is-active">
                        <div className="modal-background"></div>
                        <div className="modal-card">
                            <header className="modal-card-head">
                                <p className="modal-card-title">Delete member</p>
                                <button className="delete" onClick={onClose} aria-label="close"></button>
                            </header>
                            <section className="modal-card-body">
                                Are you sure you want to delete member {memberid}?
                            </section>
                            <footer className="modal-card-foot">
                                <button className="button is-success" onClick={() => {

                                    console.log(`Delete ${memberid}`);
                                    axios.get(`${monitorAPI}/network/delete/${memberid}`).then((res) => {
                                        setShowSpinner(true);
                                        getStatus().then(() => { setShowSpinner(false) });
                                    });

                                    onClose();
                                }}
                                >Yes</button>
                                <button onClick={onClose} className="button">No</button>
                            </footer>
                        </div>
                    </div>
                );
            }
        });
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

    if (appState === "init") {
        return (
            <div class="dashboard">
                <section className="is-medium has-text-white">
                    <div className="container">
                        {/* <div className="container"> */}
                        <div className="columns is-mobile">
                            <div className="column is-8-desktop is-10">
                                <h1 className="title is-1 has-text-white">AVADO - Polkadot custom chain configurator</h1>
                                <div className="setting">
                                    <h3 className="title is-3 has-text-white">Let's get started</h3>
                                </div>
                                <p>How do you want to run Polkadot?</p>

                                <br /><br />

                                <div class="tile is-ancestor">
                                    <div class="tile">
                                        <div class="card">
                                            <div class="card-content">
                                                <h3 className="title is-3 has-text-white">Standalone node</h3>
                                                <p>Choose this to spin up a standalone node you can use for development purposes.</p>
                                            </div>
                                            <footer class="card-footer">
                                                <p class="card-footer-item">
                                                    <div className="control">
                                                        <Link
                                                            className="button is-medium is-success"
                                                            to={{
                                                                pathname: "/standalone"
                                                            }}
                                                        >Start a standalone node</Link>
                                                    </div>

                                                </p>
                                            </footer>
                                        </div>
                                    </div>
                                    <div class="tile">
                                        <div class="card">
                                            <div class="card-content">                                            <h3 className="title is-3 has-text-white">Consortium of nodes</h3>
                                                <p>Choose this if you want to create a private P2P encrypted network with 2 or more polkadot nodes.</p>
                                                <p>Do you want to create a new network - or join an existing network?</p>
                                            </div>
                                            <footer class="card-footer">
                                                <p class="card-footer-item">

                                                    <div className="control">
                                                        <button onClick={() => { createNetwork(); }} className="button is-medium is-success">Create a new network</button>
                                                    </div>
                                                </p>

                                                <p class="card-footer-item">
                                                    <div className="control">
                                                        <Link
                                                            className="button is-medium is-success"
                                                            to={{
                                                                pathname: "/client"
                                                            }}
                                                        >Join an existing network</Link>
                                                    </div>
                                                </p>
                                            </footer>
                                        </div>
                                    </div>
                                </div>
                            </div>



                        </div>
                    </div>

                </section>


                {/* <section className="is-medium has-text-white">
                    <div className="container">
                        <div className="field is-grouped">
                            <div className="control">
                                <button onClick={() => { createNetwork(); }} className="button is-medium is-success">Create a new network</button>
                            </div>
                            <div className="control">
                                <Link
                                    className="button is-medium is-success"
                                    to={{
                                        pathname: "/client"
                                    }}
                                >Join an existing network</Link>
                            </div>
                        </div>
                    </div>
                </section> */}
            </div >

        );
    }


    const renderLastSeen = (member) => {
        if (!member.lastping) {
            return (<>unknown</>)
        }
        const age = Date.now() - parseInt(member.lastping);

        return (<>{Date.now()}<br />{member.lastping}<br />{age}</>);
    }

    if (appState === "server") {

        let serverip;

        if (currentConfig && currentConfig.status) {
            console.log("currentstatus.address", currentConfig.status.address)
        }

        const myself = currentConfig.members ? (
            <div className="memberboxparent">{
                currentConfig.members
                    .filter((member) => {
                        return currentConfig && currentConfig.status &&
                            (member.address === currentConfig.status.address)
                    })
                    .map((member, i) => {
                        serverip = member.ipAssignments[0];
                        return (
                            <span className="memberbox" key={i}>
                                <div className="panel">
                                    <p className="panel-heading has-text-centered">
                                        {member.id}
                                    </p>
                                    <div className="panel-block is-horizontal-center">
                                        <figure className="image is-128x128">
                                            <img src={avadobox} />
                                        </figure>
                                    </div>
                                    <div className="panel-block has-text-white">
                                        <p>ip: {member && (<>{member.ipAssignments[0]}</>)}</p>
                                    </div>
                                    <div className="panel-block has-text-white">
                                        <p>alias: &quot;{member.name}&quot;</p>
                                    </div>
                                    <div className="panel-block has-text-centered has-text-white">
                                        Network owner
                            </div>
                                    {/* <div className="panel-block has-text-centered has-text-white">

                                        {renderLastSeen(member)}
                                    </div> */}
                                </div>
                            </span>
                        );
                    })}
            </div>) : null;

        const nodes = currentConfig.members ? (<div className="memberboxparent">{currentConfig.members
            .filter((member) => { return currentConfig && currentConfig.status && (member.address !== currentConfig.status.address) })
            .map((member, i) => {
                return (
                    <span className="memberbox" key={i}>
                        <div className="panel">
                            <p className="panel-heading  has-text-centered">
                                {member.id}
                            </p>
                            <div className="panel-block has-text-centered">
                                <figure className="image is-128x128">
                                    <img src={avadobox} />
                                </figure>
                            </div>
                            <div className="panel-block has-text-white">
                                <p>ip: {member && (<>{member.ipAssignments[0]}</>)}</p>
                            </div>
                            <div className="panel-block has-text-white">

                                <p>alias: &quot;{member.name}&quot;</p>
                            </div>
                            <div className="panel-block has-text-white">
                                <FontAwesomeIcon
                                    className="icon is-small"
                                    icon={faTrashAlt}
                                    onClick={() => { deleteMember(member.address); }}
                                />&nbsp;Member
                            </div>
                        </div>
                    </span>
                );
            })}</div>) : null;

        return (
            <>
                <section className="section has-text-white">
                    <div className="">
                        {/* <div className="container"> */}
                        <div className="columns is-mobile">
                            <div className="column is-8-desktop is-10">
                                <h1 className="title is-1 has-text-white">AVADO - Polkadot custom chain</h1>

                                {/* <div >Network id: {currentConfig.networkid}</div> */}


                                <div className="setting">
                                    <h3 className="title is-3 has-text-white">Private Network</h3>
                                    <h4 className="title is-4 has-text-white">Network ID: {currentConfig.networkid}
                                        <span>
                                            <FontAwesomeIcon
                                                className="icon is-small"
                                                icon={faTrashAlt}
                                                onClick={() => { deleteNetwork(currentConfig.networkid); }}
                                            /></span>

                                    </h4>
                                    <div className="columns is-mobile">
                                        {myself}
                                        {nodes}
                                        <span className="memberbox">
                                            <div className="panel">
                                                <p className="panel-heading  has-text-centered">Add New</p>
                                                <div className="panel-block has-text-centered">
                                                    {/* <figure className="image is-128x128">
                                                        <img src={avadobox} />
                                                    </figure> */}
                                                </div>

                                                <div className="panel-block has-text-white">
                                                    <div className="field has-text-centered ">
                                                        <div className="control">
                                                            <input className="input" type="text" placeholder="ID of new member" value={addmemberid} onChange={(e) => { setAddmemberid(e.target.value) }} />
                                                        </div>
                                                        <br />

                                                        <div className="control has-text-centered">
                                                            <a onClick={() => { addmember(addmemberid); }} className="button is-success">add member</a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                <section className="section has-text-white">
                    <h3 className="title is-3 has-text-white">Polkadot node</h3>
                    <ServiceToggle description="Polkadot node" name="testservice" onToggle={getnodeid} onStatusChange={setNodeStatus} command={def_cmd} />

                    <div>
                        <ul>
                            <li>Node status: {nodeStatus}</li>
                            <li>Node Identity: {nodeIdentity}</li>
                            {/* <li>IP: {serverip}</li>
                            <li>Network ID: {currentConfig.networkid}</li> */}
                        </ul>
                    </div>

                    {(nodeStatus === "RUNNING") && (
                    <a target="_blank" href="http://my.avado/#/Packages/polkadotcustom.avado.dnp.dappnode.eth/detail">Open node logs</a>
                )}


                    {/* <p>Command for clients</p>
                    <pre>{client_cmd} --bootnodes '/ip4/{serverip}/tcp/30333/p2p/{nodeIdentity}'</pre> */}

                </section>


            </>
        );
    }

    if (appState === "client") {
        return (
            <>
                <Redirect to="/client" />
            </>
        );
    }

    if (appState === "standalone") {
        return (
            <>
                <Redirect to="/standalone" />
            </>
        );
    }
    return null;
};

export default Comp;