'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('bsonlite',Object.freeze({request:(action,payload)=>ipcRenderer.invoke('workspace:request',action,payload)}));
