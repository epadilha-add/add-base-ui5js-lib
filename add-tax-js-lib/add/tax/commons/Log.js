sap.ui.define([], function () {
    "use strict";

    return {

        /**
         * general Logs.
         * @public
         * @returns {add.core.Log} logger
         */
        catchLog: function (parameters) {

            sap.m.MessageBox.error("Error :\n\n" + parameters);
            throw new TypeError(parameters)
        }

    };

});