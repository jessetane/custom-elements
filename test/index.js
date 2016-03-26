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

tape('innerHTML works', function (t) {
  t.plan(4)
  var wrapper = document.createElement('div')
  document.body.appendChild(wrapper)

  // undefined element already exists in the dom
  wrapper.innerHTML = '<x-nested-thing></x-nested-thing>'
  function NestedThing () {
    HTMLElement.call(this)
    this.innerHTML += '<x-thing></x-thing>'
  }
  NestedThing.prototype = Object.create(HTMLElement.prototype)
  document.defineElement('x-nested-thing', NestedThing)
  t.equal(document.querySelector('x-thing').innerHTML, '42')
  wrapper.firstElementChild.remove()

  // constructor called directly via document.createElement
  var el = document.createElement('x-nested-thing')
  wrapper.appendChild(el)
  t.equal(document.querySelector('x-thing').innerHTML, '42')
  el.remove()

  // recursive innerHTML
  wrapper.innerHTML = '<x-nested-thing><x-nested-thing></x-nested-thing></x-nested-thing>'
  setTimeout(function () {
    Array.prototype.slice.call(
      document.querySelectorAll('x-thing')
    ).forEach(function (thing) {
      t.equal(thing.innerHTML, '42')
    })
    wrapper.remove()
  })
})
