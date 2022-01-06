sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "./callService"
], function (Controller, JSONModel, callService) {
    "use strict";

    return Controller.extend("add.home.app.component.BaseController", {
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
            oMe.loadData("me", null, false);

            if (oMe.getData().uuid) {
                sap.ui.getCore().setModel(new JSONModel({
                    title: oModel.getData().error.name,
                    text: oModel.getData().error.type,
                    enableFormattedText: false,
                    showHeader: true,
                    description: oModel.getData().error.message,
                    icon: error.icon
                }), "MessagePage"); throw oMe.getData().error;
            }

            try {
                sap.ui.getCore().setModel(new JSONModel(
                    {
                        ...oMe.getData().content,
                        mandts: oMe.getData().mandts,
                        appls: oMe.getData().appls
                    }), "userInfo");
            } catch (erro) {
                sap.ui.getCore().setModel(new JSONModel({
                    title: 'ApplicationError',
                    text: 'ERR_CONNECTION_REFUSED',
                    enableFormattedText: false,
                    showHeader: true,
                    description: 'Appication unavailabe',
                    icon: "sap-icon://internet-browser"
                }), "MessagePage"); throw erro;
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

                await oModel.loadData("add/config",
                    {
                        m: mdt,
                        a: this.IDAPP
                    }, true, "POST")
                    .catch(error => {

                        if (error.responseText) {
                            error = JSON.parse(error.responseText).error;
                        }
                        sap.ui.getCore().setModel(new JSONModel({
                            title: error.name,
                            text: error.type,
                            enableFormattedText: false,
                            showHeader: true,
                            description: error.message,
                            icon: error.icon
                        }), "MessagePage");

                        throw error;
                    });

                sap.ui.getCore().setModel(oModel, "AppConfig");

                if (oModel.getData().uuid) {
                    sap.ui.getCore().setModel(new JSONModel({
                        title: oModel.getData().error.name,
                        text: oModel.getData().error.type,
                        enableFormattedText: false,
                        showHeader: true,
                        description: oModel.getData().error.message,
                        icon: oModel.getData().error.icon
                    }), "MessagePage");; throw oMe.getData().error;
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
                if (mdt)
                    oMe.getData().currentMandt = mdt;
                /***********************************************
                 * 
                 * setar principal model para informações do usuário
                 *  
                 ***********************************************/
                sap.ui.getCore().setModel(oMe, "userInfo");

            }
        },

        init() {

            this._setAppId();

            try {
                Object.assign(this, sap.ui.getCore()
                    .getModel("AppConfig")
                    .getData()
                    .components.find(c => c.key === this.IDAPP).cinit)
                return
            } catch (error) {
                return {}
            }
        },

        _setAppId() {
            if (!this.IDAPP)
                this.IDAPP = this.getView().getViewName().split('.view')[0];
        },

        getAppId() {
            if (!this.IDAPP)
                this._setAppId();
            return this.IDAPP;
        },


        dataFormat(dataFromAdson) {
            return dataFromAdson.substring(6, 8) + "/" +
                dataFromAdson.substring(4, 6) + "/" +
                dataFromAdson.substring(0, 4) + " " +
                dataFromAdson.substring(8, 10) + ":" +
                dataFromAdson.substring(10, 12) + ":" +
                dataFromAdson.substring(12, 14);
        },

        navTo(screen) {

            sap.ui.getCore().byId(this.getOwnerComponent()._sOwnerId.split('-').pop())
                .getParent()
                .getController()
                .Ui.addMainContent(screen);
        },
        i18n(txt) {
            return this.getView().getModel("i18n").getResourceBundle().getText(txt);
        },
        selectMandt(mandts) {

            sap.ui.core.BusyIndicator.hide();

            const fnDoSearch = function (oEvent, bProductSearch) {
                var aFilters = [],
                    sSearchValue = oEvent.getParameter("value"),
                    itemsBinding = oEvent.getParameter("itemsBinding");

                // create the local filter to apply
                if (sSearchValue !== undefined && sSearchValue.length > 0) {
                    aFilters.push(new sap.ui.model.Filter(("m"), sap.ui.model.FilterOperator.Contains, sSearchValue));
                }
                // apply the filter to the bound items, and the Select Dialog will update
                itemsBinding.filter(aFilters, "Application");
            };

            var template = new sap.m.StandardListItem({
                title: "{mandt}",
                //description: "{mandt}",
                icon: "sap-icon://building",
                type: "Active"
            });

            let popUp = new sap.m.SelectDialog({
                contentHeight: "25%",
                title: '{i18n>selectCorporation}',
                search: fnDoSearch,
                liveChange: fnDoSearch
            })

            const mdts = {
                CORPORATIONS: mandts.map(m => { return { mandt: m } })
            }

            popUp.setModel(new sap.ui.model.json.JSONModel(mdts));
            popUp.bindAggregation("items", "/CORPORATIONS", template);

            // attach close listener
            popUp.attachConfirm(function (oEvent) {
                var selectedItem = oEvent.getParameter("selectedItem");
                if (selectedItem) {
                    window.open(window.location.href + "?m=" + selectedItem.getTitle(), "_parent");
                }
            })

            popUp.attachCancel(function (oEvent) {
                window.open(window.location.href + "?m=" + mandts[0], "_parent");
            })

            this.getView().addContent(popUp);

            popUp.open();

        }
    })
});