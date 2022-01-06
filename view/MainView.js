
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
        "use strict";

        let dialog = {};
        let table = {};
        let This = {};
        let componentHistory = "add.crud.modification.history";
        return Controller.extend("add.ui.crud.MainView", {

            constructor: function (that) {

                /*||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
                 *                  
                 *       CRUD: Template básico para operações crud 
                 * 
                 *       - incluir componente no menu (/server/config/appManagementData.json)
                 *       - copiar template:
                 * 
                 *              exemplo
                 *                  - DE:   usrm.home/webapp/component/ add.usrm.crud.catalog 
                 *                  - PARA  usrm.home/webapp/component/ add.usrm.crud.catalog.plans                  
                 * 
                 *       - renomear:
                 *              -  DE   catalog para plans
                 *              -  PARA /catalog/plans para /catalog/catalog/plans
                 * 
                 *       - ajustar icones e título do i18n
                 *       - setar parâmetros no onInit: controller MainView.controller
                 * 
                 *||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
                 * 
                 *  EXEMPLO: parâmetros do construtor (that)
                 * 
                 * //---------------------------------------------------> 
                 * //-> nome da tabela
                 * //---------------------------------------------------> 
                 *   that.collection = "usrm0000";                 
                 * 
                 *                 
                 * //---------------------------------------------------> 
                 * //   contenxto de campos da tabela. os mesmos deverão estar
                 * //   cadastrados na tabela P0600
                 * //----------------------------------------------------
                 *   that.context = ["INDTYP", "NAME1", "NAME2", "STCD1", "KNURL"];
                 * 
                 * 
                 * //---------------------------------------------------> 
                 * //-> nome da coluna mas informativa da tabela 
                 * //---------------------------------------------------> 
                 *   that.titleField = "NAME1";
                 * 
                 * 
                 * //---------------------------------------------------> 
                 * //-> subtítulo caso necessário, podendo ser um nome de campo ou
                 * //   uma string
                 * //---------------------------------------------------> 
                 *   that.subtitle = "";
                 * 
                 *  
                 * //---------------------------------------------------> 
                 * //-> ícone que será apresentado 
                 * //---------------------------------------------------> 
                 *   that.icon = "sap-icon://customer-briefing"* 
                 * 
                 *||||||||||||||||||||||||||||||||||||||||||||||||||||||||||*/

                This = that;

                /**
                 * inicialização se implementado, verificar component add.crm.corporations
                 */
                if (This.init)
                    This.init();

                sap.ui.core.BusyIndicator.hide();

                if (!This.IDAPP)
                    This.IDAPP = This.getView().getController().getOwnerComponent().getManifest()["sap.app"].id;

                /**
                 * setModel em ToolPage - addMainContent
                 */
                try {
                    This.rootComponent = sap.ui.getCore().getModel("rootComponent").getData().root;
                } catch {
                    This.rootComponent = This.IDAPP;
                }

                if (!that.title)
                    that.title = that.getView().getModel("i18n").getResourceBundle().getText("title");

                that._getMainLayout = this._getMainLayout;
                that.setModel = this.setModel;
                that.changeMainModel = this.changeMainModel;
                that.navToCrud = this.navToCrud;
                that.new = this.new;
                that.logInfo = this.logInfo;
                This._sortTable = this._sortTable;

                if (!that.create) that.create = this.create;
                if (!that.delete) that.delete = this.delete;
                if (!that.refresh) that.refresh = this.refresh;
                if (!that.save) that.save = this.save;
                if (!that.list) that.list = this.list;
                if (!that.new) that.new = this.new;
                if (!that.normalize) that.normalize = this.normalize;
                if (!that.getMokList) that.getMokList = this.getMokList;
                if (!that.pressToNav) that.pressToNav = this.pressToNav;
                if (!that.setMainModel) that.setMainModel = this.setMainModel;
                if (!that._getMainModel) that._getMainModel = this._getMainModel;
                if (!that.tileParameters) that.tileParameters = this.tileParameters;
                if (!that.afterList) that.afterList = this.afterList;

                that.message = this.message;
                that._onSearchList = this._onSearchList;
                that._getDetail = this._getDetail;
                //that.normalize = this.normalize;
                that.callService.IDAPP = that.IDAPP;

                This.getView().setBusyIndicatorDelay(50);

                this.foreignKeysCheck();

                This.callParams = {
                    m: sap.ui.getCore().getModel("userInfo").getData().currentMandt,
                    a: Object.keys(window["sap-ui-config"]["resourceroots"])[0]
                }

                /**
                 * verifica e habilita edição ou não
                 */
                This.context = This.context.map((e) => {
                    var res = {};
                    if (!e.field) {
                        e = { field: e };
                    }
                    res = e;
                    if (This.edit === false) res.create = false;
                    return res;
                });

                let firstPage = that._getMainLayout();

                that.mainContent = new sap.m.NavContainer({
                    pages: [firstPage],
                    initialPage: firstPage
                })

                that.getView().byId(This.IDAPP).addPage(

                    that.mainContent
                );

                if (that.components && that.components.length > 0) {
                    this.appendComponent(that.components);
                }

                if (that.history === true || that.history === undefined) {
                    this.appendComponent([
                        {
                            foreignKey: "KEY",
                            idapp: "add.crud.modification.history",
                            title: "{i18n>history}",
                            index: 0,
                            edit: false,
                            parent: that.IDAPP,
                            embedded: true
                        }]);
                }
            },
            list: function () {

                if (this.mockList) return new Promise((r) => r(this.getMokList()));

                This.getView().setBusy(true);

                let rows = [];
                var data = {};
                //let model = sap.ui.getCore().getModel("foreignKey" + This.rootComponent);
                let params = {
                    "method": "POST",
                    "actionName": (This.service) ? This.collection + "." + This.service : This.collection + ".list",
                    "params": {
                        "pageSize": (This.pageSize) ? This.pageSize : 100,
                    }, ...This.callParams

                }

                if (This.foreignKeys && This.foreignKeys instanceof Array) {
                    let query = {};

                    for (const item of This.foreignKeys) {
                        if (item.idapp !== This.IDAPP) continue;
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

                } else if (This.foreignKeys) {

                    //params.params = {};
                    let pars = { ...This.foreignKeys };
                    delete pars.idapp;
                    delete pars.index;
                    delete pars.title;
                    delete pars.content;
                    delete pars.context;
                    delete pars.parent;
                    params.params = { query: pars };
                }

                This.logInfo(params);

                return This.callService.postSync("add", params).then((resp) => {

                    This.getView().setBusy(false);

                    rows = JSON.parse(resp);

                    if (This.afterList)
                        rows = This.afterList(rows);

                    if (rows.rows) rows = rows.rows;

                    if (rows instanceof Array) {
                        data = {
                            results: rows.map((lines) => {
                                return This.normalize(lines);
                            })
                        };
                    } else {
                        data = {
                            results: []
                        };
                    }

                    This.setMainModel(data);

                }).catch((e) => {
                    table.setBusy(false);
                    This.getView().setBusy(false);
                    throw e;
                })
            },
            logInfo(params) {
                console.table({ COLLECTION: This.collection })
                console.log("PARAMETERS:")
                console.table(params.params)
            },
            setMainModel: function (data) {

                This.listResult = data.results;
                console.log("RESULTS:")
                console.table(data.results);

                var model = new sap.ui.model.json.JSONModel(data);

                if (!This.listMode || This.listMode.mode !== 'tile') {
                    table.setModel(model, "mainModel");
                    table.setBusy(false);
                } else {
                    This.getView().setModel(model, "mainModel" + This.IDAPP);
                }
            },
            normalize: function (lines) {

                let key;
                let l = { ...lines };

                for (const field of This.context) {

                    key = field.field.split(".")[0];

                    if (field.type === 'b' || (typeof lines[key] === 'boolean')) {
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

                This.getView().setBusy(true);

                let vals = {};

                // possíveis campos chaves
                if (This.foreignKeys && This.foreignKeys instanceof Array) {
                    for (const item of This.foreignKeys) {
                        for (const key in item) {
                            if (key === 'idapp') continue;
                            vals[key] = item[key];
                        }
                    }
                }

                for (const key of This.context) {

                    if (key.create || key.foreignKey === true)
                        vals[key.field.split(".")[0]] = data[key.field.split(".")[0]];

                    /**
                    * para o caso de existir valores padrões enviado do construtor
                    * REF: add.appm.dictionary.controller.MainView
                    */
                    if (key.value)
                        vals[key.field.split(".")[0]] = key.value;
                }

                if (This.beforeEvent instanceof Function)
                    if (This.beforeEvent("create", vals) === false) return;

                const params = {
                    "method": "POST",
                    "actionName": This.collection + ".create",
                    "params": vals, ...This.callParams
                }

                this.logInfo(params);

                return await This.callService.postSync("add", params).then((resp) => {

                    This.getView().setBusy(false);

                    if (!resp) throw "errorCreate";

                    This.message("successCreate");

                    if (This.after instanceof Function)
                        This.afterEvent("create", resp);

                    This.changeMainModel(resp);

                    return This.normalize(JSON.parse(resp));
                })
            },
            delete: async function (companyId) {

                This.getView().setBusy(true);

                let values = This.getView().getModel(This.IDAPP + "PARAM").getData();
                let inpConf = new sap.m.Input();
                var dialog = new sap.m.Dialog({

                    //contentWidth: "35%",

                    title: "{i18n>deleteConfirm}",

                    content: [new sap.m.Panel({
                        content: [
                            new sap.m.Label({
                                text: "{i18n>write} '" + values[This.titleField] + "' {i18n>toConfirm}"
                            }),
                            inpConf]
                    })],

                    beginButton: new sap.m.Button({

                        text: "{i18n>confirm}",

                        press: async function () {

                            if (inpConf.getValue() != values[This.titleField]) return;

                            dialog.close();

                            const params = {
                                "method": "DELETE",
                                "fullPath": "/api/" + This.collection + "/" + companyId,
                                "actionName": This.collection + ".remove",
                                ...This.callParams
                            }

                            This.logInfo(params);

                            await This.callService.postSync("add", params).then((resp) => {

                                This.getView().setBusy(false);
                                This.list();
                                This.message("successDelete");
                                This.mainContent.back();

                            }).catch((err) => {
                                This.getView().setBusy(false);
                                This.message("errorDelete");
                            })

                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "{i18n>cancel}",
                        press: function (e) {
                            This.getView().setBusy(false);
                            dialog.close();
                        }
                    })
                })

                This.getView().addContent(dialog);

                dialog.open();


            },
            save: async function () {

                This.getView().setBusy(true);

                let values = This.getView().getModel(This.IDAPP + "PARAM").getData();
                let vlas = {};

                if (!obligatoryFields()) return;

                for (const key in values) {

                    if (!This.context.find(l => l == key || l.field) && key != "ID") {

                        continue;

                    } else if (key === "ID") {

                        vlas.id = values[key]; continue;
                    }

                    try {
                        vlas[key] = values[key];
                    } catch {
                    }
                }

                if (values["ACTIVE"] === true || values["ACTIVE"] === false) {
                    //caso exista campo de ativação, considerar do model
                    vlas.ACTIVE = values["ACTIVE"];
                }

                if (This.beforeSave instanceof Function)
                    try {
                        vlas = This.beforeSave(vlas);
                    } catch {
                        This.getView().setBusy(false);
                        return;
                    }
                const params = {
                    "method": "POST",
                    "actionName": This.collection + ".update",
                    "params": vlas, ...This.callParams
                }

                This.logInfo(params);

                await This.callService.postSync("add", params).then((resp) => {

                    This.getView().setBusy(false);

                    if (!resp) return;

                    This.changeMainModel(resp);

                    if (This.afterSave instanceof Function)
                        resp = This.afterSave(resp);

                    This.message("successUpdate");
                    This.mainContent.back();

                }).catch((err) => {
                    This.message("errorUpdate");
                })

                function obligatoryFields() {

                    return true;
                }
            },
            refresh: function () {

                This.list();

                if (This.listMode && This.listMode.mode === 'tile')
                    This._getDetail();

                This.message("successRefresh");
            },
            setModel: function (oModel, nameModel) {

                This.getView().setModel(oModel, nameModel);
            },
            navToCrud: function (crud) {

                crud.that = This;

                if (!This.CrudView || !This.CrudView.Page) {
                    crud.delete = This.delete;
                    crud.save = This.save;
                    This.CrudView = new add.ui5js.ui.View(crud, () => This.mainContent.back());
                    This.CrudView.activeButton.setSelectedKey(crud.ACTIVE);
                    This.mainContent.addPage(This.CrudView.Page);
                } else {
                    This.CrudView.setId(crud.id);
                    //This.CrudView.Page.getHeaderTitle().setObjectTitle(crud[This.titleField]);
                    //This.CrudView.Page.getHeaderTitle().setObjectImageURI(crud.LOGO || crud.ICON);
                    //if (crud[This.subtitle])
                    // This.CrudView.Page.getHeaderTitle().setObjectSubtitle(crud[This.subtitle]); 
                    This.CrudView.title.setText(crud[This.titleField]);
                    This.CrudView.avatar.setSrc(crud.LOGO || crud.ICON || crud.that.icon || crud.imageURI)
                    This.CrudView.activeButton.setSelectedKey(crud.ACTIVE)
                }

                let values = {};
                for (const key in crud) {
                    if (!(crud[key] instanceof Object))
                        // values[This.IDAPP + key.toUpperCase()] = crud[key];
                        values[key.toUpperCase()] = crud[key];
                }

                var oModel = new sap.ui.model.json.JSONModel(values);

                This.getView().setModel(oModel, This.IDAPP + "PARAM");

                This.mainContent.to(This.CrudView.Page);
            },
            message: function (msg) {

                MessageToast.show(This.getView().getModel("i18n").getResourceBundle().getText(msg || "Nothing here"));
            },
            _onSearchList: function (oEvent, list, objectList) {

                if (!This.listMode || This.listMode.mode === 'table') {
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

                } else if (This.listMode || This.listMode.mode === 'tile') {

                    let sQuery = oEvent.getSource().getValue();
                    let vals;
                    let check = {};
                    list.forEach((app, i) => {

                        vals = { ...app };

                        for (const iterator of This.context) {
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

                if (!This.listMode || This.listMode.mode === 'table') {

                    let cells = [];
                    let columns = [];

                    if (!This.context) This.context = [{ field: This.titleField }];

                    const datatype = (field) => {

                        let types = {

                            OTHERS: "{mainModel>" + field.field + "}",

                            DATS: {
                                path: "mainModel>" + field.field,
                                type: 'sap.ui.model.type.Date',
                                formatOptions: {
                                    style: 'short',
                                    source: {
                                        pattern: 'dd/mm/yyyy'
                                    }
                                }
                            }
                        }
                        return types[field.datatype] || types.OTHERS;
                    };

                    for (var field of This.context) {

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
                        if (This.sectionsItems && This.sectionsItems.foreignKeys)
                            if (This.sectionsItems.foreignKeys.find(f => f.foreignKey.split('.')[0] === field.split('.')[0])) continue;

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

                    const actCol = This.context.find(e => e.field === "ACTIVE");

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

                    const idCol = This.context.find(e => e.field === "id");

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

                        headerToolbar: (This.panelContent) ? new sap.m.Toolbar({
                            content: This.panelContent
                        }) : null,
                        //mode: "SingleSelect",
                        // selectionMode: "MultiToggle",
                        selectionChange: function (oEvent) {
                            //  var oSelectedItem = oEvent.getParameter("items");
                            //  var oModel = oSelectedItem.getBindingContext().getObject();

                        },
                        columns: columns
                    });

                    table.bindAggregation("items", {
                        path: "mainModel>/results",

                        template: new sap.m.ColumnListItem({

                            type: ((This.edit === undefined || This.edit === true) && (This.IDAPP !== componentHistory)) ? "Navigation" : null,

                            press: (This.attachPress) ?

                                (oEvent) => { This.attachPress(oEvent) } :

                                (oEvent) => {

                                    var oModel = oEvent.getSource().oBindingContexts;

                                    var values = { ...oModel.mainModel.getObject() };

                                    This.pressToNav(values);

                                    This.navToCrud(values);
                                },

                            cells: cells
                        })

                    });

                    This.list();

                    return new sap.m.ScrollContainer({ height: "80%", vertical: true, focusable: true, content: table })

                    //, button
                    //return new sap.m.ScrollContainer({ content: table, vertical: true }) //, button

                } else {

                    let list = [];

                    if (!This.tilePanel) {

                        This.tilePanel = new sap.m.Panel({});
                    } else {
                        This.tilePanel.removeAllContent();
                    }
                    (This.panelContent) ? This.tilePanel.addContent(new sap.m.Toolbar({
                        content: This.panelContent
                    })) : null;

                    This.list().then(() => {

                        list = This.getView().getModel("mainModel" + This.IDAPP).getData();

                        for (var line of list.results) {

                            if (This.listMode.normalize)
                                line = This.listMode.normalize(line);

                            var tile = new sap.m.GenericTile(This.tileParameters(line));

                            tile.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginTop tileLayout");

                            tile.attachPress((This.attachPress) ?

                                (oEvent) => { This.attachPress(oEvent) } :

                                (oEvent) => {

                                    var values =

                                        This.getView().getModel("mainModel" + This.IDAPP).
                                            getData().results.find(l => l.byId === oEvent.getSource().getId());

                                    This.pressToNav(values);

                                    This.navToCrud(values);
                                });

                            line.byId = tile.getId();

                            This.tilePanel.addContent(tile)

                        }
                        if (This.mockList && This.mockList.length > 0)
                            This.mockList = list.results;
                    })

                    return This.tilePanel || new sap.m.ScrollContainer({ height: "80%", vertical: true, focusable: true, content: This.tilePanel })

                }

            },
            _getMainModel: function () {
                return This.getView().getModel("mainModel" + This.IDAPP);
            },
            new: async function (oEvent) {

                This.getView().setBusy(true);

                var inputs = [];

                for (const key of This.context) {

                    if (!key.create) continue;

                    if (This.foreignKeys && This.foreignKeys.find(f => f[key.field.split('.')[0]])) continue;

                    let screenField = await new ScreenElements(This).getElementScreenByName([key], This);

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
                            if (This.foreignKeys) {
                                for (const item of This.foreignKeys) {
                                    for (const key in item) {
                                        vals[key] = item[key.split('.')[0]];
                                    }
                                }
                            }

                            // valida se todos os campos de contexto de criação estão preenchidos
                            for (const field of This.context) {
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

                                vals = await This.create(vals);

                                //vals.id = id;

                                if (!vals.id) throw "errorCreate";

                                vals.ACTIVE = false;

                                This.navToCrud(vals);

                            } catch (error) {
                                This.message(error); return;
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

                This.getView().addContent(dialog);

                This.getView().setBusy(false);

                dialog.open();
            },
            _getMainLayout: function () {

                This.panelContent = [];

                if (This.sF || This.sF === undefined)
                    This.sF = new sap.m.SearchField({
                        width: "18.8rem",
                        liveChange: (evt) => {
                            This._onSearchList(evt, This.listResult, {});
                        }
                    }).addStyleClass("sapUiSmallMarginEnd");

                if (This.btRefresh || This.btRefresh === undefined)
                    This.btRefresh = new sap.m.Button({
                        icon: "sap-icon://synchronize",
                        tooltip: "{i18n>refresh}",
                        type: sap.m.ButtonType.Transparent,
                        press: This.refresh,
                    }).addStyleClass("sapUiSmallMarginEnd");

                if (This.btNew || This.btNew === undefined)
                    This.btNew = (This.context.find(c => c.create)) ? new sap.m.Button({
                        icon: "sap-icon://add-document",
                        text: "{i18n>new}",
                        press: This.new,
                    }).addStyleClass("sapUiSmallMarginEnd") : null;

                if (This.btBack || This.btBack === undefined)
                    This.btBack = new sap.m.Button(
                        {
                            //icon: "sap-icon://decline",
                            type: sap.m.ButtonType.Back,
                            tooltip: "Fechar",
                            press: () => {
                                //let v = this.textArea.getValue();
                                //This.CrudView.Page.destroy();
                                This.mainContent.back();
                            }
                        }).addStyleClass("sapUiSmallMarginEnd");

                if (This.btSort || This.btSort === undefined)
                    This.btSort = new sap.m.Button(
                        {
                            icon: "sap-icon://sort",
                            type: "Transparent",
                            tooltip: "ordenar",
                            press: (oEvent) => {
                                //let v = this.textArea.getValue();
                                This._sortTable(oEvent);
                            }
                        }).addStyleClass("sapUiSmallMarginEnd");

                This.panelContent = [
                    This.sF,
                    This.btRefresh,
                    // This.btSort,
                    This.btNew
                ];

                if ((This.foreignKeys && This.foreignKeys.length > 0 || This.showHeader === false) &&
                    (!This.sectionsHeader || This.sectionsHeader.length === 0)) {
                    return This._getDetail(This.panelContent);
                }

                let sections = [];

                if (!This.sectionsHeader || This.sectionsHeader.length === 0)
                    sections = [
                        new sap.uxap.ObjectPageSection({
                            showTitle: false,
                            title: "{i18n>title}",
                            tooltip: This.IDAPP,
                            subSections: new sap.uxap.ObjectPageSubSection({
                                blocks: This._getDetail()
                                /* (!This.listMode || This.listMode.mode === 'tile') ?
                                    This._getDetail() : new sap.m.Panel({
                                        content: This._getDetail()
                                    }) */
                                // moreBlocks: new sap.m.Label({ text: "Anbother block" })
                            })
                        })
                    ]

                if (This.sectionsHeader && This.sectionsHeader instanceof Array && This.sectionsHeader.length > 0) {
                    /*
                       Possibilita incluir seções externas.
                       Type: sap.uxap.ObjectPageSection
                     */
                    sections = sections.concat(This.sectionsHeader);
                }

                if (This.showHeader || This.showHeader === undefined)
                    this.Bar = new sap.m.Bar({
                        contentLeft: [new sap.m.Avatar(
                            {
                                src: This.icon || "sap-icon://approvals",
                                displaySize: sap.m.AvatarSize.XS, tooltip: This.IDAPP + " / " + This.collection // + " ID: " + This.values.id
                            }),
                        new sap.m.Label({ text: This.title })], //This.btBack || [new sap.m.Button({ text: "Back", type: sap.m.ButtonType.Back })],
                        contentMiddle: null,
                        contentRight: null
                    })

                let opl = new sap.uxap.ObjectPageLayout({
                    useIconTabBar: (This.useIconTabBar) ? false : true,
                    isChildPage: false,

                    /*        headerTitle:
                               new sap.uxap.ObjectPageHeader({
                                   navigationBar: Bar,
                                   objectImageURI: This.icon || "sap-icon://approvals",
                                   isObjectTitleAlwaysVisible: true,
                                   showPlaceholder: true,
                                   isObjectIconAlwaysVisible: true,
                                   objectTitle: This.title,
                                   objectSubtitle: This.subtitle,
                                   actions: []//panel
       
                               }), //.addStyleClass("ObjectPageLayoutTitle"), */

                    headerContent: this.Bar || This.headerContent || [
                        /* new sap.m.SearchField(),
                        //new sap.m.Label({ text: "Hello!", wrapping: true }),
                        /new sap.m.ObjectAttribute({
                            title: "Phone",
                            customContent: new sap.m.Link({ text: "+33 6 4512 5158" }),
                            active: true
                        })*/
                    ],
                    sections: sections
                })
                /*       setTimeout(() => {
                          opl.setSelectedSection(sections[0].getId())
                      }, 3000) */

                return opl;
            },
            appendComponent(items) {

                if (!This.sectionsItems || This.sectionsItems.length === 0) {
                    This.sectionsItems = {
                        foreignKeys: items || []
                    }
                } else {
                    items.index = This.sectionsItems.foreignKeys.length + 1;
                    This.sectionsItems.foreignKeys =
                        This.sectionsItems.foreignKeys.concat(items);
                }

                if (This.sectionsItems.foreignKeys.length > 0) {
                    let i = 0;
                    for (let iterator of This.sectionsItems.foreignKeys) {
                        iterator.index = i;
                        iterator.parent = This.IDAPP;
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
                        line = This.normalize(res);
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

                if (This.sectionsItems) {
                    //-> previsto views relacionais para a collection

                    if (This.sectionsItems.foreignKeys) {
                        //-> campo com os dados básicos preenchidos                                 

                        let keys = [];
                        let vals = {};
                        let selectedLine = {};
                        for (const key of This.sectionsItems.foreignKeys) {

                            //-> obtem model para conferência. 
                            var components = sap.ui.getCore().getModel("foreignKey" + This.rootComponent);
                            /**
                             * somente parametros do app
                             */
                            if (key.parent && key.parent !== This.IDAPP) continue;

                            vals = { idapp: key.idapp, parent: key.parent, context: key.context };

                            if (components && key.foreignKey !== null) {
                                //-> caso exista, verificar se o app já está sendo utilizado

                                selectedLine = [components.getData().find(l => l.idapp === key.idapp && l.parent === key.parent)];
                                //selectedLine = [components.getData().find(l => l.idapp == This.IDAPP && l.parent === This.IDAPP)];

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
                                ), "foreignKey" + This.rootComponent);
                            }

                            //-verifica se a tela ui5 do componente já foi inserida com aba
                            //-> não existindo, iniciar array
                            if (!This.sectionsItems.items) This.sectionsItems.items = [];

                            //->caso não exista o íncice, incluir tela no índice indicado
                            if (!This.sectionsItems.items[key.index || 0]) {

                                //->incluir tela no índice indicado
                                This.sectionsItems.items[key.index || 0] =
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
                                This.sectionsItems.items[key.index || 0].getSubSections()[0].destroyBlocks();
                            }

                            //-> criar componente com base no idd
                            This.sectionsItems.items[key.index || 0].getSubSections()[0].addBlock(new ScreenFactory(This).create({
                                name: key.idapp,
                                key: key.idapp
                            }))
                        }
                    }
                }
            },
            tileParameters: function (line) {
                //modelo para entendimento
                if (This.listMode && This.listMode.mappingTile)
                    return {
                        header: line[This.listMode.mappingTile.header] || This.listMode.mappingTile.header,
                        headerImage: line[This.listMode.mappingTile.headerImage] || This.listMode.mappingTile.headerImage,
                        subheader: line[This.listMode.mappingTile.subheader] || This.listMode.mappingTile.subheader,
                        url: line[This.listMode.mappingTile.url] || This.listMode.mappingTile.url,
                        frameType: line[This.listMode.mappingTile.frameType] || This.listMode.mappingTile.frameType,
                        state: line[This.listMode.mappingTile.state] || This.listMode.mappingTile.state,
                        scope: line[This.listMode.mappingTile.scope] || This.listMode.mappingTile.scope,
                        mode: line[This.listMode.mappingTile.mode] || This.listMode.mappingTile.mode,
                        tileContent: {
                            unit: line[This.listMode.mappingTile.tileContent.unit] || This.listMode.mappingTile.tileContent.unit || null,
                            footer: line[This.listMode.mappingTile.tileContent.footer] || This.listMode.mappingTile.tileContent.footer,
                            content: (This.listMode.mappingTile.tileContent.content) ? [new This.listMode.mappingTile.tileContent.content.type(This.listMode.mappingTile.tileContent.content.params(line))] : null
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

                if (!This.mockList) return false;

                let data = {
                    results: This.mockList.map((lines) => {
                        return This.normalize(lines);
                    })
                };

                This.setMainModel(data);

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

                let foreignKeys = sap.ui.getCore().getModel("foreignKey" + This.rootComponent);

                if (foreignKeys) {

                    let keys = foreignKeys.getData().filter(l => l.idapp === This.IDAPP);

                    if (keys && keys.length > 0) {

                        if (keys instanceof Array) {
                            This.foreignKeys = keys;
                        } else {
                            This.foreignKeys = [keys];
                        }

                        /**
                         * possibilita mudar o contexto de campos original do component
                         * situação necessário quando chaves estrangeiras se alternam
                         */
                        if (keys[0].context)
                            This.context = keys[0].context;

                    } else {
                        This.foreignKeys = undefined;
                    }

                    if (foreignKeys.getData().length > 0) {
                        /**
                         * para títulos com base no contexto do parent
                         */
                        This.title = foreignKeys.getData().values[This.title] || This.title || null;
                        This.subtitle = foreignKeys.getData().values[This.subtitle] || This.subtitle || null;
                        if (foreignKeys.getData().values && foreignKeys.getData().values.that && foreignKeys.getData().values.that.sectionsItems)
                            (foreignKeys.getData().values.that.sectionsItems.foreignKeys.find(l => l.edit === true && l.idapp === This.IDAPP && l.parent === This.parent)) ? This.edit = true : null;
                    }

                }
            }

        });
    });
