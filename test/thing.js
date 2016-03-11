module.exports = Thing

function Thing () {
  HTMLElement.call(this)
  this.innerHTML = '4'
}

Thing.prototype = Object.create(
  HTMLElement.prototype
)

Thing.prototype.attachedCallback = function () {
  this.innerHTML += '2'
}

Thing.prototype.detachedCallback = function () {
  this.innerHTML = '0'
}

document.defineElement('x-thing', Thing)
