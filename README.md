[Install Homebridge]: https://github.com/nfarina/homebridge#installation
[Configuration]: #Configuration


# homebridge-nubli

Homebridge platform plugin to manage Nuki Smart Locks via Bluetooth

[![NPM](https://nodei.co/npm/homebridge-nubli.png?compact=true)](https://npmjs.org/package/homebridge-nubli)

# Features
* Lock / Unlock / Unlatch Door
* Status of Door Sensor
* Battery Status

# Advantages to Nuki's HomeKit implementation
Nuki's HomeKit implementation only allows to Lock and Unlock the door.
*homebridge-nubli* exposes two Locks to HomeKit. One that lets you lock and unlock the door (door won't open) and another that lets you unlatch the door. It also shows whether the door is open via the integrated door sensor. This enables you to use HomeKit automations without opening the door, like unlocking the door in the morning and locking it again in the evening.

### Examples (States of the two HomeKit locks)

* Door Locked: Locked/Locked
* Door Unlocked: Unlocked/Locked
* Door Open: Unlocked/Unlocked
* Door Locked but Open: Locked/Unlocked

You can use both HomeKit integrations at the same time, although *homebridge-nubli* provides the same functionality as the official HomeKit integration (and even more).

# Setup / Installation
1. [Install Homebridge]
2. `npm install homebridge-nubli --save`
3. [Pair](#pairing) your Smart Lock with Nubli
4. Edit `config.json` and configure accessory. See [Configuration](#configuration) section.
4. Start Homebridge
5. Star the repository ;)

# Pairing
1. To pair your Smart Lock run the following command in your shell (inside the Homebridge directory):
```bash
    node node_modules/nubli/examples/pair.js
```
**Note:** The Smart Lock must be in pairing mode (Press the Button on the Lock until the ring is fully illuminated).

2. Create a new nubliConfig folder inside your homebridge folder and copy the node_modules/nubli/config/*.json files to nubliConfig.
```bash
    mkdir nubliConfig
    cp node_modules/nubli/config/*.json ./nubliConfig
```

# Configuration

To configure the plugin add the following to the platform section in `config.json`.

```json
{
    "platform": "Nubli",
    "configPath": "/path/to/homebridge/nubliConfig/",
    "debug": false,
    "locks": [
        {
            "name": "Entrance Lock",
            "uuid": "UUID of the Smart Lock"
        }
    ]
}
```

The UUID is the file name (without extension) of the Nubli configuration.
You can find them with:
```bash
    ls -l /path/to/homebridge/nubliConfig
```


# Help
If you have any questions or help please open an issue on the GitHub project page.

# Contributing
Pull requests are always welcome. If you have a device that is not supported yet please open an issue or open a pull request with
your modifications.

# License
The project is subject to the MIT license unless otherwise noted. A copy can be found in the root directory of the project [LICENSE](LICENSE).
