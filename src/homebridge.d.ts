/// <reference types="node" />

declare module "homebridge" {
    export function registerPlatform(pluginName: string, platformName: string, constructor: new (log: (message: any) => void, config: any, api: object) => void, dynamic?: boolean): void;
}
