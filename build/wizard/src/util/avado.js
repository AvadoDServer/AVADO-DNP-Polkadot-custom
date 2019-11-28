export const listPackages = (ws) => {
    return new Promise((resolve, reject) => {
        if (!ws) {
            return resolve(false);
        }
        ws
            .call("listPackages.dappmanager.dnp.dappnode.eth")
            .then(res => {
                const packages = JSON.parse(res).result.reduce((accum, curr) => {
                    accum[curr.packageName] = curr;
                    return accum;
                }, {});
                resolve(packages);
                // if (packages) {
                //     // debugger;
                //     const myselfKey = Object.keys(packages).find((key) => {
                //         const packageName = packages[key].name;
                //         return packageName === name;
                //     })
                //     const myself = packages[myselfKey];
                //     if (myself && myself.state === "running") {
                //         setPackageInfo(myself);
                //         return resolve(true);
                //     } else {
                //         setPackageInfo(null);
                //         return resolve(false);
                //     }
                // }
            });
    })
}