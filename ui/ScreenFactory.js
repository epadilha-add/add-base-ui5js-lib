sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageToast"], function (Add, MessageToast) {
        "use strict";

        var That = null;
        var Screens = [];
        var nameObject = 'ScreenFactory.js';

        return Add.extend("add.ui.ScreenFactory", {

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

                s = Screens.find(e => e.name === screen.key);

                if (true) {

                    try {

                        let component = sap.ui.getCore().getModel("AppConfig").getData().components.find((c => {
                            if (c.key == screen.key || c.name == screen.name || c.name === screen || c.key === screen) return c;
                        }))
                        //debugger;
                        if (component) {


                            var oComp = sap.ui.getCore().createComponent({
                                name: component.name,
                                id: screen.idapp + '-' + component.name,
                                autoPrefixId: false,
                                propagateModel: false,
                                url: component.path || '../components/' + component.name + '/webapp'
                            });

                            lSc = new sap.ui.core.ComponentContainer({
                                async: component.async || screen.async || true,
                                propagateModel: false,
                                component: oComp
                            });

                            /*   lSc = new sap.ui.core.ComponentContainer(
                                  {
                                      id: That.IDAPP + '-' + component.name,
                                      name: component.name,
                                      //manifestFirst: true,
                                      manifest: true,//component.path + '/manifest.json',
                                      autoPrefixId: true,
                                      async: component.async || screen.async || true,
                                      url: component.path || '../components/' + component.name + '/webapp',
                                      componentCreated: (oCom) => {
                                          debugger;

                                      }
                                      //settings: { tooltip: That.IDAPP }
                                  }) */
                            // })

                        } else {
                            lSc = this._defaultPage(screen.key + ":" + screen.name);
                        }

                        // if (!lSc.getManifest()) throw new TypeError();

                    } catch (err) {
                        let m = screen.name + ' Not Implemented - ADD-APPM ';
                        lSc = this._defaultPage(m, screen);

                    }

                } else {
                    return s.screen;//this._defaultPage(screen.key + ":" + screen.name);
                }

                Object.assign(lSc, That);

                s = { screen: lSc, name: screen.key };

                Screens.push(s);

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
            _defaultPage(desc, screen) {

                sap.ui.core.BusyIndicator.hide();
                let msg = {};
                switch (screen.name || screen.key) {
                    case 'infosys':

                        msg = new sap.ui.core.HTML({
                            preferDOM: true,
                            sanitizeContent: false,
                            content: "<iframe height='100%' width='100%' src='/status'></iframe>"
                        })

                        return msg;
                        break;

                    default:
                        msg = new sap.m.MessagePage(
                            {
                                showHeader: false,
                                text: "Aplicação não disponível",
                                enableFormattedText: true,
                                description: desc || "Welcome DEV",
                                icon: "sap-icon://message-error"
                            })
                        break;
                }


                try {
                    That.getView().addContent(msg);
                } catch {

                }
                return msg;
            }
        });
    });