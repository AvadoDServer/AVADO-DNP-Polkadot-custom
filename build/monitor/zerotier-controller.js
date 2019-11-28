var assert = require('assert')
var request = require('nanorequest')
const axios = require('axios');

class Service {
    constructor({ authToken, host = 'localhost', port = 9993 }) {
        assert(
            typeof authToken === 'string',
            'We need an authToken to talk to the service.'
        )
        this._host = host
        this._port = port

        this._headers = {
            'X-ZT1-Auth': authToken,
            'content-type': 'application/json'
        }

        this.defaultOpts = {
            host: this._host,
            port: this._port,
            headers: this._headers
        }

        this.controller = this.controller.bind(this)
        this.network = this.network.bind(this)
        this._status = this._status.bind(this)

    }

    get(opts, cb) {
        opts = {
            method: 'get',
            timeout: 2000,
            url: opts.path,
            baseURL: `http://${this.defaultOpts.host}:${this.defaultOpts.port}`,
            headers: this.defaultOpts.headers
            // ...this.defaultOpts,
            // ...opts
        }
        console.log(opts);
        return axios.request(opts).then((r) => {
            // console.log("axios received: ---", opts.url);
            console.log(`result ${r.status}`);

            // console.log(r.status);
            // console.log("---");
            return r
        })
    }

    post(opts, cb) {
        // opts = {
        //     method: 'POST',
        //     ...this.defaultOpts,
        //     ...opts
        // }
        // return request(opts, cb)
        opts = {
            method: 'post',
            timeout: 2000,
            url: opts.path,
            baseURL: `http://${this.defaultOpts.host}:${this.defaultOpts.port}`,
            headers: this.defaultOpts.headers,
            data: opts.body
            // ...this.defaultOpts,
            // ...opts
        }
        console.log(opts);
        return axios.request(opts).then((r) => {
            // console.log("axios received: ---", opts.url);
            console.log(`result ${r.status}`);
            // console.log("---");
            return r
        })
    }


    delete(opts, cb) {
        opts = {
            method: 'delete',
            timeout: 2000,
            url: opts.path,
            baseURL: `http://${this.defaultOpts.host}:${this.defaultOpts.port}`,
            headers: this.defaultOpts.headers
        }
        console.log(opts);
        return axios.request(opts).then((r) => {
            // console.log("axios received: ---", opts.url); 
            // console.log(r.status); 
            console.log(`result ${r.status}`);
            // console.log("---"); 
            return r
        })
    }

    controller(cb) {
        return this.get({ path: '/controller' }, cb)
    }

    _status(cb) {
        return this.get({ path: '/status' }, cb)
    }

    network(cb) {
        return this.get({ path: '/controller/network' }, cb)
    }

    createNetwork(controllerId, options, cb) {
        const address = `/controller/network/${controllerId}______`;
        console.log("address", address);
        return this.post({
            path: address,
            body: options
        }, cb);
    }

    getNetwork(networkId, cb) {
        return this.get({ path: `/controller/network/${networkId}` }, cb)
    }

    postNetwork(networkId, options, cb) {
        return this.post({
            path: `/controller/network/${networkId}`,
            body: options
        }, cb)
    }

    deleteNetwork(networkId, cb) {
        return this.delete({ path: `/controller/network/${networkId}` }, cb)
    }

    getMembers(networkId, cb) {
        return this.get({ path: `/controller/network/${networkId}/member` }, cb)
    }

    getMember(networkId, memberId, cb) {
        return this.get({ path: `/controller/network/${networkId}/member/${memberId}` }, cb)
    }

    postMember(networkId, address, options, cb) {
        return this.post({
            path: `/controller/network/${networkId}/member/${address}`,
            body: options
        }, cb);
    }

    deleteMember(networkId, address, cb) {
        return this.delete({
            path: `/controller/network/${networkId}/member/${address}`,
        }, cb);
    }


    status(cb) {
        return this.get({ path: '/status' }, cb)
    }

    //   info (cb) {
    //     return this.get({ path: '/info' }, cb)
    //   }

    //   peers (cb) {
    //     return this.get({ path: '/peer' }, cb)
    //   }

    //   networks (cb) {
    //     return this.get({ path: '/network' }, cb)
    //   }

    //   network (nwid, cb) {
    //     return this.get({ path: `/network/${nwid}` }, cb)
    //   }

    //   peer (nodeId, cb) {
    //     return this.get({ path: `/peer/${nodeId}` }, cb)
    //   }

    //   join (nwid, cb) {
    //     return this.post({ path: `/network/${nwid}` }, cb)
    //   }

    //   leave (nwid, cb) {
    //     return this.delete({ path: `/network/${nwid}` }, cb)
    //   }

    //   set (nwid, props, cb) {
    //     console.log({ nwid, props });
    //     assert(typeof nwid === 'string', 'Need a Network ID. got ' + nwid)

    //     assert(
    //       Object.keys(props).every(key =>
    //         ztSettings.includes(key)
    //       ),
    //       'Allowed settings are: ' + ztSettings.join(', ')
    //     )

    //     props = Object.keys(props).reduce((acc, key) => {
    //       return { [key]: props[key] }
    //     }, {})

    //     return this.post({ path: `/network/${nwid}`, body: props }, cb)
    //   }


}

// const ztSettings = ['allowDefault', 'allowManaged', 'allowGlobal']

module.exports = Service;

// module.exports = function (opts) {
//   return new Service(opts)
// }