# AVADO-DNP-Polkadot-custom

Creates a virtual LAN over TCP/IP - allows you to cluster multiple instances together in one private network.

Then bootstraps a Polkadot node in this LAN and allows you to start/join a chain.

This software is intended to run on the AVADO system. You can get an AVADO box here https://ava.do/shop

## Building

```
npm install -g @dappnode/dappnodesdk@0.1.16

dappnodesdk build

or

dappnodesdk build --provider http://<ip of your IPFS API>:5001

```

## Usage

Install the package and follow the wizard.


