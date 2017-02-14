# Winble

Noble bindings for the Universal Windows Platform.

This module is **EXPERIMENTAL**.

[Noble](https://github.com/sandeepmistry/noble) is a project that enables
programming Bluetooth 4 (aka Low Energy) devices using Node.js.
Unfortunatly, running it on Windows is not easy. Winble is an attempt to
make Noble capable of leveraging the native Universal Windows Platform
Bluetooth stack. This makes it compatible with any Windows 10 devices, from
PCs to phones and Windows IoT devices.

In order to access the UWP APIs, Winble *must* be run using Node.js
Chakra, which is the fork of Node.js where V8 is replaced by ChakraCore,
the JavaScript engine from the Edge browser.

## Alternative

Check out the more recent https://github.com/jasongin/noble-uwp, which should not require Node.js Chakra nor devices to be paired before using it.

## Maintenance

I'm not actively maintaining this because I'm not using it. I wrote it for fun. However, I will promptly review issues and merge contributions. Feel free. :)

## How to use

### Install all the things

- Install Node.js Chakra. You can find the latest release
[here](https://github.com/ms-iot/ntvsiot/releases). Make sure to get Node.js
with Chakra and *not* the Node.js Tools for Windows IoT (see
[here](https://github.com/Microsoft/node-uwp/issues/12#issuecomment-176441369)).
- `npm install` those from Node.js Chakra prompt:
  - [node-uwp](https://www.npmjs.com/package/uwp)
  - [noble](https://www.npmjs.com/package/noble)
  - winble (this module)

### Tell Noble to use Winble (noble >= 1.4.0)

To get an instance of Noble that uses Winble under the hood, do this:

`const noble = require('noble/with-bindings')(require('winble'))`

Then use Noble as usual.

### Edit Noble (noble < 1.4.0)

Noble <1.4.0 is not extensible without modifiying its source code.
Noble selects which bindings to use based on the environment. See
[here](https://github.com/sandeepmistry/noble/blob/c81097be7fdaf532cc4047e76bcc97823a0c4c7a/lib/noble.js#L16).
After installing Noble, replace this section of code by
`bindings = require('winble')`. You can then use Noble as intended.

## Limitations

Winble implements only a small part of the Noble API, but it should be enough
to play around with Bluetooth devices. I've used it to program a Sphero BB-8.
You can connect to the device, then list services and characteristics, and read
and write to and from characteristics. Note that devices need to be paired using
Windows before you can connect to them through winble.

## Changelog

- 1.0.2
  - Fix for incorrect intersection in discoverCharacteristics (#3)
- 1.0.1
  - package.json/readme update
- 1.0.0
  - initial release
