// Zanimo.js - Promise based CSS3 transitions
// (c) 2011-2014 Paul Panserrieu

'use strict';

var prefix = require('vendor-prefix'),
    normalizeTransformValue = require('../src/normalize-transform-value'),
    shorthand = require('../src/transition-shorthand-property'),
    transition = prefix('transition'),
    transitionend = 'WebkitTransition' in document.body.style ? 'webkitTransitionEnd' : 'transitionend',

    isDOM = function (el) {
        try {
            return el && el.nodeType;
        } catch(err) {
            return false;
        }
    },

    addTransition = function (elt, attr, value, duration, easing) {
        var currentValue = elt.style[transition];
        attr = prefix.dash(attr);
        if (currentValue) {
            elt.style[transition] = currentValue + ', ' + shorthand(attr, duration, easing);
        }
        else {
            elt.style[transition] = shorthand(attr, duration, easing);
        }
        elt.style[prefix(attr)] = value;
    },

    removeTransition = function (el, attr) {
        el.style[transition] = el.style[transition]
            .split(',').filter(function(t) {
                return !t.match(attr);
            }).join(',');
    },

    applycss = function (el, attr, value) {
        requestAnimationFrame(function(){
            el.style[prefix.dash(attr)] = value;
        });
        return Promise(el);
    },

    css = function (el, attr, value) {
        if(el._zanimo && el._zanimo.hasOwnProperty(attr)) {
            console.warn(
                'Zanimo transition with transform=' +
                el._zanimo[attr].value +
                ' stopped by transform=' + value
            );
        }
        return applycss(el, attr, value);
    },

    animate = function (el, attr, value, duration, easing) {
        var prefixed = prefix.dash(attr),
            timeout;

        var promise = new Promise(function(resolve, reject) {

            function cbTransitionend(evt) {
                if(prefix(evt.propertyName) === prefix(prefixed)) {
                    cb(true);
                    resolve(el);
                }
            }

            function cb(clear) {
                if (timeout) { clearTimeout(timeout); timeout = null; }
                removeTransition(el, attr);
                el.removeEventListener(transitionend, cbTransitionend);
                if (clear) { delete el._zanimo[attr]; }
            }

            el.addEventListener(transitionend, cbTransitionend);

            requestAnimationFrame(function () {
                addTransition(el, attr, normalizeTransformValue(value), duration, easing);
                timeout = setTimeout(function () {
                    var rawVal = el.style.getPropertyValue(prefixed),
                    domVal = normalizeTransformValue(rawVal),
                    givenVal = normalizeTransformValue(value);

                    cb(true);
                    if (domVal === givenVal) { resolve(el); }
                    else {
                        console.warn(new Error('Zanimo transition: with '
                            + attr + ' = ' + givenVal + ', DOM value=' + domVal
                        );
                    }
                }, duration + 20 );

                el._zanimo = el._zanimo || { };
                if(el._zanimo[attr]) {
                    console.warn(
                        'Zanimo transition with ' +
                            attr + '=' + el._zanimo[attr].value +
                            ' stopped by transition with ' + attr + '=' + value
                    );
                }
                el._zanimo[attr] = {value: value};
            });
        });

        return promise;
    };

/**
 * Zanimo(el | promise[el])
 * > Returns a Promise of el.
 *
 * Zanimo(el | promise[el], attr, value)
 * > Sets el.style[attr]=value and returns the promise of el.
 *
 * Zanimo(el | promise[el], attr, value, duration, [easing])
 * > Performs a transition.
 */
var Zanimo = function (el, attr, value, duration, easing) {
    var args = arguments,
        arity = arguments.length;
    if (arity === 0 || arity === 2 || arity > 5) {
        return Promise.reject(new Error('Zanimo invalid arguments'));
    }
    if (el instanceof Promise) {
        return el.then(function (val) {
            return Zanimo.apply(this, [val].concat(Array.prototype.slice.call(args, 1)));
        });
    }
    if (!isDOM(el)) {
        return Promise.reject(new Error('Zanimo require an HTMLElement, or a promise of an HTMLElement'));
    }
    if (arity === 1) {
        return Promise(el);
    }
    try {
        prefix.dash(attr);
    } catch(err) {
        return Promise.reject(new Error('Zanimo transition: ' + attr + ' is not supported!'));
    }
    if (arity === 3) {
        return css(el, attr, value);
    }
    if(window.isNaN(parseInt(duration, 10))) {
        return Promise.reject(new Error('Zanimo transition: duration must be an integer!'));
    }
    return animate(el, attr, value, duration, easing);
};

/**
 * A function wrapping `Zanimo(el, ...)` as a `f(...)(el)` for easy chaining purpose.
 */
Zanimo.f = function () {
    var args = Array.prototype.slice.call(arguments);
    return function (el) {
        return Zanimo.apply(this, [el].concat(args));
    };
};

module.exports = Zanimo;
