require('../index.js')
var tape = require('tape')
var Thing = require('./thing.js')

tape('constructors are called', function (t) {
  t.plan(1)
  var thing = document.createElement('x-thing')
  t.equal(thing.innerHTML, '4')
})

tape('attached and detacted callbacks are called synchronously', function (t) {
  t.plan(2)
  var thing = document.createElement('x-thing')
  document.body.appendChild(thing)
  t.equal(thing.innerHTML, '42')
  thing.remove()
  t.equal(thing.innerHTML, '0')
})

tape('attribute changed callback works', function (t) {
  t.plan(9)
  var thing = document.createElement('x-thing')
  document.body.appendChild(thing)
  step1()
  function step1 () {
    thing.attributeChangedCallback = function (name, oldValue, newValue) {
      t.equal(name, 'data-testing')
      t.equal(oldValue, null)
      t.equal(newValue, 'much')
      step2()
    }
    thing.setAttribute('data-testing', 'much')
  }
  function step2 () {
    thing.attributeChangedCallback = function (name, oldValue, newValue) {
      t.equal(name, 'data-testing')
      t.equal(oldValue, 'much')
      t.equal(newValue, 'wow')
      step3()
    }
    thing.setAttribute('data-testing', 'wow')
  }
  function step3 () {
    thing.attributeChangedCallback = function (name, oldValue, newValue) {
      t.equal(name, 'data-testing')
      t.equal(oldValue, 'wow')
      t.equal(newValue, null)
      thing.remove()
    }
    thing.removeAttribute('data-testing')
  }
})

tape('innerHTML works (asynchronously)', function (t) {
  t.plan(1)
  var wrapper = document.createElement('div')
  document.body.appendChild(wrapper)
  wrapper.innerHTML = '<x-thing></x-thing>'
  setTimeout(function () {
    t.equal(document.querySelector('x-thing').innerHTML, '42')
  })
})
