sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageToast"], function (Add, MessageToast) {
        "use strict";

        var That = null;
        var Screens = [];
        var nameObject = 'ScreenFactory.js';

        return Add.extend("add.tax.ui.ScreenFactory", {

            constructor: function (that) {
                That = that;
                //Add.call(this);
            },
            create(screen) {
                /*************************************************************************
                 * Obtem possíveis configurações de componentes para 
                *   { components: [{name,key,path}]}
                * 
                 *************************************************************************/
                let s = null;
                let lSc = null;

                s = Screens.find((e) => {
                    if (e.name == screen.key) return s;
                });

                if (!s) {

                    try {

                        let component = sap.ui.getCore().getModel("AppConfig").getData().components.find((c => {
                            if (c.key == screen.key) return c;
                        }))

                        if (component) {

                            jQuery.sap.registerModulePath(component.name, component.path);

                            lSc = new sap.ui.core.ComponentContainer(
                                {
                                    name: component.name,
                                    manifest: component.path + '/manifest.json'
                                })

                        } else {
                            lSc = this._defaultPage(screen.key + ":" + screen.name);
                        }

                        s = { screen: lSc, name: screen.key };

                        Screens.push(s);

                    } catch (err) {
                        let m = 'Erro Method .Constructor() or Not Implemented ' + screen.key + " " + err.toString();
                        lSc = this._defaultPage(m);

                    }

                } else {
                    lSc = this._defaultPage(screen.key + ":" + screen.name);
                }

                return s.screen;

            },
            close(screen) {

                try {

                    return sap.ui.getCore().byId("add.core." + screen.key + ".btCloseIfComponent")
                        .firePress()
                        .mEventRegistry
                        .press[0]
                        .fFunction();

                } catch (err) {
                    let m = 'Erro Method .close() or Not Implemented ' + screen.key + " " + err.toString();
                    this.Log.error(m);
                }
            },
            _defaultPage(desc) {

                return new sap.m.MessagePage(
                    {
                        text: "Não disponível",
                        enableFormattedText: true,
                        description: desc || "Welcome DEV",
                        icon: "sap-icon://home"
                    })
            }
        });
    });