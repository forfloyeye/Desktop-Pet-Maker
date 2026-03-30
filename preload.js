const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopPet', {
  beginDrag(cursorPoint) {
    ipcRenderer.send('pet:start-drag', cursorPoint);
  },
  dragWindow(cursorPoint) {
    ipcRenderer.send('pet:update-drag', cursorPoint);
  },
  endDrag() {
    ipcRenderer.send('pet:end-drag');
  },
  getConfig() {
    return ipcRenderer.invoke('pet:get-config');
  },
  chat(message) {
    return ipcRenderer.invoke('pet:chat', message);
  },
  getScreenSize() {
    return ipcRenderer.invoke('pet:get-screen-size');
  },
  onDirectionChange(callback) {
    const listener = (_event, direction) => callback(direction);
    ipcRenderer.on('pet:direction', listener);
    return () => ipcRenderer.removeListener('pet:direction', listener);
  },
  setDirection(direction) {
    ipcRenderer.send('pet:set-direction', direction);
  },
  setSpeed(speed) {
    ipcRenderer.send('pet:set-speed', speed);
  },
  setWalking(enabled) {
    ipcRenderer.send('pet:set-walking', enabled);
  },
  snapToFloor() {
    ipcRenderer.send('pet:snap-to-floor');
  },
  quit() {
    ipcRenderer.send('pet:quit');
  },
});