import React from "react";
//import "./Dashboard.css";
//import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css
import axios from "axios";

const monitorAPI = process.env["ENDPOINT"] || "http://my.polkadotcustom.avado.dnp.dappnode.eth:82";


const Comp = ({ name, description, onToggle, onStatusChange, command }) => {

    // const [serviceName, setServiceName] = React.useState();
    const [stateName, setStateName] = React.useState("UNKNOWN");
    const [pollStateCount, setPollStateCount] = React.useState(0);
    const [disabled, setDisabled] = React.useState(false);

    const [serviceCommand, setServiceCommand] = React.useState();
    const [showCmdDetail, setShowCmdDetail] = React.useState(true);


    React.useEffect(() => {
        // setServiceName(name);
        setPollStateCount(5);
    }, [name]);

    React.useEffect(() => {
        // setServiceName(name);
        // debugger;
        setServiceCommand(command);
        setCommand(command);
        if (command) {
            setShowCmdDetail(false);
        }
    }, []);

    React.useEffect(() => {
        if (pollStateCount > 0) {
            console.log("getStatus", pollStateCount);
            getStatus();
            onToggle && onToggle();
            setTimeout(() => {
                setPollStateCount(pollStateCount - 1);
            }, 1000);
        }
    }, [pollStateCount]);

    const setCommand = (cmd) => {
        axios.post(`${monitorAPI}/db/set/command`, { value: cmd }, { timeout: 5000 })
            .then((res) => {
                if (res) {
                    console.log("Command set");
                }
            });
    }

    const getStatus = () => {
        axios.get(`${monitorAPI}/supervisord/status/${name}`).then((res) => {
            if (res && res.data) {
                if (res.data.name === name) {
                    // if status changed - re-em
                    if (stateName !== res.data.statename) {
                        setDisabled(false);
                    }

                    setStateName(res.data.statename)
                    onStatusChange && onStatusChange(res.data.statename);
                } else {
                    setStateName("UNKNOWN-ERR");
                }
            }
        });
    };

    const startService = () => {
        setDisabled(true);
        axios.get(`${monitorAPI}/supervisord/start/${name}`).then((res) => {
            setPollStateCount(5);
            ///
        });
    };

    const stopService = () => {
        setDisabled(true);
        axios.get(`${monitorAPI}/supervisord/stop/${name}`).then((res) => {
            setPollStateCount(5);
            ///
        });
    };
    const serviceToggle = () => {
        return (
            <>
                <section className="is-medium has-text-white">
                    {showCmdDetail ? (
                        <>
                            <div onClick={() => {
                                setShowCmdDetail(!showCmdDetail);
                            }}><small>hide command</small></div>

                            <div>
                                <input className="input" type="text" name="cmd" value={serviceCommand} onChange={(e) => {
                                    setServiceCommand(e.target.value);
                                    setCommand(e.target.value);

                                }} />

                            </div>
                        </>
                    ) : (
                            <div onClick={() => {
                                setShowCmdDetail(!showCmdDetail);
                            }}><small>show command</small></div>
                        )}
                    {stateName !== "RUNNING" && (
                        <>
                            <p>Service is not running</p>
                            <a disabled={disabled} onClick={() => { startService(); }} className="button is-medium is-success">Start {description}</a>
                        </>
                    )}
                    {stateName === "RUNNING" && (
                        <>
                            <p>Service is running</p>
                            <a disabled={disabled} onClick={() => { stopService(); }} className="button is-medium is-success">Stop {description}</a>
                        </>
                    )}
                </section>
            </>
        )
    }

    return serviceToggle();

};

export default Comp;