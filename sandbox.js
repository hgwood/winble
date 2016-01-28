/* eslint no-console: 0 */

const _ = require("lodash")

const sphero = require("sphero")
const bb8 = sphero("d8:23:27:0e:a1:d5")

bb8.connect(function (err) {
  if (err) return console.error(err)
  console.log("bb8 connected")
  setInterval(function () {
    bb8.color(_.sample(["red", "green", "blue"]), _.noop)
  }, 500)
})
