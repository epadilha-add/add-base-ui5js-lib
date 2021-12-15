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
                 *                  - DE:   appm.home/webapp/component/ add.appm.crud.catalog 
                 *                  - PARA  appm.home/webapp/component/ add.appm.crud.catalog.plans                  
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
                 *   that.collection = "appm0000";                 
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

                if (!that.subtitle)
                    that.subtitle = that.getView().getModel("i18n").getResourceBundle().getText("crudTitle");

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

                that.message = this.message;
                that.onSearchList = this.onSearchList;
                that.getDetail = this.getDetail;
                that.normalize = this.normalize;
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
                }


                let firstPage = that.getMainLayout();

                that.mainContent = new sap.m.NavContainer({
                    pages: [firstPage],
                    initialPage: firstPage
                })

                that.getView().byId(This.IDAPP).addPage(

                    that.mainContent
                );

                This.objectNode = [];

                that.list();

            },

            list: function () {

                This.getView().byId(This.IDAPP).setBusy(true);

                let rows = [];
                var data = {};
                //let model = sap.ui.getCore().getModel("foreignKey");
                let params = {
                    "method": "POST",
                    "actionName": This.collection + ".list"
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

                    params.params = {};
                    params.params.query = {};
                    params.params.query = query;

                } else if (This.foreignKeys) {

                    let pars = { ...This.foreignKeys };
                    delete pars.idapp;
                    delete pars.index;
                    delete pars.title;
                    delete pars.content;
                    params.params = {};
                    params.params = { query: pars }
                }

                This.callService.postSync("add", params).then((resp) => {

                    This.getView().byId(This.IDAPP).setBusy(false);

                    rows = JSON.parse(resp).rows;

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

                    var model = new sap.ui.model.json.JSONModel(data);

                    table.setModel(model, "mainModel");

                    table.setBusy(false);


                }).catch((e) => {

                    table.setBusy(false);

                    This.getView().byId(This.IDAPP).setBusy(false);
                })
            },

            normalize: function (lines) {

                for (const key in lines) {

                    if (lines[key] instanceof Object && lines[key].id) {

                        for (const field of This.listFields) {

                            if (field.field.split('.')[0] !== key) continue;

                            lines[field.field] =
                                lines[field.field.split(".")[0]][field.field.split(".").pop()];
                        }

                        lines[key] = lines[key].id;
                    }
                }

                return lines;
            },
            create: async function (data) {

                This.getView().byId(This.IDAPP).setBusy(true);

                let vals = {};

                for (const key of This.createContext) {
                    vals[key.field] = data[key.field];
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
                                text: "{i18n>write} '" + values[This.IDAPP + This.titleField] + "' {i18n>toConfirm}"
                            }),
                            inpConf]
                    })],

                    beginButton: new sap.m.Button({

                        text: "{i18n>confirm}",

                        press: async function () {

                            if (inpConf.getValue() != values[This.IDAPP + This.titleField]) return;

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

                    if (!This.context.find(l => This.IDAPP + l == key || This.IDAPP + l.field) && key != This.IDAPP + "ID") {

                        continue;

                    } else if (key === This.IDAPP + "ID") {

                        vlas.id = values[key]; continue;

                    }

                    try {
                        //  if (!This.objectNode.find(o => key.split(This.IDAPP).pop())) {
                        vlas[key.split(This.IDAPP).pop()] = values[key];
                        //   } else {
                        //      vlas[key.split(This.IDAPP).pop()] = JSON.parse(values[key]);
                        //  }
                    } catch {
                        // vlas[key.split(This.IDAPP).pop()] = values[key];
                    }


                }

                if (values[This.IDAPP + "ACTIVE"] === true || values[This.IDAPP + "ACTIVE"] === false) {
                    //caso exista campo de ativação, considerar do model
                    vlas.ACTIVE = values[This.IDAPP + "ACTIVE"];
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
                    This.CrudView = new add.appm.crud.Crud(crud, () => This.mainContent.back());
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
                        values[This.IDAPP + key.toUpperCase()] = crud[key];
                }

                var oModel = new sap.ui.model.json.JSONModel(values);

                This.getView().setModel(oModel, This.IDAPP + "PARAM");

                This.mainContent.to(This.CrudView.Page);
            },

            message: function (msg) {

                MessageToast.show(This.getView().getModel("i18n").getResourceBundle().getText(msg || "Nothing here"));
            },

            onSearchList: function (oEvent, list, objectList) {

                var sValue = oEvent.getParameter("newValue");

                let listFilter = [new sap.ui.model.Filter("id", FilterOperator.Contains, sValue)];

                for (const field of this.listFields) {
                    listFilter.push(new sap.ui.model.Filter(field.field, FilterOperator.Contains, sValue));
                }

                var InputFilter = new sap.ui.model.Filter({
                    filters: listFilter,
                    and: false
                });

                table.getBinding("items").filter(InputFilter);

                return;

            },

            getDetail: function (panel) {

                let cells = [];
                let columns = [];

                if (!This.listFields) This.listFields = [{ field: This.titleField }];

                for (const field of This.listFields) {

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
                    minScreenWidth: "1050px",
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
                    busyIndicatorDelay: 20,
                    busyIndicatorSize: sap.ui.core.BusyIndicatorSize.Medium,
                    growingStarted: (e) => {
                        // alert("nothing here")
                    },
                    headerToolbar: (panel) ? new sap.m.Toolbar({
                        content: panel
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

                        press: (oEvent) => {

                            var oModel = oEvent.getSource().oBindingContexts;

                            var values = { ...oModel.mainModel.getObject() };

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

                                                    for (const item of key.foreignKey) {

                                                        components.oData = components.oData.concat(
                                                            [{
                                                                [item]: values[item] || values.id,
                                                                idapp: key.idapp
                                                            }])
                                                    }

                                                } else {
                                                    components.oData = components.oData.concat(
                                                        [{
                                                            [key.foreignKey]: values.id,
                                                            idapp: key.idapp
                                                        }])
                                                }
                                            } else {

                                                if (key.foreignKey instanceof Array) {

                                                    for (const item of key.foreignKey) {
                                                        selectedLine[key.index][item] = values[item] || values.id;
                                                    }

                                                } else {
                                                    selectedLine[key.index][key.foreignKey] = values.id;
                                                }

                                                keys = keys.concat(selectedLine);

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

                                        }

                                        sap.ui.getCore().setModel(new sap.ui.model.json.JSONModel(
                                            keys
                                        ), "foreignKey");

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


                            This.navToCrud(values);

                        },

                        cells: cells
                    })

                });

                return table//, button

            },

            new: async function (oEvent) {

                This.getView().byId(This.IDAPP).setBusy(true);

                var inputs = [];

                for (const key of This.createContext) {

                    if (This.foreignKeys && This.foreignKeys.find(f => f[key.field])) continue;

                    let screenField = await new ScreenElements(This).getElementScreenByName(
                        [
                            key
                        ], This);

                    if (screenField.length === 0) continue;

                    screenField[1].field = key.field;


                    // screenField[1].setWidth("90%");

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
                            for (const field of This.createContext) {
                                if (vals && !vals[field.field]) {
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

                let panelContent = [];

                if (This.foreignKeys && This.foreignKeys.length > 0) {

                    let panelContent = [
                        new sap.m.SearchField({
                            width: "65%",
                            liveChange: (evt) => {
                                This.onSearchList(evt, [], {});
                            }
                        }).addStyleClass("sapUiSmallMarginEnd"),
                        new sap.m.Button({
                            icon: "sap-icon://synchronize",
                            tooltip: "{i18n>refresh}",
                            type: sap.m.ButtonType.Transparent,
                            press: This.refresh
                        }).addStyleClass("sapUiSmallMarginEnd"),

                        new sap.m.Button({
                            icon: "sap-icon://add-document",
                            text: "{i18n>new}",
                            type: sap.m.ButtonType.Transparent,
                            press: This.new,
                        }).addStyleClass("sapUiSmallMarginEnd")
                    ]

                    return This.getDetail(panelContent);
                }

                panelContent = [

                    new sap.m.Button({
                        icon: "sap-icon://synchronize",
                        tooltip: "{i18n>refresh}",
                        press: This.refresh
                    }).addStyleClass("sapUiSmallMarginEnd"),

                    new sap.m.Button({
                        icon: "sap-icon://add-document",
                        text: "{i18n>new}",
                        press: This.new,
                    }).addStyleClass("sapUiSmallMarginEnd"),
                    new sap.m.SearchField({
                        width: "65%",
                        liveChange: (evt) => {
                            This.onSearchList(evt, [], {});
                        }
                    })//.addStyleClass("sapUiSmallMarginEnd")

                ];

                let panel = new sap.ui.layout.HorizontalLayout({
                    //width: "auto",
                    content: panelContent
                });

                let sections = [
                    new sap.uxap.ObjectPageSection({
                        showTitle: false,
                        title: "{i18n>title}",
                        subSections: new sap.uxap.ObjectPageSubSection({
                            blocks: new sap.m.Panel("mainContent" + This.IDAPP, {
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
                            objectTitle: This.title || "{i18n>crudTitle}",
                            //   objectSubtitle: "Nothing here",
                            actions: panel

                        }),//.addStyleClass("ObjectPageLayoutTitle"),

                    headerContent: [
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

        });
    });
