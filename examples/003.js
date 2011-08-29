(function (doc, test) {

    var square = doc.createElement("div"),
        i = 1, j = 1, k = 1, on = true;

    function init () {
        doc.body.appendChild(square);
        square.id = "square3";
        square.className = "red";
    }
   
    function change(prop, val) {
        return function (elt) {
            return on ? Zanimo.transition(elt, prop, val, 1000, "ease-in-out") : null;
        };
    }

    function go(elt, prop, start, end, counter) {
        Zanimo(elt).then(change(prop, start), test.rejectAndlog("failing in the 1 step"))
                   .then(change(prop, end),   test.rejectAndlog("failing in the 2 step"))
                   .then(nextStep(prop, start, end, counter), test.fail("Oups : "));
    }

    function nextStep(prop, start, end, counter) {
        return function (elt) {
            counter++;
            test.log("Starting the " + counter + " iteration with prop. '" + prop + "'");
            return go(elt, prop, start, end, counter);
        }
    }

    function run () {
        on = true;
        go(square, "width", "300px", "100px", i);
        go(square, "height", "300px", "100px", j);
        go(square, "background-color", "green", "red", k);
    }

    function clean () {
        doc.body.removeChild(square);
    }

    function reset() {
        on = false;
        square.style.cssText = " ";
    }

    test.add(
        "simple-loops",
        "Simple loop",
        "A stupid simple recursive loop...",
        "003.js",
        init,
        run,
        clean,
        reset
    );

}(window.document, window.Test));
