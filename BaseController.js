sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "./callService"], function (Controller, JSONModel, callService) {
    "use strict";

    return Controller.extend("add.base.ui5js.lib.BaseController", {
        callService: callService,
        loadingConnfig: async function (idapp, that) {
            /***********************************************
             *
             * carregamento inicial da aplicação
             *
             ***********************************************/

            let mdt = jQuery.sap.getUriParameters().get("m");
            /***********************************************
             *
             * seta o IDAPP do componente, transferindo por
             * herança para o controller
             *
             ***********************************************/
            this._setAppId();
            /***********************************************
             *
             * 1ª chamada ADDSON para obter dados básicos
             * para carregamento da aplicação
             *
             ***********************************************/
            let oMe = new JSONModel();
            oMe.loadData("me", { app: this.IDAPP }, false);

            if (oMe.getData().uuid) {
                sap.ui.getCore().setModel(
                    new JSONModel({
                        title: oModel.getData().error.name,
                        text: oModel.getData().error.type,
                        enableFormattedText: false,
                        showHeader: true,
                        description: oModel.getData().error.message,
                        icon: error.icon,
                    }),
                    "MessagePage"
                );
                throw oMe.getData().error;
            }

            try {
                sap.ui.getCore().setModel(
                    new JSONModel({
                        ...oMe.getData().content,
                        mandts: oMe.getData().mandts,
                        appls: oMe.getData().appls,
                    }),
                    "userInfo"
                );
            } catch (erro) {
                sap.ui.getCore().setModel(
                    new JSONModel({
                        title: "ApplicationError",
                        text: "ERR_CONNECTION_REFUSED",
                        enableFormattedText: false,
                        showHeader: true,
                        description: "Appication unavailabe",
                        icon: "sap-icon://internet-browser",
                    }),
                    "MessagePage"
                );
                throw erro;
            }

            if (oMe.getData().mandts && oMe.getData().mandts.length === 1 && !mdt)
                /***********************************************
                 *
                 * usuário tem acesso a uma única aplicação e cliente
                 *
                 ***********************************************/
                mdt = oMe.getData().mandts[0];

            if (!mdt) {
                /***********************************************
                 *
                 * pop up solicitando a definição do cliente
                 *
                 ***********************************************/
                this.selectMandt(oMe.getData().mandts);
            } else {
                /***********************************************
                 *
                 * com o cliente definido, seguir em busca de mais
                 * informações da aplicação e usuário
                 ***********************************************/
                let oModel = new JSONModel();

                await oModel
                    .loadData(
                        "add/config",
                        {
                            m: mdt,
                            a: this.IDAPP,
                        },
                        true,
                        "POST"
                    )
                    .catch(error => {
                        if (error.responseText) {
                            error = JSON.parse(error.responseText).error;
                        }
                        sap.ui.getCore().setModel(
                            new JSONModel({
                                title: error.name,
                                text: error.type,
                                enableFormattedText: false,
                                showHeader: true,
                                description: error.message,
                                icon: error.icon,
                            }),
                            "MessagePage"
                        );

                        throw error;
                    });

                sap.ui.getCore().setModel(oModel, "AppConfig");

                if (oModel.getData().uuid) {
                    sap.ui.getCore().setModel(
                        new JSONModel({
                            title: oModel.getData().error.name,
                            text: oModel.getData().error.type,
                            enableFormattedText: false,
                            showHeader: true,
                            description: oModel.getData().error.message,
                            icon: oModel.getData().error.icon,
                        }),
                        "MessagePage"
                    );
                    throw oMe.getData().error;
                }
                /***********************************************
                 *
                 * setar informações básicas para os componentes
                 *
                 ***********************************************/
                this.title = oModel.getData().title;
                this.app = oModel.getData().app;
                this.navigation = oModel.getData().navigation;
                this.mandts = oMe.getData().mandts;
                this.appls = oMe.getData().appls;
                this.user = oMe.getData();
                /***********************************************
                 *
                 * setar o cliente autenticado
                 *
                 ***********************************************/
                if (mdt) oMe.getData().currentMandt = mdt;
                /***********************************************
                 *
                 * setar principal model para informações do usuário
                 *
                 ***********************************************/
                sap.ui.getCore().setModel(oMe, "userInfo");
            }
        },

        async refreshForeignKeyDependency(oEvent, This) {
            /**
             * used in 'selectScreen' mode
             * ref:  add.tax.operation.process.controller.MainView
             * ref: _setForeignKeyDependency
             */
            let fields = This.fieldcat.filter(c => c.FOREIGNKEY);

            if (!fields) return;
            /**
             * stop components
             */
            for (const f of fields) {
                if (f.idUi5)
                    sap.ui.getCore().byId(f.idUi5).setBusy(true);
            }
            /**
             * get id if necessary
             */
            This._setAppId();

            /**
             * permitir troca do ID 
             */
            let FKFIELD = true;

            let params = { params: {} };
            /**
             * parameters prepare
             */


            params.params = this.getSelectScreenFilters(This, FKFIELD);

            /**
             * get new values with foreignKey
             */
            This.Screen.getStruc(
                This.fieldcat.filter(c => c.FOREIGNKEY),
                true,
                params
            )
                .then(res => {
                    res = JSON.parse(res);
                    if (!(res instanceof Array)) res = [res];
                    for (const r of res) {
                        /**
                         * for each new values, update model
                         */
                        if (r.VALUES || r.RFFLD) {
                            if (!r.VALUES) r.VALUES = [];
                            let oModel = new sap.ui.model.json.JSONModel(r.VALUES.filter(e => e.ACTIVE || e.ACTIVE === undefined) || []);
                            This.getView().setModel(oModel, This.IDAPP + r.FIELD + "PARAM");
                        }
                    }
                    for (const f of fields) {
                        /**
                         * release dependecies
                         */
                        if (f.idUi5)
                            sap.ui.getCore().byId(f.idUi5).setBusy(false);
                    }
                })
                .catch(err => {
                    for (const f of fields) {
                        if (f.idUi5)
                            sap.ui.getCore().byId(f.idUi5).setBusy(false);
                    }
                    console.error(err);
                });
        },
        getSelectScreenFilters: function (MainView, FKFIELD) {
            let selectScreen = {};
            /**
             * parameters prepare - screenSelect
             */
            for (const field of MainView.fieldcat) {

                let fld = sap.ui.getCore().byId(field.idUi5 || field.idUi5New);

                if (fld)
                    switch (field.REFTYPE) {
                        case "LB":
                            if (!field.keepName) {
                                selectScreen[field.REFKIND || field.field] =
                                    fld.getSelectedKey();
                                if (selectScreen[field.REFKIND || field.field].length === 0)
                                    selectScreen[field.REFKIND || field.field] = "";
                            } else {
                                selectScreen[field.field] =
                                    fld.getSelectedKey();
                                if (selectScreen[field.field].length === 0)
                                    selectScreen[field.field] = "";
                            }
                            break;
                        case "MC":
                            if (!field.keepName) {
                                selectScreen[field.REFKIND || field.field] = {
                                    $in: fld.getSelectedKeys() || [],
                                };
                                if (selectScreen[field.REFKIND || field.field].$in.length === 0)
                                    selectScreen[field.REFKIND || field.field] = "";
                            } else {
                                selectScreen[field.field] = {
                                    $in: fld.getSelectedKeys() || [],
                                };
                                if (selectScreen[field.field].$in.length === 0)
                                    selectScreen[field.field] = "";
                            }

                            if (field.FKFIELD && selectScreen[field.REFKIND || field.field] && FKFIELD) {
                                //substitui o id pelo código de maior relevancia

                                selectScreen[field.REFKIND || field.field].$in =
                                    selectScreen[field.REFKIND || field.field].$in.map(v => {
                                        v = window?.add?.tax[field.REFKIND || field.field][v] || v;
                                        return v;
                                    })

                            }
                            break;
                        case "DR":
                            if (!fld.getValue()) {
                                selectScreen[field.field] = "";
                                continue;
                            }

                            let from = sap.ui.core.format.DateFormat.getDateInstance({
                                pattern: "yyyyMMdd",
                            }).format(fld.getFrom());

                            let to = sap.ui.core.format.DateFormat.getDateInstance({
                                pattern: "yyyyMMdd",
                            }).format(fld.getTo());

                            selectScreen[field.field] = {
                                $gte: parseInt(from),
                                $lte: parseInt(to),
                            };

                            break;
                        case "CB":
                            selectScreen[field.REFKIND || field.field] = fld.getProperty("selected");
                            break;
                        case "RB":
                            selectScreen[fld.getSelectedButton().getTooltip()] = true;
                            break;
                        default:
                            selectScreen[field.field] = fld.getValue();

                            if (field.DATATYPE === "QUAN")
                                //até termos uma melhor definição
                                selectScreen[field.field] = parseInt(selectScreen[field.field]);
                            break;
                    }
            }
            return selectScreen;
        },
        init() {
            this._setAppId();

            try {
                Object.assign(
                    this,
                    sap.ui
                        .getCore()
                        .getModel("AppConfig")
                        .getData()
                        .components.find(c => c.key === this.IDAPP).cinit
                );
                return;
            } catch (error) {
                return {};
            }
        },

        _setAppId() {
            if (!this.IDAPP) this.IDAPP = this.getView().getViewName().split(".view")[0];

            if (!this.IDAPP) this.IDAPP = Object.keys(window["sap-ui-config"]["resourceroots"])[0];
        },

        getAppId() {
            if (!this.IDAPP) this._setAppId();
            return this.IDAPP;
        },

        dataFormat(dataFromAdson) {
            //substituir por sap.Types
            return (
                dataFromAdson.substring(6, 8) +
                "/" +
                dataFromAdson.substring(4, 6) +
                "/" +
                dataFromAdson.substring(0, 4) +
                " " +
                dataFromAdson.substring(8, 10) +
                ":" +
                dataFromAdson.substring(10, 12) +
                ":" +
                dataFromAdson.substring(12, 14)
            );
        },

        navTo(screen) {
            sap.ui.getCore().byId(this.getOwnerComponent()._sOwnerId.split("-").pop()).getParent().getController().Ui.addMainContent(screen);
        },

        i18n(txt) {
            return this.getView().getModel("i18n").getResourceBundle().getText(txt);
        },

        async setFn(name, view) {
            view ? (view[name] = await this.buildFn(name)) : (this[name] = await this.buildFn(name));
        },

        async getFn(name) {
            if (this[name]) return this[name];

            return await this.buildFn(name);
        },

        async execFn(name) {
            if (!this[name])
                this[name] = await this.getFn(name);
            await this[name](this);
        },

        async buildFn(name) {
            return await this.callService
                .postSync("add", {
                    actionName: "TAXPEXIT.list",
                    params: { fields: ["SOURCE", "ACTIVE"], query: { NEXIT: name } },
                })
                .then(resp => {
                    if (resp) {
                        if (typeof resp === "string") resp = JSON.parse(resp);

                        if (resp.rows.find(e => e.ACTIVE)) {
                            var func = new Function("return " + (this.isBase64.test(resp.rows.find(e => e.ACTIVE).SOURCE) ? window.atob(resp.rows.find(e => e.ACTIVE).SOURCE) : resp.rows.find(e => e.ACTIVE).SOURCE))();
                            return func;
                        } else {
                            if (resp.rows.find(e => !e.ACTIVE)) {
                                return () => console.warn("EXIT_DISABLE", name);
                            } else {
                                return () => console.warn("NOT_IMPLEMENTED", name);
                            }
                        }
                    } else {
                        return () => {
                            console.log(name, "NOT_IMPLEMENTED");
                        };
                    }
                })
                .catch(error => {
                    throw error;
                });
        },

        selectMandt(mandts) {
            sap.ui.core.BusyIndicator.hide();

            const fnDoSearch = function (oEvent, bProductSearch) {
                var aFilters = [],
                    sSearchValue = oEvent.getParameter("value"),
                    itemsBinding = oEvent.getParameter("itemsBinding");

                // create the local filter to apply
                if (sSearchValue !== undefined && sSearchValue.length > 0) {
                    aFilters.push(new sap.ui.model.Filter("mandt", sap.ui.model.FilterOperator.Contains, sSearchValue));
                }
                // apply the filter to the bound items, and the Select Dialog will update
                itemsBinding.filter(aFilters);
            };

            var template = new sap.m.StandardListItem({
                title: "{mandt}",
                //description: "{mandt}",
                icon: "sap-icon://building",
                type: "Active",
            });

            let popUp = new sap.m.SelectDialog({
                contentHeight: "25%",
                title: "{i18n>selectCorporation}",
                search: fnDoSearch,
                liveChange: fnDoSearch,
            });

            const mdts = {
                CORPORATIONS: mandts.map(m => {
                    return { mandt: m };
                }),
            };

            popUp.setModel(new sap.ui.model.json.JSONModel(mdts));
            popUp.bindAggregation("items", "/CORPORATIONS", template);

            // attach close listener
            popUp.attachConfirm(function (oEvent) {
                var selectedItem = oEvent.getParameter("selectedItem");
                if (selectedItem) {
                    window.open(window.location.href + "?m=" + selectedItem.getTitle(), "_parent");
                }
            });

            popUp.attachCancel(function (oEvent) {
                window.open(window.location.href + "?m=" + mandts[0], "_parent");
            });

            this.getView().addContent(popUp);

            popUp.open();
        },
        b64toBlob: function (content, contentType) {
            contentType = contentType || '';
            const sliceSize = 512;
            const byteCharacters = window.atob(content.replace(new RegExp("&#13;  ", "g"), ""));
            const byteArrays = [];
            for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                const slice = byteCharacters.slice(offset, offset + sliceSize);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            const blob = new Blob(byteArrays, {
                type: contentType
            });
            return blob;
        },
        DatetFromAddson: model => {
            return new sap.m.ObjectStatus({
                text: {
                    path: model,
                    type: "sap.ui.model.type.Date",
                    formatOptions: {
                        source: {
                            pattern: "yyyyMMddTHHmmss",
                        },
                        pattern: "dd/MM/yyyy HH:mm:ss",
                    },
                    formatter: data => {
                        return data;
                    },
                },
            });
        },
        populate: line => {
            if (!line) return;

            if (!line.CurrencyCode)
                line.CurrencyCode = 'BRL'; //TODO - prever esse dado nas configurações do processo

            if (line.PROCX) {
                const procx = sap.ui
                    .getCore()
                    .getModel("TAXP0100")
                    .getData()
                    .find(s => (s.id === line.PROCX || s.PROCX === line.PROCX));
                if (procx) {
                    line.DPROCX = procx.DESCR;
                    line.PROCX = procx.PROCX;
                    line.idPROCX = procx.id;
                    line.PROCM = procx.PROCM || procx.PROCX;
                }
            }
            if (line.STATU && !line.DSTATU) {
                const stp = sap.ui
                    .getCore()
                    .getModel("TAXP0112")
                    .getData()
                    .find(s => s.STATU === line.STATU && s.PROCP === line.idPROCX);
                if (stp) {
                    line.DSTATU = stp.DESCR;
                    line.TPMSG = stp.TPMSG;
                    line.ICONS = stp.ICON;
                } else {

                    const st = sap.ui
                        .getCore()
                        .getModel("TAXP0104")
                        .getData()
                        .find(s => s.STATU === line.STATU);
                    if (st) {
                        line.DSTATU = st.DESCR;
                        line.TPMSG = st.TPMSG;
                        line.ICONS = st.ICON;
                    }
                }
            }

            if (line.COMPANY) {
                const crm = sap.ui
                    .getCore()
                    .getModel("CRM0000")
                    .getData()
                    .find(s => s.id === line.COMPANY);
                if (crm) {
                    line.DCOMPANY = crm.NAME1;
                }
            }

            if (line.DOMIN) {
                const domin = sap.ui
                    .getCore()
                    .getModel("TAXP0500")
                    .getData()
                    .find(s => (s.DOMIN === line.DOMIN) || (s.id === line.DOMIN));
                if (domin) {
                    line.DDOMIN = domin.DESCR;
                    line.SCHEM = domin.SCHEM;
                }
            }

            if (line.ATIVI) {

                if (line.ATIVI === 10) {
                    line.ATIVI = 100; //TODO TMP
                }
                const ativi = sap.ui
                    .getCore()
                    .getModel("TAXP0102")
                    .getData()
                    .find(s => (s.P0100.id === line.PROCX || s.P0100.PROCX === line.PROCX) && (s.ATIVI === line.ATIVI));
                if (ativi) {
                    line.DATIVI = line.ATIVI + ":" + ativi.DESCR;
                }
            }
            //return line;
        },
        populateCode: (line, field) => {
            return;

            if (!field) {
                if (line.COMPANY) {
                    const crm = sap.ui
                        .getCore()
                        .getModel("CRM0000")
                        .getData()
                        .find(s => s.id === line.COMPANY);
                    if (crm) {
                        line.idCOMPANY = crm.id;
                        line.COMPANY = crm.NAME1;
                    }
                }

                if (line.PROCX) {
                    line.CPROCX = line.PROCX;
                    const procx = sap.ui
                        .getCore()
                        .getModel("TAXP0100")
                        .getData()
                        .find(s => s.id === line.PROCX);
                    if (procx) {
                        line.idPROCX = procx.id;
                        line.PROCX = procx.PROCX;
                    }
                }
                if (line.DOMIN) {
                    const domin = sap.ui
                        .getCore()
                        .getModel("TAXP0500")
                        .getData()
                        .find(s => s.id === line.DOMIN);
                    if (domin) {
                        line.idDOMIN = domin.id
                        line.DOMIN = domin.DESCR;
                    }
                }
                return;
            }

            switch (field) {
                case 'COMPANY':
                    if (line.COMPANY) {
                        const crm = sap.ui
                            .getCore()
                            .getModel("CRM0000")
                            .getData()
                            .find(s => s.id === line.COMPANY);
                        if (crm) {
                            line.COMPANY = crm.NAME1;
                        }
                    }
                    return;

                default:
                    return;
            }
        },
        ICON_ACTIVE: "sap-icon://message-success",
        ICON_ERROR: "sap-icon://message-error",
        ICON_STATUS: "sap-icon://multiselect-all",
        ICON_CLOSE: "sap-icon://decline",
        ICON_PLAN: "sap-icon://date-time",
        ICON_PDF: "sap-icon://pdf-attachment",
        ICON_XML: "sap-icon://pdf-attachmen",
        ICON_TXT: "sap-icon://attachment-text-file",
        ICON_IMG: "sap-icon://background",
        ICON_LINK: "sap-icon://chain-link",
        STATE_W: sap.ui.core.ValueState.Warning,
        STATE_S: sap.ui.core.ValueState.Success,
        STATE_N: sap.ui.core.ValueState.None,
        STATE_I: sap.ui.core.ValueState.Information,
        STATE_E: sap.ui.core.ValueState.Error,
        Model: sap.ui.model.json.JSONModel,
        Date: sap.ui.model.type.Date,
        Time: sap.ui.model.type.Time,

        formatCurrency: (value) => {

            var oFloatNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                maxFractionDigits: 2,
                minFractionDigits: 2,
                groupingEnabled: true
            }, sap.ui.getCore().getConfiguration().getLocale());

            return oFloatNumberFormat.format(value);

        },
        isBase64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
    });
});
