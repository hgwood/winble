const EventEmitter = require("events").EventEmitter
const uwp = require("uwp")
uwp.projectNamespace("Windows") /* global Windows */
const debug = require("debug")("winble")
const _ = require("lodash")

const events = new EventEmitter()

module.exports = _.assign({},
  nobleBindings(
    bluetoothScanner(
      deviceWatcher(new EventEmitter()),
      events)),
  lifecycle(events),
  bluetoothDevice(events),
  events,
  {on: _.bind(EventEmitter.prototype.on, events)})

function nobleBindings (bluetoothScanner) {
  return {
    startScanning () {
      bluetoothScanner.start()
    },
    stopScanning () {
      bluetoothScanner.stop()
    },
  }
}

function bluetoothDevice (eventEmitter) {
  let bluetoothDevice

  return {connect, discoverServices, discoverCharacteristics, read, write, notify}

  function connect (peripheralUuid) {
    const uwpBluetoothAddress = Number("0x" + peripheralUuid)
    Windows.Devices.Bluetooth.BluetoothLEDevice.fromBluetoothAddressAsync(uwpBluetoothAddress).done(
      function (_bluetoothDevice) {
        debug("Bluetooth device connected", peripheralUuid)
        bluetoothDevice = _bluetoothDevice
        eventEmitter.emit("connect", peripheralUuid, null)
      },
      function (err) {
        debug("Connection failed to Bluetooth device", peripheralUuid)
        eventEmitter.emit("connect", peripheralUuid, err)
      })
  }

  function discoverServices (peripheralUuid, serviceUuids) {
    // TODO: use the parameters as they should be
    const services = bluetoothDevice.gattServices.map(service => service.uuid.split("-").join(""))
    eventEmitter.emit("servicesDiscover", peripheralUuid, services)
  }

  function discoverCharacteristics (peripheralUuid, serviceUuid, characteristicUuids) {
    // TODO: use peripheralUuid and characteristicUuids as they should
    const service = bluetoothDevice.getGattService(serviceUuid)
    const characteristics = service.getAllCharacteristics().map(characteristic => ({
      uuid: characteristic.uuid.split("-").join(""),
      properties: [], // TODO: fill properties
    }))
    eventEmitter.emit("characteristicsDiscover", peripheralUuid, serviceUuid, characteristics)
  }

  function read (peripheralUuid, serviceUuid, characteristicUuid) {
    bluetoothDevice.getGattService(serviceUuid).getCharacteristics(characteristicUuid)[0]
      .readValueAsync()
      .done(data => eventEmitter.emit("read", peripheralUuid, serviceUuid, characteristicUuid, data, false))
  }

  function write (peripheralUuid, serviceUuid, characteristicUuid, data, withoutResponse) {
    bluetoothDevice.getGattService(serviceUuid).getCharacteristics(characteristicUuid)[0]
      .writeValueAsync(Windows.Security.Cryptography.CryptographicBuffer.createFromByteArray(data))
      .done(() => eventEmitter.emit("write", peripheralUuid, serviceUuid, characteristicUuid))
  }

  function notify (peripheralUuid, serviceUuid, characteristicUuid, notify) {
    eventEmitter.emit("notify", peripheralUuid, serviceUuid, characteristicUuid, notify)
  }
}

function lifecycle (eventEmitter) {
  return {init}

  function init () {
    process.nextTick(powerOn)
    process.on("SIGINT", onSigInt)
    process.on("exit", onProcessExit)
  }

  function powerOn () {
    debug("powered on")
    eventEmitter.emit("stateChange", "poweredOn")
  }

  function onSigInt () {
    // copied over from https://github.com/sandeepmistry/noble/blob/master/lib/hci-socket/bindings.js#L86
    var sigIntListeners = process.listeners("SIGINT")
    if (sigIntListeners[sigIntListeners.length - 1] === onSigInt) {
      // we are the last listener, so exit
      // this will trigger onProcessExit, and clean up
      process.exit(1)
    }
  }

  function onProcessExit () {
    uwp.close()
    debug("uwp closed")
  }
}

function bluetoothScanner (deviceWatcher, eventEmitter) {
  deviceWatcher.onNewDevice(onNewDevice)
  let scanning = false

  return {start, stop}

  function start () {
    scanning = true
    if (deviceWatcher.startable()) deviceWatcher.start()
  }

  function stop () {
    scanning = false
  }

  function onNewDevice (device) {
    if (!scanning) return
    if (device.id.indexOf("BTHLEDevice") < 0) return // is this really trust-worthy?
    Windows.Devices.Bluetooth.BluetoothLEDevice.fromIdAsync(device.id).done(function (bluetoothDevice) {
      debug("discovered Bluetoothe Low Energy device:", device.id)
      eventEmitter.emit("discover",
        bluetoothDevice.bluetoothAddress.toString(16),
        bluetoothDevice.address,
        bluetoothDevice.addressType)
    })
  }
}

function deviceWatcher (eventEmitter) {
  const windowsDeviceWatcher = Windows.Devices.Enumeration.DeviceInformation.createWatcher()
  windowsDeviceWatcher.addEventListener("added", device => eventEmitter.emit("onNewDevice", device))

  const statuses = {created: 0, started: 1, enumerationCompleted: 2, stopping: 3, stopped: 4, aborted: 5}
  const startableStatuses = _(statuses).pick("created", "stopped", "aborted").values()

  return {
    startable: () => _.includes(startableStatuses, windowsDeviceWatcher.status),
    start: () => windowsDeviceWatcher.start(),
    stop: () => windowsDeviceWatcher.stop(),
    onNewDevice: callback => eventEmitter.on("onNewDevice", callback),
  }
}
