export type RuntimeMode = "client" | "server";

let runtimeMode: RuntimeMode = "client";

export function setRuntimeMode(mode: RuntimeMode): void {
    runtimeMode = mode;
}

export function isServer(): boolean {
    return runtimeMode === "server";
}