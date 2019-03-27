[Install Homebridge]: https://github.com/nfarina/homebridge#installation
[Configuration]: #Configuration


# homebridge-nubli

Homebridge platform plugin to manage Nuki Smart Locks via Bluetooth

[![NPM](https://nodei.co/npm/homebridge-nubli.png?compact=true)](https://npmjs.org/package/homebridge-nubli)

# Features
* Lock / Unlock Door
* Status of Door Sensor

# Setup / Installation
1. [Install Homebridge]
2. `npm install homebridge-nubli --save`
3. [Pair](#pairing) your Smart Lock with Nubli
4. Edit `config.json` and configure accessory. See [Configuration](#configuration) section.
4. Start Homebridge
5. Star the repository ;)

# Pairing
To pair your Smart Lock run the following command in your shell:
```bash
    node node_modules/nubli/examples/pair.js
```
Create a new nubliConfig folder inside your homebridge folder and copy the node_modules/nubli/config/*.json files to nubliConfig.

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

The UUID is the file name of the Nubli configuration.
See: [Nubli](https://github.com/henry-spanka/nubli)

# Help
If you have any questions or help please open an issue on the GitHub project page.

# Contributing
Pull requests are always welcome. If you have a device that is not supported yet please open an issue or open a pull request with
your modifications.

# License
The project is subject to the MIT license unless otherwise noted. A copy can be found in the root directory of the project [LICENSE](LICENSE).
