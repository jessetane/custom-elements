function Thing () {
  HTMLElement.call(this)
  this.value = '42'
}

Thing.observedAttributes = [
  'color'
]

Thing.prototype = Object.create(
  HTMLElement.prototype
)

Thing.prototype.attributeChangedCallback = function (name, oldValue, newValue) {
  this[name] = newValue
}

Thing.prototype.connectedCallback = function () {
  this.innerHTML += this.value
}

Thing.prototype.disconnectedCallback = function () {
  this.innerHTML = '0'
}

customElements.define('x-thing', Thing)
