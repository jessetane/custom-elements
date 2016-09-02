var hasNative = !!window.customElements
var _HTMLElement = window.HTMLElement
window.HTMLElement = CustomElement

function CustomElement () {
  if (hasNative) {
    return Reflect.construct(_HTMLElement, arguments, this.constructor)
  } else {
    return this
  }
}

CustomElement.prototype = Object.create(
  _HTMLElement.prototype
)

function CustomElementsRegistry () {}

CustomElementsRegistry.prototype.define = function (name, constructor, options) {
  var nodeName = name.toUpperCase()
  if (nodeName in registry) {
    throw new Error('NotSupportedError')
  }
  registry[nodeName] = constructor
  selectors += selectors.length ? (',' + name) : name
  upgradeChildren(document, name, true)
}

function upgradeChildren (element, selector, connected) {
  Array.prototype.slice.call(
    element.querySelectorAll(selector)
  ).forEach(function (child) {
    upgradeElement(child, connected)
  })
}

function upgradeElement (element, connected) {
  var constructor = registry[element.nodeName]
  if (constructor) {
    if (!element.__defined) {
      constructElement(element, constructor)
    }
    if (connected && element.connectedCallback && !element.__isConnected) {
      element.__isConnected = true
      element.connectedCallback()
    }
  }
  upgradeChildren(element, selectors, connected)
}

function constructElement (element, constructor) {
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(element, constructor.prototype)
  } else {
    element.__proto__ = constructor.prototype
  }
  element.__custom = true
  element.__defined = true
  element.__isConnected = false
  constructor.call(element)
  if (element.attributeChangedCallback && constructor.observedAttributes) {
    constructor.observedAttributes.forEach(function (attributeName) {
      element.attributeChangedCallback(
        attributeName,
        null,
        element.getAttribute(attributeName)
      )
    })
  }
}

function maybeUpgradeChildren (element) {
  var connected = element.__isConnected || document.contains(element)
  if (connected) {
    upgradeChildren(
      element,
      selectors,
      connected
    )
  }
}

function disconnectChildren (element) {
  Array.prototype.slice.call(
    element.querySelectorAll(selectors)
  ).forEach(disconnectElement)
}

function disconnectElement (element, recursive) {
  if (element.__custom && element.disconnectedCallback && element.__isConnected === true) {
    element.__isConnected = false
    element.disconnectedCallback()
  }
  if (recursive) {
    disconnectChildren(element)
  }
}

function changeAttribute (remove, element, name, value) {
  var callback = element.__custom && element.attributeChangedCallback
  if (callback) {
    var oldValue = element.getAttribute(name)
  }
  if (remove) {
    removeAttribute.call(element, name)
    value = null
  } else {
    setAttribute.call(element, name, value)
  }
  if (callback) {
    attributeChanges.push([ element, name, oldValue ])
    runAttributeChangedCallback(
      element,
      name,
      oldValue,
      value
    )
  }
}

function runAttributeChangedCallback (element, attributeName, oldValue, newValue) {
  if (oldValue === newValue) return
  var constructor = registry[element.nodeName]
  var observedAttributes = constructor.observedAttributes
  if (observedAttributes && arrayIncludes(observedAttributes, attributeName)) {
    element.attributeChangedCallback(
      attributeName,
      oldValue,
      newValue
    )
  }
}

function arrayIncludes (array, item) {
  var includes = false
  array.forEach(function (_item) {
    if (!includes && _item === item) {
      includes = true
    }
  })
  return includes
}

if (!window.customElements) {
  window.customElements = new CustomElementsRegistry()
  var registry = {}
  var selectors = ''
  var attributeChanges = []
  var appendChild = Element.prototype.appendChild
  var insertBefore = Element.prototype.insertBefore
  var removeChild = Element.prototype.removeChild
  var remove = Element.prototype.remove
  var setAttribute = Element.prototype.setAttribute
  var removeAttribute = Element.prototype.removeAttribute
  var createElement = document.createElement

  Object.defineProperty(Element.prototype, 'custom', {
    get: function () {
      return this.__custom
    }
  })

  Object.defineProperty(Element.prototype, 'defined', {
    get: function () {
      return this.__defined
    }
  })

  Object.defineProperty(Element.prototype, 'isConnected', {
    get: function () {
      return this.__isConnected
    },
    set: function (isConnected) {
      this.__isConnected = isConnected
    }
  })

  Element.prototype.appendChild = function (child) {
    child.remove()
    appendChild.call(this, child)
    if (selectors) {
      maybeUpgradeChildren(this)
    }
    return child
  }

  Element.prototype.insertBefore = function (child, otherChild) {
    child.remove()
    insertBefore.call(this, child, otherChild)
    if (selectors) {
      maybeUpgradeChildren(this)
    }
    return child
  }

  Element.prototype.replaceChild = function (child, otherChild) {
    this.insertBefore(child, otherChild)
    if (otherChild) {
      return otherChild.remove()
    }
  }

  Element.prototype.removeChild = function (child) {
    removeChild.call(this, child)
    if (selectors && child.nodeType === 1) {
      disconnectElement(child, true)
    }
    return child
  }

  Element.prototype.remove = function () {
    if (!this.parentNode) return
    remove.call(this)
    if (selectors && this.nodeType === 1) {
      disconnectElement(this, true)
    }
    return this
  }

  Element.prototype.setAttribute = function (name, value) {
    changeAttribute(false, this, name, value)
  }

  Element.prototype.removeAttribute = function (name) {
    changeAttribute(true, this, name)
  }

  document.createElement = function (name) {
    name = name.toUpperCase()
    var element = createElement.call(document, name)
    var constructor = registry[name]
    if (constructor) {
      constructElement(element, constructor)
    }
    return element
  }

  new MutationObserver(function (changes) {
    if (!selectors) return
    var changeCount = changes.length
    var i = -1
    while (++i < changeCount) {
      var change = changes[i]
      if (change.type === 'childList') {
        var added = change.addedNodes
        var removed = change.removedNodes
        var childCount = added.length
        var n = -1
        while (++n < childCount) {
          var child = added[n]
          if (child.nodeType === 1) {
            upgradeElement(child, selectors, true)
          }
        }
        childCount = removed.length
        n = -1
        while (++n < removed) {
          child = removed[n]
          if (child.nodeType === 1) {
            disconnectElement(child, true)
          }
        }
      } else if (change.type === 'attributes') {
        child = change.target
        if (child.__custom && child.attributeChangedCallback) {
          var attributeName = change.attributeName
          var oldValue = change.oldValue
          var lastKnownChange = attributeChanges[0]
          if (lastKnownChange &&
              lastKnownChange[0] === child &&
              lastKnownChange[1] === attributeName &&
              lastKnownChange[2] === oldValue) {
            attributeChanges.shift()
          } else {
            runAttributeChangedCallback(
              child,
              attributeName,
              oldValue,
              child.getAttribute(attributeName)
            )
          }
        }
      }
    }
  }).observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true
  })
}
