# custom-elements
Partial shim of the latest [custom elements](https://w3c.github.io/webcomponents/spec/custom) spec draft.

Work in progress. Targets ES5 runtimes - specifically requires `MutationObserver` and `Object.setPrototypeOf`. `is` attribute not currently supported. As far as I can tell, constructors cannot be made newable so to instantiate them from script use `document.createElement('my-element-name')`.

Inspired by Andrea Giammarchi's excellent [document-register-element](https://github.com/WebReflection/document-register-element), which shims the custom elements implementation already shipping in some browsers today.

## License
Public domain
