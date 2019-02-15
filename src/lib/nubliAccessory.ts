import { NubliPlatform } from "./nubliPlatform";
import { SmartLock } from "nubli/dist/lib/smartLock";
import { SmartLockResponse } from "nubli/dist/lib/smartLockResponse";
import { LockState, DoorSensor } from "nubli/dist/lib/states";

export class NubliAccessory {
    private config: any;
    private platform: NubliPlatform;
    private _services: any = {};
    private api: any;
    private cache: any = {};
    name: string;
    uuid: string;
    private smartLock?: SmartLock;

    constructor(config: any, platform: NubliPlatform, api: any) {
        if (!config.name || !config.uuid) {
            throw new Error("No name or UUID set");
        }

        this.uuid = config.uuid;

        this.config = config;
        this.platform = platform;
        this.api = api;

        this.name = config.name;

        this.cache = {
            currentLockState: this.api.hap.Characteristic.LockCurrentState.UNKNOWN,
            targetLockState: this.api.hap.Characteristic.LockTargetState.UNSECURED,
            currentUnlatchState: this.api.hap.Characteristic.LockCurrentState.UNKNOWN,
            targetUnlatchState: this.api.hap.Characteristic.LockTargetState.UNSECURED,
            batteryCritical: this.api.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL
        };
        
        this.init();
    }

    private init(): void {
        this.platform.log("Initializing Smart Lock" + this.name + " with UUID " + this.uuid);

        let informationService = new this.api.hap.Service.AccessoryInformation();

        informationService
            .setCharacteristic(this.api.hap.Characteristic.Manufacturer, "Nubli")
            .setCharacteristic(this.api.hap.Characteristic.Model, "Nuki Smart Lock v2.0")
            .setCharacteristic(this.api.hap.Characteristic.Name, this.name)
            .setCharacteristic(this.api.hap.Characteristic.SerialNumber, this.uuid)
            .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, "Unknown")
            .setCharacteristic(this.api.hap.Characteristic.HardwareRevision, "Unknown");

        this._services.information = informationService;

        let lockService = new this.api.hap.Service.LockMechanism(this.name, this.name);

        lockService
            .getCharacteristic(this.api.hap.Characteristic.LockCurrentState)
            .on('get', this.getCurrentLockState.bind(this));

        lockService
            .getCharacteristic(this.api.hap.Characteristic.LockTargetState)
            .on('get', this.getTargetLockState.bind(this))
            .on('set', this.setTargetLockState.bind(this));
        
        this._services.lockService = lockService;

        let unlatchService = new this.api.hap.Service.LockMechanism(this.name + " - Unlatch", this.name + " - Unlatch");

        unlatchService
            .getCharacteristic(this.api.hap.Characteristic.LockCurrentState)
            .on('get', this.getCurrentUnlatchState.bind(this));

        unlatchService
            .getCharacteristic(this.api.hap.Characteristic.LockTargetState)
            .on('get', this.getTargetUnlatchState.bind(this))
            .on('set', this.setTargetUnlatchState.bind(this));
        
        this._services.unlatchService = unlatchService;

        let batteryService = new this.api.hap.Service.BatteryService(this.name);

        batteryService
            .getCharacteristic(this.api.hap.Characteristic.BatteryLevel)
            .on('get', this.getBatteryLevel.bind(this));

        batteryService
            .getCharacteristic(this.api.hap.Characteristic.ChargingState)
            .on('get', this.getChargingState.bind(this));
        
        batteryService
            .getCharacteristic(this.api.hap.Characteristic.StatusLowBattery)
            .on('get', this.getStatusLowBattery.bind(this));

        this._services.batteryService = batteryService;
    }

    getCurrentLockState(callback: (err: string | null, result: number) => void): void {
        callback(null, this.cache.currentLockState);
    }

    getTargetLockState(callback: (err: string | null, result: number) => void): void {
        callback(null, this.cache.targetLockState);
    }

    setTargetLockState(value: number, callback: (err?: string | null) => void): void {
        let updateCallback = (response: SmartLockResponse) => {
            this.updateLockState(response);
            this.updateCharacteristics();
        };

        (async () => {
            if (!this.smartLock) {
                callback("An unknown error occured");
            } else {
                try {
                    if (value == this.api.hap.Characteristic.LockTargetState.SECURED) {
                        await this.smartLock.lock(updateCallback);
                        this.platform.log("Successfully locked door.");
                        callback();
                    } else if (value == this.api.hap.Characteristic.LockTargetState.UNSECURED) {
                        await this.smartLock.unlock(updateCallback);
                        this.platform.log("Successfully unlocked door.");
                        callback();
                    }
                } catch (error) {
                    this.platform.log("Could not lock/unlock door.");
                    callback("An unknown error occurred" + error.message);
                }
            }
        })();
    }

    getCurrentUnlatchState(callback: (err: string | null, result: number) => void): void {
        callback(null, this.cache.currentUnlatchState);
    }

    getTargetUnlatchState(callback: (err: string | null, result: number) => void): void {
        callback(null, this.cache.targetUnlatchState);
    }

    setTargetUnlatchState(value: number, callback: (err?: string | null) => void): void {
        let updateCallback = (response: SmartLockResponse) => {
            this.updateLockState(response);
            this.updateCharacteristics();
        };
        
        (async () => {
            if (!this.smartLock) {
                callback("An unknown error occured");
            } else {
                try {
                    if (value == this.api.hap.Characteristic.LockTargetState.SECURED) {
                        this.platform.log("The latch cannot be locked.");
                        callback("Cannot lock the latch.");
                    } else if (value == this.api.hap.Characteristic.LockTargetState.UNSECURED) {
                        await this.smartLock.unlatch(updateCallback);
                        this.platform.log("Successfully unlatched door.");
                        callback();
                    }
                } catch (error) {
                    this.platform.log("Could not unlatch door.");
                    callback("An unknown error occurred" + error.message);
                }
            }
        })();
    }

    getBatteryLevel(callback: (err: string | null, result: string | number) => void): void {
        callback(null, 100);
    }

    getChargingState(callback: (err: string | null, result: string | number) => void): void {
        callback(null, this.api.hap.Characteristic.ChargingState.NOT_CHARGEABLE);
    }

    getStatusLowBattery(callback: (err: string | null, result: string | number) => void): void {
        callback(null, this.cache.batteryCritical);
    }

    getServices(): Array<NubliAccessory> {
        return Object.keys(this._services).map((key: string) =>  {
            return this._services[key];
        });
    }

    async setSmartLock(smartLock: SmartLock): Promise<void> {
        this.smartLock = smartLock;

        try {
            await smartLock.readConfig(this.platform.configPath);

            let lockState: SmartLockResponse = await smartLock.readLockState();
            let config: SmartLockResponse = await smartLock.requestConfig();
            await smartLock.disconnect();
    
            this.updateLockState(lockState);
            this.updateConfig(config);
            this.updateCharacteristics();
        } catch (e) {
            this.cache.currentLockState =  this.api.hap.Characteristic.LockCurrentState.UNKNOWN;
            this.updateCharacteristics();
            this.platform.log("Failed to get Smart Lock configuration. An unknown error occurred");
            return;
        }

        smartLock.on('activityLogChanged', async () => {
            this.platform.log("Activity Log Changed - Updating state");

            try {
                let lockState: SmartLockResponse = await smartLock.readLockState();
                await smartLock.disconnect();

                this.updateLockState(lockState);
                this.updateCharacteristics();
            } catch (e) {
                this.cache.currentLockState =  this.api.hap.Characteristic.LockCurrentState.UNKNOWN;
                this.cache.currentUnlatchState =  this.api.hap.Characteristic.LockCurrentState.UNKNOWN;
                this.updateCharacteristics();
                this.platform.log("Failed to update Smart Lock state. An unkown error occurred");
                return;
            }
        });

        smartLock.on('stale', () => {
            this.platform.log("Smart Lock has not sent any advertisements within a time period. Marking as stale");

            this.cache.currentLockState =  this.api.hap.Characteristic.LockCurrentState.UNKNOWN;
            this.cache.currentUnlatchState =  this.api.hap.Characteristic.LockCurrentState.UNKNOWN;
            this.updateCharacteristics();
        });

        smartLock.on('staleRecovered', async () => {
            this.platform.log("Smart Lock has recovered - Trying to get status now");
            
            try {
                let lockState: SmartLockResponse = await smartLock.readLockState();
                await smartLock.disconnect();

                this.updateLockState(lockState);
                this.updateCharacteristics();
            } catch (e) {
                this.cache.currentLockState =  this.api.hap.Characteristic.LockCurrentState.UNKNOWN;
                this.cache.currentUnlatchState =  this.api.hap.Characteristic.LockCurrentState.UNKNOWN;
                this.updateCharacteristics();
                this.platform.log("Failed to update Smart Lock state after recovery. An unkown error occurred");
                return;
            }
        })

        this.platform.log("Smart Lock initialized");

    }

    private updateLockState(lockState: SmartLockResponse): void {
        this.platform.log(lockState);
        switch (lockState.data.doorSensorState) {
            case DoorSensor.OPEN:
                this.cache.currentUnlatchState = this.api.hap.Characteristic.LockCurrentState.UNSECURED;
                this.cache.targetUnlatchState = this.api.hap.Characteristic.LockCurrentState.UNSECURED;
                break;
            
            case DoorSensor.CLOSED:
                this.cache.currentUnlatchState = this.api.hap.Characteristic.LockCurrentState.SECURED;
                this.cache.targetUnlatchState = this.api.hap.Characteristic.LockCurrentState.SECURED;
                break;
        }

        switch (lockState.data.lockState) {
            case LockState.LOCKED:
                this.cache.currentLockState = this.api.hap.Characteristic.LockCurrentState.SECURED;
                this.cache.targetLockState = this.api.hap.Characteristic.LockTargetState.SECURED;
                break;
            
            case LockState.UNLOCKING:
                this.cache.currentLockState = this.api.hap.Characteristic.LockCurrentState.SECURED;
                this.cache.targetLockState = this.api.hap.Characteristic.LockTargetState.UNSECURED;
                break;

            case LockState.UNLOCKED:
            case LockState.UNLOCKED_LOCK_N_GO:
                this.cache.currentLockState = this.api.hap.Characteristic.LockCurrentState.UNSECURED;
                this.cache.targetLockState = this.api.hap.Characteristic.LockTargetState.UNSECURED;
                break;

            case LockState.UNLATCHING:
                this.cache.currentLockState = this.api.hap.Characteristic.LockCurrentState.UNSECURED;
                this.cache.targetLockState = this.api.hap.Characteristic.LockTargetState.UNSECURED;

                this.cache.currentUnlatchState = this.api.hap.Characteristic.LockCurrentState.SECURED;
                this.cache.targetUnlatchState = this.api.hap.Characteristic.LockCurrentState.UNSECURED;
                break;

            case LockState.LOCKING:
                this.cache.currentLockState = this.api.hap.Characteristic.LockCurrentState.UNSECURED;
                this.cache.targetLockState = this.api.hap.Characteristic.LockTargetState.SECURED;
                break;

            case LockState.UNLATCHED:
                this.cache.currentLockState = this.api.hap.Characteristic.LockCurrentState.UNSECURED;
                this.cache.targetLockState = this.api.hap.Characteristic.LockTargetState.UNSECURED;

                this.cache.currentUnlatchState = this.api.hap.Characteristic.LockCurrentState.UNSECURED;
                this.cache.targetUnlatchState = this.api.hap.Characteristic.LockCurrentState.UNSECURED;
                break;

            case LockState.BOOT_RUN:
            case LockState.CALIBRATION:
            case LockState.UNCALIBRATED:
            case LockState.UNDEFINED:
                this.cache.currentLockState = this.api.hap.Characteristic.LockCurrentState.UNKNOWN;
                break;

            case LockState.MOTOR_BLOCKED:
                this.cache.currentLockState = this.api.hap.Characteristic.LockCurrentState.JAMMED;
                break;

            default:
                this.cache.currentLockState = this.api.hap.Characteristic.LockCurrentState.UNKNOWN;
                break;
        }

        if (lockState.data.doorSensorState == DoorSensor.UNKNOWN) {
            this.cache.currentUnlatchState = this.api.hap.Characteristic.LockCurrentState.UNKNOWN;
        }

        if (lockState.data.battery_critical) {
            this.cache.batteryCritical = this.api.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW;
        } else {
            this.cache.batteryCritical = this.api.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
        }
    }

    private updateConfig(config: SmartLockResponse): void {
        this._services.information.setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, config.data.firmwareRevision);
        this._services.information.setCharacteristic(this.api.hap.Characteristic.HardwareRevision, config.data.hardwareRevision);
    }

    private updateCharacteristics(): void {
        this.getCurrentLockState((_, value) => {
            this._services.lockService.getCharacteristic(this.api.hap.Characteristic.LockCurrentState).updateValue(value);
        });

        this.getTargetLockState((_, value) => {
            this._services.lockService.getCharacteristic(this.api.hap.Characteristic.LockTargetState).updateValue(value);
        });

        this.getCurrentUnlatchState((_, value) => {
            this._services.unlatchService.getCharacteristic(this.api.hap.Characteristic.LockCurrentState).updateValue(value);
        });

        this.getTargetUnlatchState((_, value) => {
            this._services.unlatchService.getCharacteristic(this.api.hap.Characteristic.LockTargetState).updateValue(value);
        });

        this.getBatteryLevel((_, value) => {
            this._services.batteryService.getCharacteristic(this.api.hap.Characteristic.BatteryLevel).updateValue(value);
        });

        this.getChargingState((_, value) => {
            this._services.batteryService.getCharacteristic(this.api.hap.Characteristic.ChargingState).updateValue(value);
        });

        this.getStatusLowBattery((_, value) => {
            this._services.batteryService.getCharacteristic(this.api.hap.Characteristic.StatusLowBattery).updateValue(value);
        });
    }
}
