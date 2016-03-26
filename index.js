function defineElement (name, constructor, options) {
  name = name.toLowerCase()
  if (name in registry) {
    throw new Error('NotSupportedError')
  }
  registry[name] = constructor
  registry[name.toUpperCase()] = constructor
  selectors += selectors.length ? (',' + name) : name
  scan(document, name)
}

function scan (parent, selector) {
  Array.prototype.slice.call(
    parent.querySelectorAll(selector || selectors)
  ).forEach(function (child) {
    var constructor = registry[child.nodeName]
    Object.setPrototypeOf(child, constructor.prototype)
    constructor.call(child)
    scan(child)
    if (child.attachedCallback) {
      child.attachedCallback()
    }
  })
}

function CustomHTMLElement () {
  createHiddenProperty(this, '__constructed__', true)
  createHiddenProperty(this, '__attached__', false)
}

CustomHTMLElement.prototype = Object.create(
  HTMLElement.prototype
)

function createHiddenProperty (object, property, value) {
  Object.defineProperty(object, property, {
    value: value,
    writable: true,
    enumerable: false,
    configurable: false
  })
}

if (!document.defineElement) {
  var registry = {}
  var selectors = ''
  var appendChild = Element.prototype.appendChild
  var insertBefore = Element.prototype.insertBefore
  var removeChild = Element.prototype.removeChild
  var remove = Element.prototype.remove
  var realCreateElement = document.createElement

  Element.prototype.appendChild = function (child) {
    child.remove()
    appendChild.call(this, child)
    if (registry[child.nodeName] && child.attachedCallback) {
      child.__attached__ = true
      child.attachedCallback()
    }
    return child
  }

  Element.prototype.insertBefore = function (child, otherChild) {
    child.remove()
    insertBefore.call(this, child, otherChild)
    if (registry[child.nodeName] && child.attachedCallback) {
      child.__attached__ = true
      child.attachedCallback()
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
    if (registry[child.nodeName] && child.detachedCallback) {
      child.__attached__ = false
      child.detachedCallback()
    }
    return child
  }

  Element.prototype.remove = function () {
    if (!this.parentNode) return
    remove.call(this)
    if (registry[this.nodeName] && this.detachedCallback) {
      this.__attached__ = false
      this.detachedCallback()
    }
    return this
  }

  document.createElement = function (name) {
    var element = realCreateElement.call(document, name)
    var constructor = registry[name.toLowerCase()]
    if (constructor) {
      Object.setPrototypeOf(element, constructor.prototype)
      constructor.call(element)
      scan(element)
    }
    return element
  }

  document.defineElement = defineElement

  window.HTMLElement = CustomHTMLElement

  new MutationObserver(function (changes) {
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
          var constructor = registry[child.nodeName]
          if (constructor) {
            if (child.__constructed__ === undefined) {
              Object.setPrototypeOf(child, constructor.prototype)
              constructor.call(child)
            }
            if (child.attachedCallback && child.__attached__ === false) {
              child.__attached__ = true
              child.attachedCallback()
            }
          }
        }
        childCount = removed.length
        n = -1
        while (++n < removed) {
          child = removed[n]
          if (registry[child.nodeName] && child.detachedCallback && child.__attached__ === true) {
            child.__attached__ = false
            child.detachedCallback()
          }
        }
      } else {
        child = change.target
        if (child.attributeChangedCallback && change.attributeName !== 'style') {
          var newValue = child.getAttribute(change.attributeName)
          if (newValue !== change.oldValue) {
            child.attributeChangedCallback(
              change.attributeName,
              change.oldValue,
              newValue
            )
          }
        }
      }
    }
  }).observe(document, {
    childList: true,
    attributes: true,
    attributeOldValue: true,
    subtree: true
  })
}
