export type Action = "ping" | "lock" | "restart" | "shutdown";
export interface Device { id:string; name:string; platform:string; version:string; lastSeen:string; online:boolean; }
export interface CommandRequest { action:Action; requestId:string; }
export interface CommandResponse { requestId:string; ok:boolean; message:string; }
