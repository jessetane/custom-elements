require('../index.js')
var tape = require('tape')
var Thing = require('./thing.js')

tape('', function (t) {
  t.plan(1)
  var thing = document.createElement('x-thing')
  document.body.appendChild(thing)
  t.equal(thing.innerHTML, '42')
})

// tape('attached callbacks are synchronous', function (t) {
//   t.plan(1)
//   var thing = document.createElement('x-thing')
//   document.body.appendChild(thing)
//   t.equal(thing.innerHTML, '42')
// })

// tape('detached callbacks are synchronous', function (t) {
//   t.plan(1)
//   var thing = document.querySelector('x-thing')
//   thing.remove()
//   t.equal(thing.innerHTML, '4')
// })
