"use strict";
sap.ui.define(
    [
        "../BaseController",
        'sap/ui/model/Filter',
        'sap/ui/model/FilterOperator',
        "sap/m/MessageToast",
        "../ui/ScreenElements",
        "../ui/ScreenFactory",
        './View'
    ], function (Controller, Filter, FilterOperator, MessageToast, ScreenElements, ScreenFactory) {


        let dialog = {};
        let table = {};
        let MainView = {};
        let componentHistory = "add.modification.history";
        let promises = [];
        let sections = [];
        return Controller.extend("add.ui.crud.MainView", {

            constructor: function (that) {

                sap.ui.core.BusyIndicator.hide();

                debugger;


                MainView = Object.assign(this, that);
                /**
                 * inicialização do contexto
                 */
                MainView.initContext();
                /**
                 * setModel em ToolPage - addMainContent
                 */
                try {
                    MainView.rootComponent = sap.ui.getCore().getModel("rootComponent").getData().root;
                } catch {
                    MainView.rootComponent = MainView.IDAPP;
                }

                if (!MainView.title)
                    MainView.title = MainView.getView().getModel("i18n").getResourceBundle().getText("title");

                MainView.getView().setBusyIndicatorDelay(50);

                MainView.foreignKeysCheck();

                MainView.callParams = {
                    m: sap.ui.getCore().getModel("userInfo").getData().currentMandt,
                    a: Object.keys(window["sap-ui-config"]["resourceroots"])[0]
                }

                /**
                 * verifica e habilita edição ou não
                 */
                MainView.context = MainView.context.map((e) => {
                    var res = {};
                    if (!e.field) {
                        e = { field: e };
                    }
                    res = e;
                    if (MainView.edit === false) res.create = false;
                    return res;
                });

                let firstPage = MainView.getMainLayout();

                MainView.mainContent = new sap.m.NavContainer({
                    pages: [firstPage],
                    initialPage: firstPage
                })

                MainView.getView().byId(MainView.IDAPP).addPage(

                    MainView.mainContent
                );

                if (MainView.components && MainView.components.length > 0) {
                    MainView.appendComponent(MainView.components);
                }

                if (MainView.history === true || MainView.history === undefined) {
                    MainView.appendComponent([
                        {
                            foreignKey: "KEY",
                            idapp: componentHistory,
                            title: "{i18n>history}",
                            index: 0,
                            edit: false,
                            parent: MainView.IDAPP,
                            embedded: true
                        }]);
                }
            },
            list: function () {

                if (this.mockList) return new Promise((r) => r(this.getMokList()));

                MainView.getView().setBusy(true);

                let rows = [];
                var data = {};
                //let model = sap.ui.getCore().getModel("foreignKey" + MainView.rootComponent);
                let params = {
                    "method": "POST",
                    "actionName": (MainView.service) ? MainView.collection + "." + MainView.service : MainView.collection + ".list",
                    "params": {
                        "pageSize": (MainView.pageSize) ? MainView.pageSize : 100,
                    }, ...MainView.callParams

                }

                if (MainView.foreignKeys && MainView.foreignKeys instanceof Array) {
                    let query = {};

                    for (const item of MainView.foreignKeys) {
                        if (item.idapp !== MainView.IDAPP) continue;
                        for (const key in item) {
                            query[key] = item[key];
                        }
                    }
                    delete query.idapp;
                    delete query.index;
                    delete query.title;
                    delete query.content;
                    delete query.context;
                    delete query.parent;

                    //params.params = {};
                    params.params.query = {};
                    params.params.query = query;

                } else if (MainView.foreignKeys) {

                    //params.params = {};
                    let pars = { ...MainView.foreignKeys };
                    delete pars.idapp;
                    delete pars.index;
                    delete pars.title;
                    delete pars.content;
                    delete pars.context;
                    delete pars.parent;
                    params.params = { query: pars };
                }

                MainView.logInfo(params);

                return MainView.callService.postSync("add", params).then((resp) => {

                    MainView.getView().setBusy(false);

                    if (resp)
                        rows = JSON.parse(resp);

                    if (MainView.afterList)
                        rows = MainView.afterList(rows);

                    if (rows.rows) rows = rows.rows;

                    if (rows instanceof Array) {
                        data = {
                            results: rows.map((lines) => {
                                return MainView.normalize(lines);
                            })
                        };
                    } else {
                        data = {
                            results: []
                        };
                    }

                    MainView.setMainModel(data);

                }).catch((e) => {
                    table.setBusy(false);
                    MainView.getView().setBusy(false);
                    throw e;
                })
            },
            logInfo(params) {
                console.table({ COLLECTION: MainView.collection })
                console.log("PARAMETERS:")
                console.table(params.params)
            },
            setMainModel: function (data) {

                MainView.listResult = data.results;
                console.log("RESULTS:")
                console.table(data.results);

                var model = new sap.ui.model.json.JSONModel(data);

                if (!MainView.listMode || MainView.listMode.mode !== 'tile') {
                    table.setModel(model, "mainModel");
                    table.setBusy(false);
                } else {
                    MainView.getView().setModel(model, "mainModel" + MainView.IDAPP);
                }
            },
            normalize: function (lines) {

                let key;
                let l = { ...lines };

                for (const field of MainView.context) {

                    key = field.field.split(".")[0];

                    if (field.type === 'boolean' || (typeof lines[key] === 'boolean' || lines[field.field] === 'X')) {
                        lines[field.field] = (lines[field.field]) ? true : false;
                        l[field.field] = lines[field.field];
                        lines[field.field + 'b'] = (lines[field.field]) ? "true" : "false"; continue;
                    }

                    if (lines[key] instanceof Object && lines[key].id) {
                        lines[field.field] =
                            lines[key][field.field.split(".").pop()] || lines[field.field];

                        l[key] = lines[key].id;
                    }
                }

                return { ...lines, ...l };
            },
            create: async function (data) {

                MainView.getView().setBusy(true);

                let vals = {};

                // possíveis campos chaves
                if (MainView.foreignKeys && MainView.foreignKeys instanceof Array) {
                    for (const item of MainView.foreignKeys) {
                        for (const key in item) {
                            if (key === 'idapp') continue;
                            vals[key] = item[key];
                        }
                    }
                }

                for (const key of MainView.context) {

                    if (key.create || key.foreignKey === true)
                        vals[key.field.split(".")[0]] = data[key.field.split(".")[0]];

                    /**
                    * para o caso de existir valores padrões enviado do construtor
                    * REF: add.tax.cust.variants.variants.controller.MainView
                    */
                    if (key.value)
                        vals[key.field.split(".")[0]] = key.value;
                }

                const params = {
                    "method": "POST",
                    "actionName": MainView.collection + ".create",
                    "params": vals, ...MainView.callParams
                }

                this.logInfo(params);

                if (MainView.beforeCreating instanceof Function)
                    if (!MainView.beforeCreating(vals, MainView)) return;

                return await MainView.callService.postSync("add", params).then((resp) => {

                    if (MainView.afterCreating instanceof Function)
                        MainView.afterCreating(resp, MainView);

                    MainView.getView().setBusy(false);

                    if (!resp) throw "errorCreate";

                    MainView.message("successCreate");

                    MainView.changeMainModel(resp);

                    return MainView.normalize(JSON.parse(resp));
                })
            },
            delete: async function (companyId) {

                MainView.getView().setBusy(true);

                let values = MainView.getView().getModel(MainView.IDAPP + "PARAM").getData();
                let inpConf = new sap.m.Input();
                var dialog = new sap.m.Dialog({

                    //contentWidth: "35%",

                    title: "{i18n>deleteConfirm}",

                    content: [new sap.m.Panel({
                        content: [
                            new sap.m.Label({
                                text: "{i18n>write} '" + values[MainView.titleField] + "' {i18n>toConfirm}"
                            }),
                            inpConf]
                    })],

                    beginButton: new sap.m.Button({

                        text: "{i18n>confirm}",

                        press: async function () {

                            if (inpConf.getValue() != values[MainView.titleField]) return;

                            dialog.close();

                            const params = {
                                "method": "DELETE",
                                "fullPath": "/api/" + MainView.collection + "/" + companyId,
                                "actionName": MainView.collection + ".remove",
                                ...MainView.callParams
                            }

                            MainView.logInfo(params);

                            if (MainView.beforeDeleting instanceof Function)
                                if (!MainView.beforeDeleting(resp, MainView)) return;

                            await MainView.callService.postSync("add", params).then((resp) => {

                                if (MainView.afterDeleting instanceof Function)
                                    MainView.afterDeleting(resp, MainView);

                                MainView.getView().setBusy(false);
                                MainView.list();
                                MainView.message("successDelete");
                                MainView.mainContent.back();

                            }).catch((err) => {
                                MainView.getView().setBusy(false);
                                MainView.message("errorDelete");
                            })

                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "{i18n>cancel}",
                        press: function (e) {
                            MainView.getView().setBusy(false);
                            dialog.close();
                        }
                    })
                })

                MainView.getView().addContent(dialog);

                dialog.open();

            },
            save: async function () {

                MainView.getView().setBusy(true);

                let values = MainView.getView().getModel(MainView.IDAPP + "PARAM").getData();
                let vlas = {};

                if (!obligatoryFields()) return;

                for (const key in values) {

                    if (!MainView.context.find(l => l == key || l.field) && key != "ID") {

                        continue;

                    } else if (key === "ID") {

                        vlas.id = values[key]; continue;
                    }

                    try {
                        vlas[key] = values[key];
                    } catch {
                    }
                }

                /**
                 * transferindo valores default
                 */
                let ctx = MainView.context.find(c => c.value);
                if (ctx && ctx.length > 0)
                    for (const field of ctx) {
                        if (field && field.value)
                            vlas[field.field.split('.').pop()] = field.value;
                    }

                if (values["ACTIVE"] === true || values["ACTIVE"] === false) {
                    //caso exista campo de ativação, considerar do model
                    vlas.ACTIVE = values["ACTIVE"];
                }

                const params = {
                    "method": "POST",
                    "actionName": MainView.collection + ".update",
                    "params": vlas, ...MainView.callParams
                }

                MainView.logInfo(params);

                if (!MainView.obligatoryCheck().checkByData(vlas)) return;


                if (MainView.beforeSaving instanceof Function)
                    if (!MainView.beforeSaving(vlas, MainView)) return;

                await MainView.callService.postSync("add", params).then((resp) => {

                    if (MainView.afterSaving instanceof Function)
                        resp = MainView.afterSaving(resp, MainView);

                    MainView.getView().setBusy(false);

                    if (!resp) return;

                    MainView.changeMainModel(resp);

                    MainView.message("successUpdate");
                    MainView.mainContent.back();

                }).catch((err) => {
                    MainView.message("errorUpdate");
                })

                function obligatoryFields() {

                    return true;
                }
            },
            refresh: function () {

                if (MainView.beforeRefresh instanceof Function)
                    if (!MainView.beforeRefresh(vlas, MainView)) return;

                MainView.list();

                if (MainView.afterRefresh instanceof Function)
                    if (!MainView.afterRefresh(vlas, MainView)) return;

                if (MainView.listMode && MainView.listMode.mode === 'tile')
                    MainView._getDetail();

                MainView.message("successRefresh");
            },
            setModel: function (oModel, nameModel) {

                MainView.getView().setModel(oModel, nameModel);
            },
            navToCrud: function (crud) {

                crud.that = MainView;

                if (!MainView.View || !MainView.View.Page) {
                    crud.delete = MainView.delete;
                    crud.save = MainView.save;
                    MainView.View = new add.ui5js.ui.View(crud, () => MainView.mainContent.back());
                    MainView.View.activeButton.setSelectedKey(crud.ACTIVE);
                    MainView.mainContent.addPage(MainView.View.Page);
                } else {

                    MainView.obligatoryCheck().setNoneAll();
                    MainView.View.setId(crud.id);
                    MainView.View.setBtEvents(crud.id);
                    MainView.View.title.setText(crud[MainView.titleField]);
                    MainView.View.avatar.setSrc(crud.LOGO || crud.ICON || crud.that.icon || crud.imageURI)
                    MainView.View.activeButton.setSelectedKey(crud.ACTIVE)
                }

                let values = {};
                for (const key in crud) {
                    if (!(crud[key] instanceof Object))
                        // values[MainView.IDAPP + key.toUpperCase()] = crud[key];
                        values[key.toUpperCase()] = crud[key];
                }

                var oModel = new sap.ui.model.json.JSONModel(values);

                MainView.getView().setModel(oModel, MainView.IDAPP + "PARAM");

                MainView.mainContent.to(MainView.View.Page);
            },
            message: function (msg) {

                MessageToast.show(MainView.getView().getModel("i18n").getResourceBundle().getText(msg || "Nothing here"));
            },
            _onSearchList: function (oEvent, list, objectList) {

                if (!MainView.listMode || MainView.listMode.mode === 'table') {
                    var sValue = oEvent.getParameter("newValue");

                    let listFilter = [new sap.ui.model.Filter("id", FilterOperator.Contains, sValue)];

                    for (const field of this.context) {
                        if (typeof list[0][field.field] == 'boolean') continue;
                        listFilter.push(new sap.ui.model.Filter(field.field, FilterOperator.Contains, sValue));
                    }

                    var InputFilter = new sap.ui.model.Filter({
                        filters: listFilter,
                        and: false
                    });

                    table.getBinding("items").filter(InputFilter);

                } else if (MainView.listMode || MainView.listMode.mode === 'tile') {

                    let sQuery = oEvent.getSource().getValue();
                    let vals;
                    let check = {};
                    list.forEach((app, i) => {

                        vals = { ...app };

                        vals = MainView.normalize(vals);

                        for (const iterator of MainView.context) {
                            if (vals[iterator.field] instanceof Object || vals[iterator.field] instanceof Array) continue;
                            check[iterator.field] = vals[iterator.field];
                        }

                        check = JSON.stringify(check);

                        if (check.toLowerCase().includes(sQuery.toLowerCase())) {
                            sap.ui.getCore().byId(app.byId).setVisible(true);
                        } else {
                            sap.ui.getCore().byId(app.byId).setVisible(false);
                        }

                        check = {};

                    });
                }

                return;

            },
            _getDetail: function (buttons) {

                if (!MainView.listMode || MainView.listMode.mode === 'table') {

                    let cells = [];
                    let columns = [];
                    let container = new sap.m.ScrollContainer({ height: "80%", vertical: true, focusable: true, content: [] });

                    if (!MainView.context) MainView.context = [{ field: MainView.titleField }];

                    const datatype = (field) => {

                        let types = {

                            OTHERS: "{mainModel>" + field.field + "}",

                            DATS: {
                                path: "mainModel>" + field.field,
                                type: 'sap.ui.model.type.Date',
                                formatOptions: {
                                    style: 'short',
                                    source: {
                                        pattern: 'YYYYMMDDhhmmss'
                                        //pattern: 'dd/mm/yyyy'
                                    }
                                }
                            }
                        }
                        return types[field.DATATYPE] || types.OTHERS;
                    };

                    table = new sap.m.Table({
                        //contextualWidth: "Auto",
                        //sticky: new sap.m.Sticky.ColumnHeaders,
                        popinLayout: "GridSmall",
                        inset: false,
                        autoPopinMode: true,
                        contextualWidth: "Auto",
                        growing: true,
                        growingThreshold: 8,
                        busy: true,
                        fixedLayout: "Strict",
                        busyIndicatorDelay: 20,
                        busyIndicatorSize: sap.ui.core.BusyIndicatorSize.Medium,
                        growingStarted: (e) => {
                            // alert("nothing here")
                        },

                        dependents: new sap.m.plugins.ColumnResizer(),

                        headerToolbar: (MainView.panelContent) ? new sap.m.Toolbar({
                            content: MainView.panelContent
                        }) : null,
                        //mode: "SingleSelect",
                        // selectionMode: "MultiToggle",
                        selectionChange: function (oEvent) {
                            //  var oSelectedItem = oEvent.getParameter("items");
                            //  var oModel = oSelectedItem.getBindingContext().getObject();

                        },
                        columns: []
                    });

                    MainView.list();

                    Promise.all(promises).then((data) => {

                        for (var field of MainView.context) {

                            /**
                            * verifica se são campos standard e se os mesmos serão apresentados
                            */
                            if (field.visible === false ||
                                field.field === "id" ||
                                field.field === "ACTIVE" ||
                                field.foreignKey === true) continue;

                            /**
                             * para chaves estrangeiras, não necessário aparecer na sap.m.Table
                             */
                            //if (MainView.sectionsItems && MainView.sectionsItems.foreignKeys)
                            //   if (MainView.sectionsItems.foreignKeys.find(f => f.foreignKey.split('.')[0] === field.split('.')[0])) continue;

                            cells.push(new sap.m.Text({
                                //width: "35%",
                                text: datatype(field)
                            }).addStyleClass("labelColumnsTableBold"));

                            let col = new sap.m.Text({ text: field.text || "{i18n>description}" }).addStyleClass("labelColumnsTable");

                            //armazena id para mudar o texto posterior
                            field.byIdText = col.getId();

                            columns.push(new sap.m.Column({
                                header: [col]
                            }));
                        }

                        const actCol = MainView.context.find(e => e.field === "ACTIVE");

                        if ((actCol && actCol.visible === true) || !actCol) {

                            columns.push(new sap.m.Column({
                                demandPopin: true,
                                minScreenWidth: "800px",
                                popinDisplay: "Inline",
                                header: [
                                    //width: "8em",
                                    new sap.m.Text({ text: "{i18n>status}" }).addStyleClass("labelColumnsTable")
                                ]
                            }));

                            cells.push(new sap.m.ObjectStatus({
                                tooltip: {
                                    parts: ["mainModel>ACTIVE", "mainModel>CHANAM", "mainModel>ERNAM"],
                                    formatter: (data, CHANAM, ERNAM) => {

                                        return (data) ? (CHANAM) ? "Modificado por: " + CHANAM || '' : "Modificado por: " + CHANAM || '' : "Criado por: " + ERNAM;
                                    }
                                },
                                text: {
                                    path: 'mainModel>CHADAT',
                                    type: 'sap.ui.model.type.Date',
                                    formatOptions: {
                                        source: {
                                            pattern: 'yyyyMMddTHHmmss'
                                        },
                                        pattern: 'dd/MM/yyyy HH:mm:ss'

                                    },
                                    formatter: (data) => {

                                        return (data) ? 'em: ' + data : "";
                                    }
                                },
                                icon: {
                                    parts: ["mainModel>ACTIVE"],
                                    type: "Success",
                                    formatter: (data) => {

                                        return (data) ? "sap-icon://overlay" : "sap-icon://circle-task";
                                    }
                                }
                            }).addStyleClass("labelColumnsTable"))
                        }

                        const idCol = MainView.context.find(e => e.field === "id");

                        if (idCol && idCol.visible === true) {

                            cells.push(new sap.m.Text({
                                // width: "8em",
                                wrapping: false, text: "{mainModel>id}"
                            }).addStyleClass("labelColumnsTable"));


                            columns.push(new sap.m.Column({
                                demandPopin: true,
                                minScreenWidth: "1050px",
                                popinDisplay: sap.m.PopinDisplay.WithoutHeader,
                                header: [
                                    new sap.m.Text({ text: "{i18n>cod}" }).addStyleClass("labelColumnsTable")
                                ]
                            }));

                        }

                        columns.forEach(c => table.addColumn(c));

                        table.bindAggregation("items", {
                            path: "mainModel>/results",

                            template: new sap.m.ColumnListItem({

                                type: ((MainView.edit === undefined || MainView.edit === true)
                                    && (MainView.IDAPP !== componentHistory)) ? "Navigation" : null,

                                press: (MainView.attachPress) ?
                                    (oEvent) => { MainView.attachPress(oEvent) } :
                                    (oEvent) => {
                                        var oModel = oEvent.getSource().oBindingContexts;
                                        var values = { ...oModel.mainModel.getObject() };
                                        MainView.pressToNav(values);
                                        MainView.navToCrud(values);
                                    },

                                cells: cells
                            })

                        });
                        container.addContent(table);
                        container.setBusy(false);
                    });

                    container.setBusy(true);
                    return container;

                } else {

                    let list = [];

                    if (!MainView.tilePanel) {

                        MainView.tilePanel = new sap.m.Panel({});
                    } else {
                        MainView.tilePanel.removeAllContent();
                    }
                    (MainView.panelContent) ? MainView.tilePanel.addContent(new sap.m.Toolbar({
                        content: MainView.panelContent
                    })) : null;

                    MainView.list().then(() => {

                        list = MainView.getView().getModel("mainModel" + MainView.IDAPP).getData();

                        for (var line of list.results) {

                            if (MainView.listMode.normalize)
                                line = MainView.listMode.normalize(line);

                            var tile = new sap.m.GenericTile(MainView.tileParameters(line));

                            tile.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginTop tileLayout");

                            tile.attachPress((MainView.attachPress) ?

                                (oEvent) => { MainView.attachPress(oEvent) } :

                                (oEvent) => {

                                    var values =

                                        MainView.getView().getModel("mainModel" + MainView.IDAPP).
                                            getData().results.find(l => l.byId === oEvent.getSource().getId());

                                    MainView.pressToNav(values);

                                    MainView.navToCrud(values);
                                });

                            line.byId = tile.getId();

                            MainView.tilePanel.addContent(tile)

                        }
                        if (MainView.mockList && MainView.mockList.length > 0)
                            MainView.mockList = list.results;
                    })

                    return MainView.tilePanel || new sap.m.ScrollContainer({ height: "80%", vertical: true, focusable: true, content: MainView.tilePanel })

                }

            },
            _getMainModel: function () {
                return MainView.getView().getModel("mainModel" + MainView.IDAPP);
            },
            new: async function (oEvent) {

                MainView.getView().setBusy(true);

                var inputs = [];

                for (const key of MainView.context) {

                    if (!key.create) continue;

                    if (MainView.foreignKeys && MainView.foreignKeys.find(f => f[key.field.split('.')[0]])) continue;

                    let screenField = await new ScreenElements(MainView).getElementScreenByName([key], MainView);

                    if (!screenField || screenField.length === 0) continue;

                    screenField[1].field = key.field;

                    inputs = inputs.concat(screenField);
                }

                dialog = new sap.m.Dialog({
                    stretch: sap.ui.Device.system.phone,
                    title: "{i18n>new}",
                    type: "Message",
                    contentWidth: "50%",
                    content: [
                        new sap.ui.layout.HorizontalLayout({
                            content: [
                                new sap.ui.layout.VerticalLayout({
                                    width: "90%",
                                    content: inputs
                                })]
                        })],

                    beginButton: new sap.m.Button({

                        text: "Salvar",
                        press: async function (oEvent) {

                            let id = null;

                            oEvent.getSource().setEnabled(false);

                            let vals = {};

                            //--> obter valores dos campos de criação
                            for (const input of inputs) {
                                if (!input.field) continue;
                                if (input.REFTYPE === 'LB') {
                                    vals[input.field.split('.')[0]] = input.getSelectedKey();
                                } else {
                                    vals[input.field.split('.')[0]] = input.getValue();
                                }
                            }

                            //-> caso seja embedded, inserir chave estrangeira
                            if (MainView.foreignKeys) {
                                for (const item of MainView.foreignKeys) {
                                    for (const key in item) {
                                        vals[key] = item[key.split('.')[0]];
                                    }
                                }
                            }

                            // valida se todos os campos de contexto de criação estão preenchidos
                            for (const field of MainView.context) {
                                if (vals && field.create && !vals[field.field.split('.')[0]]) {
                                    vals = null;
                                }
                            }

                            //--> valida se requisitos mínimos foram preenchidos
                            if (!vals) {
                                oEvent.getSource().setEnabled(true);
                                return;
                            }

                            dialog.close();

                            try {

                                vals = await MainView.create(vals);

                                //vals.id = id;

                                if (!vals.id) throw "errorCreate";

                                vals.ACTIVE = false;

                                MainView.navToCrud(vals);

                            } catch (error) {
                                MainView.message(error); return;
                            }

                            table.getModel("mainModel").getData().results.unshift(vals);

                            table.getModel("mainModel").refresh();
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancelar",
                        press: function () {
                            dialog.close();
                        }
                    }),
                    afterClose: function () {
                        dialog.destroy();
                    }
                });

                MainView.getView().addContent(dialog);

                MainView.getView().setBusy(false);

                dialog.open();
            },
            getMainLayout: function () {

                MainView.panelContent = [];

                if (MainView.sF || MainView.sF === undefined)
                    MainView.sF = new sap.m.SearchField({
                        width: "18.8rem",
                        liveChange: (evt) => {
                            MainView._onSearchList(evt, MainView.listResult, {});
                        }
                    }).addStyleClass("sapUiSmallMarginEnd");

                if (MainView.btRefresh || MainView.btRefresh === undefined)
                    MainView.btRefresh = new sap.m.Button({
                        icon: "sap-icon://synchronize",
                        tooltip: "{i18n>refresh}",
                        type: sap.m.ButtonType.Transparent,
                        press: MainView.refresh,
                    }).addStyleClass("sapUiSmallMarginEnd");

                if (MainView.btNew || MainView.btNew === undefined)
                    MainView.btNew = (MainView.context.find(c => c.create)) ? new sap.m.Button({
                        icon: "sap-icon://add-document",
                        text: "{i18n>new}",
                        press: MainView.new,
                    }).addStyleClass("sapUiSmallMarginEnd") : null;

                if (MainView.btBack || MainView.btBack === undefined)
                    MainView.btBack = new sap.m.Button(
                        {
                            //icon: "sap-icon://decline",
                            type: sap.m.ButtonType.Back,
                            tooltip: "Fechar",
                            press: () => {
                                MainView.View.removeBtEvents();
                                MainView.mainContent.back();
                            }
                        }).addStyleClass("sapUiSmallMarginEnd");

                if (MainView.btSort || MainView.btSort === undefined)
                    MainView.btSort = new sap.m.Button(
                        {
                            icon: "sap-icon://sort",
                            type: "Transparent",
                            tooltip: "ordenar",
                            press: (oEvent) => {
                                //let v = this.textArea.getValue();
                                MainView._sortTable(oEvent);
                            }
                        }).addStyleClass("sapUiSmallMarginEnd");

                MainView.panelContent = [
                    MainView.sF,
                    MainView.btRefresh,
                    // MainView.btSort,
                    MainView.btNew
                ];

                if ((MainView.foreignKeys && MainView.foreignKeys.length > 0 || MainView.showHeader === false) &&
                    (!MainView.sectionsHeader || MainView.sectionsHeader.length === 0)) {
                    return MainView._getDetail(MainView.panelContent);
                }

                let sections = [];

                if (!MainView.sectionsHeader || MainView.sectionsHeader.length === 0)
                    sections = [
                        new sap.uxap.ObjectPageSection({
                            showTitle: false,
                            title: "{i18n>title}",
                            tooltip: MainView.IDAPP,
                            subSections: new sap.uxap.ObjectPageSubSection({
                                blocks: MainView._getDetail()
                                /* (!MainView.listMode || MainView.listMode.mode === 'tile') ?
                                    MainView._getDetail() : new sap.m.Panel({
                                        content: MainView._getDetail()
                                    }) */
                                // moreBlocks: new sap.m.Label({ text: "Anbother block" })
                            })
                        })
                    ]

                if (MainView.sectionsHeader && MainView.sectionsHeader instanceof Array && MainView.sectionsHeader.length > 0) {
                    /*
                       Possibilita incluir seções externas.
                       Type: sap.uxap.ObjectPageSection
                     */
                    sections = sections.concat(MainView.sectionsHeader);
                }

                if (MainView.showHeader || MainView.showHeader === undefined)
                    this.Bar = new sap.m.Bar({
                        contentLeft: [new sap.m.Avatar(
                            {
                                src: MainView.icon || "sap-icon://approvals",
                                displaySize: sap.m.AvatarSize.XS, tooltip: MainView.IDAPP + " / " + MainView.collection // + " ID: " + MainView.values.id
                            }),
                        new sap.m.Label({ text: MainView.title })], //MainView.btBack || [new sap.m.Button({ text: "Back", type: sap.m.ButtonType.Back })],
                        contentMiddle: null,
                        contentRight: null
                    })

                let opl = new sap.uxap.ObjectPageLayout({
                    useIconTabBar: (MainView.useIconTabBar) ? false : true,
                    subSectionVisibilityChange: () => {
                        sap.ui.getCore().setModel(
                            new sap.ui.model.json.JSONModel({
                                root: MainView.IDAPP
                            }), "rootParent");
                    },
                    isChildPage: false,
                    headerContent: this.Bar || MainView.headerContent || [
                    ],
                    sections: sections
                })
                /*       setTimeout(() => {
                          opl.setSelectedSection(sections[0].getId())
                      }, 3000) */

                return opl;
            },
            appendComponent(items) {

                if (!MainView.sectionsItems || MainView.sectionsItems.length === 0) {
                    MainView.sectionsItems = {
                        foreignKeys: items || []
                    }
                } else {
                    items.index = MainView.sectionsItems.foreignKeys.length + 1;
                    MainView.sectionsItems.foreignKeys =
                        MainView.sectionsItems.foreignKeys.concat(items);
                }

                if (MainView.sectionsItems.foreignKeys.length > 0) {
                    let i = 0;
                    for (let iterator of MainView.sectionsItems.foreignKeys) {
                        iterator.index = i;
                        iterator.parent = MainView.IDAPP;
                        i++;
                    }
                }
            },
            changeMainModel: async (data) => {

                var oModel = table.getModel("mainModel");
                let res = JSON.parse(data);
                if (!res.id) throw "errorCreate";
                oModel.getData().results = oModel.getData().results.map((line) => {
                    if (line.id === res.id) {
                        line = MainView.normalize(res);
                        /*     for (const key in res) {
                                if (!(res[key] instanceof Function))
                                    line[key] = res[key];
                            } */
                    }
                    return line;
                });

                oModel.refresh(true);
            },
            pressToNav: function (values) {

                if (MainView.sectionsItems) {
                    //-> previsto views relacionais para a collection

                    if (MainView.sectionsItems.foreignKeys) {
                        //-> campo com os dados básicos preenchidos                                 

                        let keys = [];
                        let vals = {};
                        let selectedLine = {};
                        for (const key of MainView.sectionsItems.foreignKeys) {

                            //-> obtem model para conferência. 
                            var components = sap.ui.getCore().getModel("foreignKey" + MainView.rootComponent);
                            /**
                             * somente parametros do app
                             */
                            if (key.parent && key.parent !== MainView.IDAPP) continue;

                            vals = { idapp: key.idapp, parent: key.parent, context: key.context };

                            if (components && key.foreignKey !== null) {
                                //-> caso exista, verificar se o app já está sendo utilizado

                                selectedLine = [components.getData().find(l => l.idapp === key.idapp && l.parent === key.parent)];
                                //selectedLine = [components.getData().find(l => l.idapp == MainView.IDAPP && l.parent === MainView.IDAPP)];

                                if (!selectedLine || selectedLine.length === 0 || !selectedLine[0]) {

                                    //==> se não estiver, incluílo.
                                    if (key.foreignKey instanceof Array) {

                                        for (let item of key.foreignKey) {
                                            vals[item] = values[key.foreignKeyField] || values[item] || values.id;
                                        }

                                    } else {

                                        vals[key.foreignKey] = values[key.foreignKeyField] || values[key.foreignKey] || values.id;

                                    }

                                    vals.index = components.oData.length;

                                    components.oData = components.oData.concat([vals])

                                    components.oData.values = values;

                                } else {
                                    selectedLine[key.index];
                                    selectedLine[key.index] = vals;

                                    if (key.foreignKey instanceof Array) {
                                        for (let item of key.foreignKey) {
                                            selectedLine[key.index][item] = values[key.foreignKeyField] || values[item] || values.id;
                                        }
                                    } else {
                                        selectedLine[key.index][key.foreignKey] = values[key.foreignKeyField] || values[key.foreignKey] || values.id;
                                    }

                                    components.oData = components.getData().map(item => {
                                        if (item.idapp === selectedLine[key.index].idapp && item.parent === selectedLine[key.index].parent) {
                                            item = selectedLine[key.index];
                                        }
                                        return item;
                                    });

                                    components.oData.values = values;

                                }

                            } else if (key.foreignKey !== null) {

                                if (key.foreignKey instanceof Array) {

                                    for (const item of key.foreignKey) {
                                        vals[item] = values[key.foreignKeyField] || values[item] || values.id;
                                    }

                                } else {
                                    vals[key.foreignKey] = vals[key.foreignKeyField] || values.id;
                                }

                                keys.push(vals);
                                //--> model ainda não existe, então, criar
                                keys.values = values;
                                keys.context = key.context;

                                sap.ui.getCore().setModel(new sap.ui.model.json.JSONModel(
                                    keys
                                ), "foreignKey" + MainView.rootComponent);
                            }

                            //-verifica se a tela ui5 do componente já foi inserida com aba
                            //-> não existindo, iniciar array
                            if (!MainView.sectionsItems.items) MainView.sectionsItems.items = [];

                            //->caso não exista o íncice, incluir tela no índice indicado
                            if (!MainView.sectionsItems.items[key.index || 0]) {

                                //->incluir tela no índice indicado
                                MainView.sectionsItems.items[key.index || 0] =
                                    new sap.uxap.ObjectPageSection({
                                        showTitle: false,
                                        title: key.title,
                                        subSections: new sap.uxap.ObjectPageSubSection({
                                            blocks: key.content || null
                                        })
                                    })

                            } else {
                                //-> já existe a tela, então eliminá-la para posterior criação de uma nova.
                                //- necessáio para disparar o onInit do controller do componente.
                                MainView.sectionsItems.items[key.index || 0].getSubSections()[0].destroyBlocks();
                            }

                            //-> criar componente com base no idd
                            MainView.sectionsItems.items[key.index || 0].getSubSections()[0].addBlock(new ScreenFactory(MainView).create({
                                name: key.idapp,
                                key: key.idapp,
                                idapp: MainView.IDAPP
                            }))
                        }
                    }
                }
            },
            tileParameters: function (line) {
                //modelo para entendimento
                if (MainView.listMode && MainView.listMode.mappingTile)
                    return {
                        header: line[MainView.listMode.mappingTile.header] || MainView.listMode.mappingTile.header,
                        headerImage: line[MainView.listMode.mappingTile.headerImage] || MainView.listMode.mappingTile.headerImage,
                        subheader: line[MainView.listMode.mappingTile.subheader] || MainView.listMode.mappingTile.subheader,
                        url: line[MainView.listMode.mappingTile.url] || MainView.listMode.mappingTile.url,
                        frameType: line[MainView.listMode.mappingTile.frameType] || MainView.listMode.mappingTile.frameType,
                        state: line[MainView.listMode.mappingTile.state] || MainView.listMode.mappingTile.state,
                        scope: line[MainView.listMode.mappingTile.scope] || MainView.listMode.mappingTile.scope,
                        mode: line[MainView.listMode.mappingTile.mode] || MainView.listMode.mappingTile.mode,
                        tileContent: {
                            unit: line[MainView.listMode.mappingTile.tileContent.unit] || MainView.listMode.mappingTile.tileContent.unit || null,
                            footer: line[MainView.listMode.mappingTile.tileContent.footer] || MainView.listMode.mappingTile.tileContent.footer,
                            content: (MainView.listMode.mappingTile.tileContent.content) ? [new MainView.listMode.mappingTile.tileContent.content.type(MainView.listMode.mappingTile.tileContent.content.params(line))] : null
                        }
                    }

                return {

                    header: "id",
                    headerImage: "sap-icon://information",
                    subheader: "ERNAM",
                    frameType: "TwoByOne",
                    url: "ACTIVE",
                    tileContent: {
                        unit: null,
                        footer: "footer",
                        content: {
                            type: sap.m.NumericContent,
                            params: (line) => {
                                /**
                                 * essa função recebe o registro (line)
                                 * esse registro pode ser alterado no construtor
                                 * uma espécie de map antes de entragar o valor 
                                 * para o content do componente
                                 */
                                return {
                                    value: 10000,
                                    withMargin: false
                                }
                            }
                        }
                    }
                }
            },
            getMokList: function () {

                if (!MainView.mockList) return false;

                let data = {
                    results: MainView.mockList.map((lines) => {
                        return MainView.normalize(lines);
                    })
                };

                MainView.setMainModel(data);

                return true;

            },
            _sortTable() {

                var vsd1 = new sap.m.ViewSettingsDialog("vsd1", {
                    confirm: function (oEvent) {
                        var p = oEvent.getParameters(),
                            oSorter,
                            oGrouper,
                            aFilters,
                            oCallback,
                            aTableSorters = [],
                            aTableFilters = [],
                            i = 0;

                        // 1) fetch and adjust grouper (set group order)
                        if (p.groupItem) {
                            oGrouper = p.groupItem.getCustomData()[0].getValue();
                            if (oGrouper) {
                                oGrouper.bDescending = p.groupDescending;
                                aTableSorters.push(oGrouper);
                            }
                        }

                        // 2) fetch and adjust sorter (set sort order)
                        if (p.sortItem) {
                            oSorter = p.sortItem.getCustomData()[0].getValue();
                            if (oSorter) {
                                oSorter.bDescending = p.sortDescending;
                                aTableSorters.push(oSorter);
                            }
                        }

                        // 3) filtering (either preset filters or standard/custom filters)
                        if (p.presetFilterItem) {
                            aFilters = p.presetFilterItem.getCustomData()[0].getValue();
                            if (aFilters) {
                                // the filter could be an array of filters or a single filter so we transform it to an array
                                if (!Array.isArray(aFilters)) {
                                    aFilters = [aFilters];
                                }
                                aTableFilters = aTableFilters.concat(aFilters);
                            }
                        } else { // standard/custom filters
                            for (; i < p.filterItems.length; i++) {
                                if (p.filterItems[i] instanceof sap.m.ViewSettingsCustomItem) { // custom control filter
                                    oCallback = p.filterItems[i].getCustomData()[0].getValue();
                                    aFilters = oCallback.apply(this, [p.filterItems[i].getCustomControl()]);
                                    if (aFilters) {
                                        // the filter could be an array of filters or a single filter so we transform it to an array
                                        if (!Array.isArray(aFilters)) {
                                            aFilters = [aFilters];
                                        }
                                        aTableFilters = aTableFilters.concat(aFilters);
                                    }
                                } else if (p.filterItems[i] instanceof sap.m.ViewSettingsItem) { // standard filter
                                    aFilters = p.filterItems[i].getCustomData()[0].getValue();
                                    if (aFilters) {
                                        // the filter could be an array of filters or a single filter so we transform it to an array
                                        if (!Array.isArray(aFilters)) {
                                            aFilters = [aFilters];
                                        }
                                        aTableFilters = aTableFilters.concat(aFilters);
                                    }
                                }
                            }
                        }

                        vsd2.addFilterItem(new sap.m.ViewSettingsFilterItem({
                            key: "myValueFilter",
                            text: "Value",
                            items: [
                                new sap.m.ViewSettingsItem({
                                    key: "value1",
                                    text: "< 10 EUR"
                                }),
                                new sap.m.ViewSettingsItem({
                                    key: "value2",
                                    text: "10 - 30 EUR"
                                }),
                                new sap.m.ViewSettingsItem({
                                    key: "value3",
                                    text: "30 - 50 EUR"
                                }),
                                new sap.m.ViewSettingsItem({
                                    key: "value4",
                                    text: "50 - 70 EUR"
                                }),
                                new sap.m.ViewSettingsItem({
                                    key: "value5",
                                    text: "> 70 EUR"
                                })
                            ]
                        }));

                        // apply sorters & filters to the table binding
                        table.getBinding("items").sort(aTableSorters);
                    }
                })
            },
            foreignKeysCheck() {

                let foreignKeys = sap.ui.getCore().getModel("foreignKey" + MainView.rootComponent);

                if (foreignKeys) {

                    let keys = foreignKeys.getData().filter(l => l.idapp === MainView.IDAPP);

                    if (keys && keys.length > 0) {

                        if (keys instanceof Array) {
                            MainView.foreignKeys = keys;
                        } else {
                            MainView.foreignKeys = [keys];
                        }

                        /**
                         * possibilita mudar o contexto de campos original do component
                         * situação necessário quando chaves estrangeiras se alternam
                         */
                        if (keys[0].context)
                            MainView.context = keys[0].context;

                    } else {
                        MainView.foreignKeys = undefined;
                    }

                    if (foreignKeys.getData().length > 0) {
                        /**
                         * para títulos com base no contexto do parent
                         */
                        MainView.title = foreignKeys.getData().values[MainView.title] || MainView.title || null;
                        MainView.subtitle = foreignKeys.getData().values[MainView.subtitle] || MainView.subtitle || null;
                        if (foreignKeys.getData().values && foreignKeys.getData().values.that && foreignKeys.getData().values.that.sectionsItems)
                            (foreignKeys.getData().values.that.sectionsItems.foreignKeys.find(l => l.edit === true && l.idapp === MainView.IDAPP && l.parent === MainView.parent)) ? MainView.edit = true : null;
                    }

                }
            }, async checkContext(that) {

                return new Promise((r) => r());;

                /*
                 em testes ...obter todos os dados logo na inicialização,
                 mas ainda o appm precisa ser evoluido e mesclado com o /doc do addson                 
                */


                if (that.fieldcat || that.service) return new Promise((r) => r());;

                const valueHelp = true;
                const addson = new sap.ui.model.json.JSONModel();
                //Object.keys(window["sap-ui-config"]["resourceroots"])[0]
                const body = {
                    method: "GET",
                    actionName: that.collection + ".create",
                    params: {
                        pageSize: 100
                    },
                    m: sap.ui.getCore().getModel("userInfo").getData().currentMandt,
                    a: Object.keys(window["sap-ui-config"]["resourceroots"])[0]//idapp
                }

                return addson.loadData("doc", body, true, "POST")

                    .then(async (data) => {

                        let fieldcat = addson.getData();

                        for (const key in fieldcat) {
                            if (!MainView.context.find(c => c.field === key))
                                MainView.context.push({ field: key, type: fieldcat[key].type, visible: false })
                        }

                        await new ScreenElements(MainView).getStruc(MainView.context, valueHelp).then((data) => {
                            MainView.fieldcat = JSON.parse(data);
                            for (let el of MainView.context) {

                                let r = MainView.fieldcat.find(f => f.FIELD === el.field);
                                if (r)
                                    el.text = r.DESCR || r.SCRTEXT_S || r.SCRTEXT_M || r.SCRTEXT_L;

                            }
                            return MainView.context;
                        })

                    }).catch((err) => {
                        console.log(err);

                    });


            },
            obligatoryCheck: function () {

                return {
                    "checkById": checkById,
                    "checkByData": checkByData,
                    "setError": setError,
                    "setNone": setNone,
                    "setNoneAll": setNoneAll
                }

                function checkById(id) {

                    MainView.getView().setBusy(false);

                    if (!sap.ui.getCore().byId(id).getValue()) {
                        setError(id);
                        return false;
                    } else {
                        setNone(id);
                        return true;
                    }
                }

                function checkByData(data) {

                    MainView.getView().setBusy(false);

                    let obl = getOblig();
                    let check = true;

                    if (obl) {
                        for (const field of obl) {
                            if (!data[field.FIELD]) {
                                setError(field.idUi5);
                                check = false;
                            } else {
                                setNone(field.idUi5);
                            }
                        }
                        return check;
                    }
                }

                function setError(id) {
                    sap.ui.getCore().byId(id)
                        .setValueState(sap.ui.core.ValueState.Error);
                    sap.ui.getCore().byId(id).focus();
                }

                function setNone(id) {
                    sap.ui.getCore().byId(id)
                        .setValueState(sap.ui.core.ValueState.None);
                }

                function setNoneAll() {

                    let obl = getOblig();

                    if (obl) {
                        for (const field of obl) {
                            setNone(field.idUi5);
                        }
                    }
                }

                function getOblig() {
                    return MainView.fieldcat.filter(f => f.obligatory === true && !f.key && (!f.foreignKey || f.foreignKey === undefined));
                }
            },
            initContext: function () {
                /**
                * catálogo de campos 
                */
                promises = [Promise.resolve(new ScreenElements(MainView)
                    .getStruc(MainView.context, true).then((data) => {
                        //debugger;
                        MainView.fieldcat = JSON.parse(data);
                        for (let el of MainView.context) {

                            let r = MainView.fieldcat.find(f => f.FIELD === el.field);
                            if (!r) {
                                r = MainView.fieldcat.find(f => f.FIELD === el.field.split('.')[1]);

                            }
                            if (r) {
                                el.text = r.DESCR || r.SCRTEXT_S || r.SCRTEXT_M || r.SCRTEXT_L;
                                Object.assign(r, el);
                                Object.assign(el, r);
                            }
                        }
                    }))]
                Promise.all(promises);
                /**
                * inicialização se implementado, verificar component add.crm.corporations
                */
                if (MainView.init)
                    MainView.init();
                /**
                * App principal e componente principal
                */
                MainView.rootApp = Object.keys(window["sap-ui-config"]["resourceroots"])[0];
                MainView.rootComponent = sap.ui.getCore().getModel("rootComponent").getData().root;
                // MainView.rootParent = sap.ui.getCore().getModel("rootParent").getData().root;
                /**
                * eventos crud
                */
                if (!sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent]) {
                    sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent] = {};
                    sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent].saves = [];
                    sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent].deletes = [];
                }
                /**
                * eventos crud
                */
                MainView.beforeList = MainView.getView().getController().beforeList;
                MainView.afterList = MainView.getView().getController().afterList;
                MainView.beforeCreating = MainView.getView().getController().beforeCreating;
                MainView.afterCreating = MainView.getView().getController().afterCreating;
                MainView.beforeSaving = MainView.getView().getController().beforeSaving;
                MainView.afterSaving = MainView.getView().getController().afterSaving;
                MainView.beforeDeleting = MainView.getView().getController().beforeDeleting;
                MainView.afterDeleting = MainView.getView().getController().afterDeleting;
                MainView.codeeditor = MainView.getView().getController().codeeditor;
                MainView.onSelectLine = MainView.getView().getController().onSelectLine;

                if (MainView.getView().getController().normalize)
                    MainView.normalize = MainView.getView().getController().normalize;
                if (MainView.getView().getController().list)
                    MainView.list = MainView.getView().getController().list;
                if (MainView.getView().getController().create)
                    MainView.create = MainView.getView().getController().create;
                if (MainView.getView().getController().save)
                    MainView.save = MainView.getView().getController().save;
                if (MainView.getView().getController().delete)
                    MainView.delete = MainView.getView().getController().delete;
            }

        });
    });
