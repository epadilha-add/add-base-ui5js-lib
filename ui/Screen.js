sap.ui.define([
    "./i/SelectScreen", "./List", "../commons/AddModels", "../callService",
    "sap/ui/model/json/JSONModel", "sap/m/OverflowToolbar", "sap/m/MessageToast"
], function (SelectScreen, List, AddModels, callService, JSONModel, OverflowToolbar, MessageToast) {
    "use strict";
    var result = null;
    var This;
    /******************************************************************************************
     * Addvisor Solutions
     * Classe desenvolvida para implemetações de relatórios baseado em uma tela de seleção e a
     * apresentação dos dados em um grid
     * 
     * A implementação deve ser feita, preferencialmente no controler da principal view
     * 
     * Exemplos:
     * let screx = add.ui.Screen.extend("add.custom.Screen", { 
     *     
     *     <novoMetodo>,
     * 
     *     <metodoReescrito>
     *     
     *     renderer: {} <-- obrigatório
     * 
     * });
     * 
     * let scr = new screx().factory(this, 'add-core-rm-app', parameters);
     * sap.m.Page({content: scr}).placeAt();
     *******************************************************************************************/

    return sap.m.NavContainer.extend("add.ui.Screen", {

        IDAPP: null,
        that: null,
        fields: null,
        screen: null,
        models: null,
        toolbar: null,
        events: null,
        list: null,
        customButtons: null,
        This: null,
        factory: function (that, id, parameters) {

            this.IDAPP = id;

            this.that = that;

            this.list = (parameters.list) ? new parameters.list(this) : null;

            this.customButtons = parameters.customButtons;

            this.fields = parameters.selectScreenFields || this._getFields();

            this.footer = (that.notification) ? new OverflowToolbar({ content: that.notification }) : new OverflowToolbar({})

            this.toolbar = new OverflowToolbar();

            this.screen = new SelectScreen(this);

            this.models = AddModels;

            this.route = parameters.route;

            this.models.constructor(that, this.IDAPP);

            this._startModel();

            this.This = This = this;

            this._create(this.IDAPP);

            return this;

        },
        renderer: {},

        _startModel() {
            this.models.model("FILTERS").setModel(new JSONModel({}));
        },
        _getFields() {

            //examples

            return [{
                field: "BUKRS",
            },
            {
                field: "branchEmbedded", prop: { obligatory: false }
            },
            {
                field: "DTPRC", prop: { obligatory: true }
            },
            {
                field: "DOMIN", prop: { obligatory: false }
            },
            {
                field: "IDEME", prop: { obligatory: false }
            },
            {
                field: "SENDE", prop: { obligatory: false }
            },
            {
                field: "RECEI", prop: { obligatory: false }
            }];

        },

        handleSelectionChangeBUKRS(oEvent) {

            alert("handleSelectionChangeBUKRS");

        },
        _create: function (id) {

            this.addPage(
                this.screen.create(id, {
                    toolbar: this._getToolBar(),
                    footer: this.getFooter()
                }));

            this._getElments();

        },
        _getToolBar: function () {

            let buttons = [];

            buttons = this.screen.getDefaultToolBarButtons({ saveScreen: false, scheduler: true });

            if (this.customButtons)
                buttons.concat(this.customButtons); //[]

            for (const button of buttons) {
                this.toolbar.addContent(button);
            }

            return this.toolbar;

        },
        _getElments: async function () {

            await this.screen.elements.set(this.fields, this.screen);

        },
        getFooter: function () {

            return new sap.m.OverflowToolbar({
                content: [
                    new sap.m.Button({ text: "footer" })
                ]
            });

        },
        refresh: async function (oEvent) {

            This.list.table.setBusy(true);

            let model = new sap.ui.model.json.JSONModel(await This.getData());
            This.models.model("LIST").setModel(model);

            This.list.table.setModel(model);

            This.list.table.setBusy(false);

        },
        execute: async function (oEvent) {

            if (This.screen.elements.obligatoryFieldsValidation(This) === false) {
                return;
            };

            This.toolbar.setBlocked(true);

            let componentID = This.componentID = oEvent
                .getSource() //Button
                .getParent() //ToolBar
                .getParent() //Form
                .getParent() //Component
                .getId();

            try {

                sap.ui.getCore().byId(componentID).setBusy(true);

                let list = {};

                try {

                    list = await This.getData();

                    if (list && list instanceof Array && list.length == 0) {
                        MessageToast.show(AddModels.getI18n("dataNotFound"));
                        This.toolbar.setBlocked(false);
                        sap.ui.getCore().byId(componentID).setBusy(false);
                        return;
                    } else if (!list.length) {
                        throw list;
                    }

                } catch {
                    MessageToast.show(AddModels.getI18n("serverError"));
                    return;
                }

                if (!This.list) {

                    try {
                        This.list = (This.list) ? new This.list() : new List(This);
                        result = This.list.buildTable(function () { This.back() }, list);
                        This.addPage(result);
                    } catch (error) {
                        This.list = undefined;
                        MessageToast.show(AddModels.getI18n("serverError"))
                    }

                } else {
                    This.models.model("LIST").setModel(list);
                    This.list.table.setModel(This.models.model("LIST").getModel());
                }

                This.to(result);

                This.toolbar.setBlocked(false);
                sap.ui.getCore().byId(componentID).setBusy(false);

            } finally {

                This.toolbar.setBlocked(false);
                This.toolbar.setBusy(false);
                sap.ui.getCore().byId(componentID).setBusy(false);
            }

        },

        _requestPrepare(method) {

            let req = {};

            req.FILTERS = this.models.model("FILTERS").getModel().getProperty('/');
            req.STRUC = this.models.model("PARAM").getModel().getProperty('/');
            req.IDAPP = this.models.IDAPP;

            callService.setHeaders({
                "Content-Type": "application/json",
                "Accept": this.models.IDAPP + ":" + method
            })

            return req;

        },
        getData: async function getData() {

            let req = this._requestPrepare("start");

            let resp = [];

            resp = JSON.parse(await callService.postSync('add/', req));

            if (!this.STRUC && resp && !resp.stop) {
                /****************************************************************
                 * Estrutura ainda não definida
                 * 
                 ****************************************************************/
                let fields = [];
                for (const key in resp[0]) {
                    fields.push(key);
                }

                if (fields.length > 0) {
                    let getValueHelp = false;
                    /****************************************************************
                     * produto que irá obter propriedades de todas as colunas do grid
                     * 
                     ****************************************************************/
                    let list = JSON.parse(await this.screen.elements.getStruc(fields, getValueHelp));
                    let selectionScreen = [];

                    for (const iterator of list) {
                        iterator.P600A.FIELDNAME = this.models.IDAPP + iterator.CAMPO;
                        selectionScreen.push(iterator.P600A);
                    }

                    selectionScreen.sort((a, b) => {
                        if (a.FIELDNAME === undefined) {
                            return 0
                        }
                        if (b.FIELDNAME === undefined) {
                            return -1
                        }
                        return a.FIELDNAME - b.FIELDNAME
                    });

                    //elimina duplicidade
                    selectionScreen = selectionScreen.filter((item, pos, ary) => { return !pos || item.FIELDNAME != ary[pos - 1].FIELDNAME });

                    this.STRUC = selectionScreen;
                }

            }

            return resp;
        },

        saveScreen: function (oEvent) {
            if (This.screen.elements.obligatoryFieldsValidation(This) === false) {
                return;
            };
            This.screen.openDialogToSave(oEvent);

        },
        navToList: function () {
            This.to(This._hist);
        },
        selectVariables: function (oEvent) {

            This.screen.onLoadFilterVariantPress(This.screen.that);

        },
        scheduler: async function (oEvent) {

            if (This.screen.elements.obligatoryFieldsValidation(This) === false) {
                return;
            };

            This.toolbar.setBlocked(true);

            let componentID = This.componentID = oEvent
                .getSource() //Button
                .getParent() //ToolBar
                .getParent() //Form
                .getParent() //Component
                .getId();

            try {

                sap.ui.getCore().byId(componentID).setBusy(true);

                let req = This._requestPrepare("startPlan");

                MessageToast.show(AddModels.getI18n(await callService.postSync('add/', req)));

                // This.to(result);

                This.toolbar.setBlocked(false);
                sap.ui.getCore().byId(componentID).setBusy(false);

            } finally {

                This.toolbar.setBlocked(false);
                This.toolbar.setBusy(false);
                sap.ui.getCore().byId(componentID).setBusy(false);
            }

        },
        close: function () {

            return new Promise((resolve, reject) => {

                //That.getView().destroy();
                //check if saved for example
                resolve("OK");

            })
        }
    })
});