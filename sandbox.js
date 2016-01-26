/* eslint no-console: 0 */

// const n = require("./")

// console.log(n)

// n.on("discover", function (id) {
//   console.log("device", id)
// })

// n.on("stateChange", state => console.log("stateChange", state))

// n.init()
// n.startScanning()


const sphero = require("sphero")
const bb8 = sphero("d8:23:27:0e:a1:d5")

bb8.connect(function (err) {
  if (err) return console.error(err)
  console.log("bb8 connected")
  // roll BB-8 in a random direction, changing direction every second
  // setInterval(function() {
  //   var direction = Math.floor(Math.random() * 360);
  //   bb8.roll(150, direction);
  // }, 1000);
  bb8.color("green", function () {
    console.log("bb8 color callback")
    bb8.disconnect(function () {
      console.log("bb8 disconnect callback")
    })
  })
})
