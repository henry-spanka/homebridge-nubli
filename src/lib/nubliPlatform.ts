import { NubliAccessory } from "./nubliAccessory";
import Nubli from "nubli";
import { SmartLock } from "nubli/dist/lib/smartLock";

export class NubliPlatform {
    readonly log: (message: any) => void;
    private config: any;
    private api: any;
    private _accessories: Array<NubliAccessory> = [];
    private nubli: typeof Nubli = Nubli;
    readonly configPath?: string;

    constructor(log: (message: any) => void, config: any, api: any) {
        this.log = log;
        this.config = config;
        this.api = api;

        this.configPath = this.config.configPath? this.config.configPath : undefined;

        this.log("initializing Nubli platform plugin");

        if (this.config.locks !== null) {
            for (let smartLock of this.config.locks) {
                let accessory: NubliAccessory = new NubliAccessory(smartLock, this, this.api);

                this._accessories.push(accessory);
            }
        }

        if (config.debug) {
            this.nubli.setDebug(true);
        }

        this.nubli.on('smartLockDiscovered', (smartLock: SmartLock) => this.smartLockDiscovered(smartLock));

        this.setupBluetooth();
    }

    accessories(callback: (accessories: Array<NubliAccessory>) => void): void {
        callback(this._accessories);
    }

    private async setupBluetooth(): Promise<void> {
        this.log("Waiting for Bluetooth Adapter to be ready.");
        try {
            await this.nubli.onReadyToScan()
            this.log("Bluetooth adapter ready!");
        } catch (e) {
            this.log("Bluetooth adapter isn't ready. Trying again in 60 seconds.");
            setTimeout(() => this.setupBluetooth(), 60 * 1000);
            return;
        }

        this.nubli.startScanning();
    }

    private smartLockDiscovered(smartLock: SmartLock): void {
        for (let smartLockAccessory of this._accessories) {
            if (smartLockAccessory.uuid == smartLock.uuid) {
                this.log("Discovered Smart Lock with UUID " + smartLock.uuid);
                if (!smartLock.configExists(this.configPath)) {
                    this.log("The Smart Lock with UUID " + smartLock.uuid + " does not have a configuration. Cannot connect...");
                    return;
                }

                smartLockAccessory.setSmartLock(smartLock);
            }
        }
    }
    
}
