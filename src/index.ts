import { NubliPlatform } from "./lib/nubliPlatform";

module.exports = (homebridge: typeof import("homebridge")) => {
    homebridge.registerPlatform("homebridge-nubli", "Nubli", NubliPlatform);
};
