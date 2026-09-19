// Values the App Runtime host resolves once and shares with kit components rendered by apps (the cloud-sdk
// module is a host-provided runtime external, so apps and host read the same instance).
const runtimeConfig = { loomCloudBaseUrl: "" };

export const setRuntimeConfig = (patch = {}) => Object.assign(runtimeConfig, patch);

export const getRuntimeConfig = () => runtimeConfig;
