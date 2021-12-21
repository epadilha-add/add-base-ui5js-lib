
sap.ui.define(
    [
        "../BaseController",
        'sap/ui/model/Filter',
        'sap/ui/model/FilterOperator',
        "sap/m/MessageToast",
        "../ui/ScreenElements",
        "../ui/ScreenFactory",
        './Crud'
    ], function (Controller, Filter, FilterOperator, MessageToast, ScreenElements, ScreenFactory) {
        "use strict";

        let dialog = {};
        let table = {};
        let This = {};
        var detail;
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

                sap.ui.core.BusyIndicator.hide();

                This.IDAPP = This.getView().getController().getOwnerComponent().getManifest()["sap.app"].id;

                if (!that.title)
                    that.title = that.getView().getModel("i18n").getResourceBundle().getText("title");

                that.getMainLayout = this.getMainLayout;
                that.setModel = this.setModel;
                that.changeMainModel = this.changeMainModel;
                that.navToCrud = this.navToCrud;
                that.new = this.new;

                if (!that.create) that.create = this.create;
                if (!that.delete) that.delete = this.delete;
                if (!that.refresh) that.refresh = this.refresh;
                if (!that.save) that.save = this.save;
                if (!that.list) that.list = this.list;
                if (!that.normalize) that.normalize = this.normalize;
                if (!that.getMokList) that.getMokList = this.getMokList;
                if (!that.pressToNav) that.pressToNav = this.pressToNav;
                if (!that.setMainModel) that.setMainModel = this.setMainModel;
                if (!that.getMainModel) that.getMainModel = this.getMainModel;
                if (!that.tileParameters) that.tileParameters = this.tileParameters;
                //if (!that.attachPress) that.attachPress = this.attachPress;

                that.message = this.message;
                that.onSearchList = this.onSearchList;
                that.getDetail = this.getDetail;
                //that.normalize = this.normalize;
                that.callService.IDAPP = that.IDAPP;

                This.getView().byId(This.IDAPP).setBusyIndicatorDelay(50);

                let foreignKeys = sap.ui.getCore().getModel("foreignKey");

                if (foreignKeys) {

                    let keys = foreignKeys.getData().filter(l => l.idapp == This.IDAPP);

                    if (keys) {
                        if (keys instanceof Array) {
                            that.foreignKeys = keys;
                        } else {
                            that.foreignKeys = [keys];
                        }
                    } else {
                        that.foreignKeys = undefined;
                    }

                    if (foreignKeys.getData().context) {
                        /**
                         * para títulos com base no contexto do parent
                         */
                        This.title = foreignKeys.getData().context[This.title] || This.title || null;
                        This.subtitle = foreignKeys.getData().context[This.subtitle] || This.subtitle || null;

                        (foreignKeys.getData().context.that.edit === true) ? that.edit = true : null;
                    }

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

                let firstPage = that.getMainLayout();

                that.mainContent = new sap.m.NavContainer({
                    pages: [firstPage],
                    initialPage: firstPage
                })

                that.getView().byId(This.IDAPP).addPage(

                    that.mainContent
                );

                //if (!This.listMode || This.listMode.mode === 'table') This.list();
            },

            list: function () {

                if (this.mockList) return new Promise((r) => r(this.getMokList()));

                This.getView().byId(This.IDAPP).setBusy(true);

                let rows = [];
                var data = {};
                //let model = sap.ui.getCore().getModel("foreignKey");
                let params = {
                    "method": "POST",
                    "actionName": (This.service) ? This.collection + "." + This.service : This.collection + ".list"
                }

                if (This.foreignKeys && This.foreignKeys instanceof Array) {
                    let query = {};

                    for (const item of This.foreignKeys) {
                        for (const key in item) {
                            query[key] = item[key];
                        }

                    }
                    delete query.idapp;
                    delete query.index;
                    delete query.title;
                    delete query.content;
                    delete query.context;

                    params.params = {};
                    params.params.query = {};
                    params.params.query = query;

                } else if (This.foreignKeys) {

                    let pars = { ...This.foreignKeys };
                    delete pars.idapp;
                    delete pars.index;
                    delete pars.title;
                    delete pars.content;
                    delete pars.context;
                    params.params = {};
                    params.params = { query: pars }
                }

                return This.callService.postSync("add", params).then((resp) => {

                    This.getView().byId(This.IDAPP).setBusy(false);

                    rows = JSON.parse(resp);

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

                    This.getView().byId(This.IDAPP).setBusy(false);
                })
            },
            setMainModel: function (data) {

                This.listResult = data.results;

                var model = new sap.ui.model.json.JSONModel(data);

                if (!This.listMode || This.listMode.mode !== 'tile') {
                    table.setModel(model, "mainModel");
                    table.setBusy(false);
                } else {
                    This.getView().setModel(model, "mainModel" + This.IDAPP);
                }
            },

            normalize: function (lines) {

                for (const key in lines) {

                    if (lines[key] instanceof Object && lines[key].id) {

                        for (const field of This.context) {

                            if (field.field.split('.')[0] !== key) continue;

                            lines[field.field] =
                                lines[field.field.split(".")[0]][field.field.split(".").pop()] || lines[field.field];
                        }

                        lines[key] = lines[key].id;
                    }
                }

                return lines;
            },

            create: async function (data) {

                This.getView().byId(This.IDAPP).setBusy(true);

                let vals = {};

                for (const key of This.context) {
                    if (key.create)
                        vals[key.field.split(".")[0]] = data[key.field.split(".")[0]];
                }

                if (This.beforeEvent instanceof Function)
                    if (This.beforeEvent("create", vals) === false) return;

                return await This.callService.postSync("add", {
                    "method": "POST",
                    "actionName": This.collection + ".create",
                    "params": vals

                }).then((resp) => {

                    This.getView().byId(This.IDAPP).setBusy(false);

                    if (!resp) throw "errorCreate";

                    This.message("successCreate");

                    if (This.after instanceof Function)
                        This.afterEvent("create", resp);

                    This.changeMainModel(resp);

                    return This.normalize(JSON.parse(resp));
                })
            },

            delete: async function (companyId) {

                This.getView().byId(This.IDAPP).setBusy(true);

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

                            await This.callService.postSync("add", {
                                "method": "DELETE",
                                "fullPath": "/api/" + This.collection + "/" + companyId,
                                "actionName": This.collection + ".remove"
                            }).then((resp) => {

                                This.getView().byId(This.IDAPP).setBusy(false);
                                This.list();
                                This.message("successDelete");
                                This.mainContent.back();

                            }).catch((err) => {
                                This.getView().byId(This.IDAPP).setBusy(false);
                                This.message("errorDelete");
                            })

                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "{i18n>cancel}",
                        press: function (e) {
                            This.getView().byId(This.IDAPP).setBusy(false);
                            dialog.close();
                        }
                    })
                })

                This.getView().addContent(dialog);

                dialog.open();


            },

            save: async function () {

                This.getView().byId(This.IDAPP).setBusy(true);

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
                        This.getView().byId(This.IDAPP).setBusy(false);
                        return;
                    }

                await This.callService.postSync("add", {
                    "method": "POST",
                    "actionName": This.collection + ".update",
                    "params": vlas
                }).then((resp) => {

                    This.getView().byId(This.IDAPP).setBusy(false);

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
                    This.getDetail();

                This.message("successRefresh");
            },

            setModel: function (oModel, nameModel) {

                This.getView().setModel(oModel, nameModel);
            },

            navToCrud: function (crud) {

                crud.that = This;

                if (!This.CrudView) {
                    crud.delete = This.delete;
                    crud.save = This.save;
                    This.CrudView = new add.usrm.crud.Crud(crud, () => This.mainContent.back());
                    This.mainContent.addPage(This.CrudView.Page);
                } else {
                    This.CrudView.setId(crud.id);
                    This.CrudView.Page.getHeaderTitle().setObjectTitle(crud[This.titleField]);
                    This.CrudView.Page.getHeaderTitle().setObjectImageURI(crud.LOGO || crud.ICON);
                    if (crud[This.subtitle])
                        This.CrudView.Page.getHeaderTitle().setObjectSubtitle(crud[This.subtitle]);
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

            onSearchList: function (oEvent, list, objectList) {

                if (!This.listMode || This.listMode.mode === 'table') {
                    var sValue = oEvent.getParameter("newValue");

                    let listFilter = [new sap.ui.model.Filter("id", FilterOperator.Contains, sValue)];

                    for (const field of this.context) {
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
                            if (iterator instanceof Object || iterator instanceof Array) continue;
                            check[iterator] = vals[iterator];
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

            getDetail: function (buttons) {

                if (!This.listMode || This.listMode.mode === 'table') {

                    let cells = [];
                    let columns = [];

                    if (!This.context) This.context = [{ field: This.titleField }];

                    for (const field of This.context) {

                        if (field.visible === false) continue;

                        cells.push(new sap.m.Text({
                            //width: "35%",
                            text: "{mainModel>" + field.field + '}'
                        }).addStyleClass("labelColumnsTableBold"))

                        columns.push(new sap.m.Column({

                            header: [
                                new sap.m.Text({ text: field.text || "{i18n>description}" }).addStyleClass("labelColumnsTable")
                            ]
                        }));
                    }

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

                    cells.push(new sap.m.Text({
                        // width: "8em",
                        wrapping: false, text: "{mainModel>id}"
                    }).addStyleClass("labelColumnsTable"));

                    if (This.context.find(e => e.field === "id" && e.visible === true))
                        columns.push(new sap.m.Column({
                            demandPopin: true,
                            minScreenWidth: "1050px",
                            popinDisplay: sap.m.PopinDisplay.WithoutHeader,
                            header: [
                                new sap.m.Text({ text: "{i18n>cod}" }).addStyleClass("labelColumnsTable")
                            ]
                        }));

                    table = new sap.m.Table({
                        contextualWidth: "Auto",
                        popinLayout: "GridSmall",
                        growing: true,
                        growingThreshold: 8,
                        busy: true,
                        fixedLayout: false,
                        busyIndicatorDelay: 20,
                        busyIndicatorSize: sap.ui.core.BusyIndicatorSize.Medium,
                        growingStarted: (e) => {
                            // alert("nothing here")
                        },
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

                            type: "Navigation",

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
                    return table//, button

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
                    })

                    return This.tilePanel;

                }

            },

            getMainModel: function () {
                return This.getView().getModel("mainModel" + This.IDAPP);
            },

            new: async function (oEvent) {

                This.getView().byId(This.IDAPP).setBusy(true);

                var inputs = [];

                for (const key of This.context) {

                    if (!key.create) continue;

                    if (This.foreignKeys && This.foreignKeys.find(f => f[key.field.split('.')[0]])) continue;

                    let screenField = await new ScreenElements(This).getElementScreenByName([key], This);

                    if (screenField.length === 0) continue;

                    screenField[1].field = key.field;

                    inputs = inputs.concat(screenField);
                }

                dialog = new sap.m.Dialog({
                    stretch: sap.ui.Device.system.phone,
                    title: "{i18n>new}",
                    type: "Message",
                    contentWidth: "35%",
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
                                    vals[input.field] = input.getSelectedKey();
                                } else {
                                    vals[input.field] = input.getValue();
                                }
                            }

                            //-> caso seja embedded, inserir chave estrangeira
                            if (This.foreignKeys) {
                                for (const item of This.foreignKeys) {
                                    for (const key in item) {
                                        vals[key] = item[key];
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

                This.getView().byId(This.IDAPP).setBusy(false);

                dialog.open();
            },

            getMainLayout: function () {

                This.panelContent = [];

                This.sF = new sap.m.SearchField({
                    width: "18.8rem",
                    liveChange: (evt) => {
                        This.onSearchList(evt, This.listResult, {});
                    }
                }).addStyleClass("sapUiSmallMarginEnd");

                This.btRefresh = new sap.m.Button({
                    icon: "sap-icon://synchronize",
                    tooltip: This.IDAPP || "{i18n>refresh}",
                    type: sap.m.ButtonType.Transparent,
                    press: This.refresh,
                }).addStyleClass("sapUiSmallMarginEnd");

                This.btNew = (This.context.find(c => c.create)) ? new sap.m.Button({
                    icon: "sap-icon://add-document",
                    text: "{i18n>new}",
                    press: This.new,
                }).addStyleClass("sapUiSmallMarginEnd") : null;

                This.btBack = new sap.m.Button(
                    {
                        icon: "sap-icon://decline",
                        type: "Transparent",
                        tooltip: "Fechar",
                        press: () => {
                            //let v = this.textArea.getValue();
                            This.mainContent.back();
                        }
                    }).addStyleClass("sapUiSmallMarginEnd");

                This.panelContent = [
                    This.sF,
                    This.btRefresh,
                    This.btNew
                ];

                if (This.foreignKeys && This.foreignKeys.length > 0) {
                    return This.getDetail(This.panelContent);
                }

                let sections = [
                    new sap.uxap.ObjectPageSection({
                        showTitle: false,
                        title: "{i18n>title}",
                        subSections: new sap.uxap.ObjectPageSubSection({
                            blocks: (!This.listMode || This.listMode.mode === 'tile') ?
                                This.getDetail() : new sap.m.Panel({
                                    content: This.getDetail()
                                })
                            // moreBlocks: new sap.m.Label({ text: "Anbother block" })
                        })
                    })
                ]

                if (This.sectionsHeader && This.sectionsHeader instanceof Array) {
                    /*
                       Possibilita incluir mais seções .
                       Type: sap.uxap.ObjectPageSection
                     */
                    sections = sections.concat(This.sectionHeader);
                }

                return new sap.uxap.ObjectPageLayout({
                    useIconTabBar: true,
                    isChildPage: false,
                    headerTitle:
                        new sap.uxap.ObjectPageHeader({
                            objectImageURI: This.icon || "sap-icon://approvals",
                            isObjectTitleAlwaysVisible: true,
                            showPlaceholder: true,
                            isObjectIconAlwaysVisible: true,
                            objectTitle: This.title,
                            objectSubtitle: This.subtitle,
                            actions: []//panel

                        }),//.addStyleClass("ObjectPageLayoutTitle"),

                    headerContent: This.headerContent || [
                        // new sap.m.SearchField(),
                        //new sap.m.Label({ text: "Hello!", wrapping: true }),
                        /*new sap.m.ObjectAttribute({
                            title: "Phone",
                            customContent: new sap.m.Link({ text: "+33 6 4512 5158" }),
                            active: true
                        })*/
                    ],
                    sections: sections
                })
            },

            appendComponent(items) {

                This.sectionsItems = {
                    foreignKeys: items
                }
            },

            changeMainModel: async (data) => {

                var oModel = table.getModel("mainModel");
                let res = JSON.parse(data);
                if (!res.id) throw "errorCreate";
                oModel.getData().results.find((line) => {
                    if (line.id === res.id) {
                        for (const key in res) {
                            if (!(res[key] instanceof Function))
                                line[key] = res[key];
                        }
                    }
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

                        for (const key of This.sectionsItems.foreignKeys) {
                            //-> obtem model para conferência. 
                            var components = sap.ui.getCore().getModel("foreignKey");

                            if (components) {
                                //-> caso exista, verificar se o app já está sendo utilizado

                                let selectedLine = components.getData().filter(l => l.idapp === key.idapp);

                                if (!selectedLine || selectedLine.length === 0) {
                                    //==> se não estiver, incluílo.
                                    if (key.foreignKey instanceof Array) {

                                        for (let item of key.foreignKey) {

                                            components.oData = components.oData.concat(
                                                [{
                                                    [item]: values[item] || values.id,
                                                    idapp: key.idapp,
                                                    context: values
                                                }])
                                        }

                                    } else {
                                        components.oData = components.oData.concat(
                                            [{
                                                [key.foreignKey]: values.id,
                                                idapp: key.idapp,

                                            }])
                                    }

                                    components.oData.context = values;

                                } else {
                                    selectedLine[key.index];

                                    if (key.foreignKey instanceof Array) {
                                        for (let item of key.foreignKey) {
                                            selectedLine[key.index] = { idapp: key.idapp };
                                            selectedLine[key.index][item] = values[item] || values.id;
                                        }
                                    } else {
                                        selectedLine[key.index] = { idapp: key.idapp }
                                        selectedLine[key.index][key.foreignKey] = values[key.foreignKey] || values.id;
                                    }

                                    selectedLine.context = values;

                                    sap.ui.getCore().setModel(new sap.ui.model.json.JSONModel(
                                        selectedLine
                                    ), "foreignKey");
                                }

                            } else {

                                vals.idapp = key.idapp;

                                if (key.foreignKey instanceof Array) {

                                    for (const item of key.foreignKey) {
                                        vals[item] = values[item] || values.id;
                                    }

                                } else {
                                    vals[key.foreignKey] = values.id;
                                }

                                keys.push(vals);
                                //--> model ainda não existe, então, criar
                                keys.context = values;

                                sap.ui.getCore().setModel(new sap.ui.model.json.JSONModel(
                                    keys
                                ), "foreignKey");
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
                            content: [new This.listMode.mappingTile.tileContent.content.type(This.listMode.mappingTile.tileContent.content.params(line))]
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

            }

        });
    });
