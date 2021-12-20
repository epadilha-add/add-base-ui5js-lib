sap.ui.define([
    "sap/ui/base/Object",
    "./ScreenFactory",

], function (Object, ScreenFactory) {
    "use strict";

    let That = null;

    return Object.extend("add.usrm.MainContent", {

        constructor: function (that) {
            That = that;
            return this.getFirstPage();
        },

        getFirstPage: function () {

            let key = sap.ui.getCore().getModel("AppConfig").getData().navigation[0].key;

            return new ScreenFactory(That).create({
                name: key,
                key: key
            })

        }
    })
});