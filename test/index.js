require('../index.js')
var tape = require('tape')
var Thing = require('./thing.js')

tape('constructors are called and attributes are initialized', function (t) {
  t.plan(3)
  var thing = document.createElement('x-thing')
  t.equal(thing.innerHTML, '')
  t.equal(thing.value, '42')
  t.equal(thing.color, null)
})

tape('connected and disconnected callbacks are called', function (t) {
  t.plan(2)
  var thing = document.createElement('x-thing')
  document.body.appendChild(thing)
  t.equal(thing.innerHTML, '42')
  thing.remove()
  t.equal(thing.innerHTML, '0')
})

tape('attribute changed callback works synchronously for observed attributes changed via {set,remove}Attribute', function (t) {
  t.plan(9)
  var thing = document.createElement('x-thing')
  document.body.appendChild(thing)
  thing.attributeChangedCallback = function (name, oldValue, newValue) {
    t.fail()
  }
  thing.setAttribute('texture', 'rough')
  thing.attributeChangedCallback = function (name, oldValue, newValue) {
    t.equal(name, 'color')
    t.equal(oldValue, null)
    t.equal(newValue, '#F00')
  }
  thing.setAttribute('color', '#F00')
  thing.attributeChangedCallback = function (name, oldValue, newValue) {
    t.equal(name, 'color')
    t.equal(oldValue, '#F00')
    t.equal(newValue, '#00F')
  }
  thing.setAttribute('color', '#00F')
  thing.attributeChangedCallback = function (name, oldValue, newValue) {
    t.equal(name, 'color')
    t.equal(oldValue, '#00F')
    t.equal(newValue, null)
  }
  thing.removeAttribute('color')
  thing.remove()
})

tape('attribute changed callback works asynchrounously for observed attributes NOT changed via {set,remove}Attribute', function (t) {
  t.plan(3)
  var thing = document.createElement('x-thing')
  document.body.appendChild(thing)
  Thing.observedAttributes.push('draggable')
  thing.attributeChangedCallback = function (name, oldValue, newValue) {
    t.equal(name, 'draggable')
    t.equal(oldValue, null)
    t.equal(newValue, 'true')
    Thing.observedAttributes.pop()
    thing.draggable = false
    thing.remove()
  }
  thing.draggable = true
})

tape('innerHTML', function (t) {
  t.plan(6)
  var wrapper = document.createElement('div')
  document.body.appendChild(wrapper)

  // element that already exists in the dom gets upgraded
  wrapper.innerHTML = '<x-nested-thing></x-nested-thing>'
  function NestedThing () {
    HTMLElement.call(this)
    // spec says you shouldn't add children in constructors, though I don't see why not?
    this.innerHTML += '<x-thing color=#F0F></x-thing>'
  }
  NestedThing.prototype = Object.create(HTMLElement.prototype)
  customElements.define('x-nested-thing', NestedThing)
  t.equal(document.querySelector('x-thing').innerHTML, '42')
  t.equal(document.querySelector('x-thing').color, '#F0F')
  wrapper.firstElementChild.remove()

  // constructor called directly via document.createElement
  var el = document.createElement('x-nested-thing')
  wrapper.appendChild(el)
  t.equal(document.querySelector('x-thing').innerHTML, '42')
  el.remove()

  // recursive innerHTML
  wrapper.innerHTML = '<x-nested-thing><x-nested-thing></x-nested-thing></x-nested-thing>'
  setTimeout(function () {
    var things = Array.prototype.slice.call(
      document.querySelectorAll('x-thing')
    )
    t.equal(things.length, 2)
    things.forEach(function (thing) {
      t.equal(thing.innerHTML, '42')
    })
    wrapper.remove()
  })
})
