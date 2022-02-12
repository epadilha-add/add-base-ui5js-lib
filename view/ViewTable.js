sap.ui.define([
    "../BaseController",
    "../ui/ScreenElements",
    "../ui/ScreenFactory",
    "../commons/Helpers",
    "./ToolBarButtons",
    "sap/ui/richtexteditor/RichTextEditor",
    "sap/uxap/ObjectPageLayout",
    "sap/ui/table/Table",
], function (Object, ScreenElements, ScreenFactory, Helpers, ToolBarButtons) {
    "use strict";

    let MainView = {};
    let ViewTable = {};
    let promises = [];
    return Object.extend("add.ui5js.ui.ViewTable", {

        constructor: function (that) {

            MainView = that;

            MainView.Helpers = Helpers;

            MainView.tableParts = this.tableParts;

            MainView.execute = this.execute;

            MainView.navToViewTable = this.navToViewTable

            MainView.setModelTable = this.setModelTable;

            MainView.setSelectScreen = this.setSelectScreen;

            MainView.setToolBarTable = MainView.getView().getController()?.setToolBarTable;

            MainView._getselectScreenFilters = () => {

                let selectScreen = {};
                /**
                 * parameters prepare - screenSelect
                 */
                for (const field of MainView.fieldcat) {

                    switch (field.REFTYPE) {
                        case 'LB':
                            selectScreen[field.REFKIND || field.field] = sap.ui.getCore().byId(field.idUi5).getSelectedKey();
                            if (selectScreen[field.REFKIND || field.field].length === 0)
                                selectScreen[field.REFKIND || field.field] = '';
                            break;
                        case 'MC':
                            selectScreen[field.REFKIND || field.field] = {
                                $in: sap.ui.getCore().byId(field.idUi5).getSelectedKeys()
                            }
                            if (selectScreen[field.REFKIND || field.field].$in.length === 0)
                                selectScreen[field.REFKIND || field.field] = '';
                            break;
                        case 'DR':

                            if (!sap.ui.getCore().byId(field.idUi5).getValue()) {
                                selectScreen[field.field] = ''; continue;
                            }

                            let from = sap.ui.core.format.DateFormat.getDateInstance({
                                pattern: "YYYYMMdd"
                            }).format(sap.ui.getCore().byId(field.idUi5).getFrom());

                            let to = sap.ui.core.format.DateFormat.getDateInstance({
                                pattern: "YYYYMMdd"
                            }).format(sap.ui.getCore().byId(field.idUi5).getTo());

                            selectScreen[field.field] = {
                                $gte: parseInt(from),
                                $lte: parseInt(to)
                            }

                            break;
                        default:
                            selectScreen[field.field] = sap.ui.getCore().byId(field.idUi5).getValue();
                            break;
                    }
                }
                return selectScreen;
            }

            MainView.headerToolbar = new sap.m.Toolbar({
                design: "Transparent",
                content: [
                    /*  MainView.avatar,
                     new sap.m.Label({ text: MainView.title }), */
                    new sap.m.Button(
                        {
                            icon: "sap-icon://away",
                            tooltip: "{i18n>execute}",
                            press: MainView.execute
                        }).addStyleClass("sapUiSmallMarginEnd"),
                    new sap.m.ToolbarSeparator(),
                    new sap.m.Button(
                        {
                            blocked: true,
                            icon: "sap-icon://date-time",
                            text: "{i18n>plan}",
                            press: () => { }
                        }).addStyleClass("sapUiSmallMarginEnd"),
                    new sap.m.Button(
                        {
                            blocked: false,
                            icon: "sap-icon://save",
                            text: "{i18n>save}",
                            tooltip: "{i18n>saveLocalVariantTootil}",
                            press: () => {
                                MainView.Helpers
                                    .openDialogToSave(MainView, MainView.IDAPP, 'SC', MainView._getselectScreenFilters());
                            }
                        }),
                    new sap.m.Button(
                        {
                            visible: false,
                            icon: "sap-icon://customize",
                            text: "{i18n>variants}",
                            tooltip: "{i18n>variantsTooltip}",
                            press: () => {
                                MainView.Helpers
                                    .openDialogToList(MainView, MainView.IDAPP, 'SC');
                            }
                        })
                ]
            })

            // configurações iniciais
            if (MainView.setToolBarTable = MainView.getView().getController().doubleClickLineTable) {
                ViewTable.clicks = 0;
                ViewTable.selectedIndex = -1;
            }

            //atalhos para F3 e F9  - nem todos os teclados ou browsers são cmpatíveis
            if (MainView.getView().getController().pressf8 || MainView.getView().getController().pressf3)
                window.onkeyup = function (event) {
                    try {
                        if (event.code == "F8" && MainView.getView().getController().pressf8)
                            MainView.getView().getController().pressf8(event, MainView);
                        if (event.code == "F3" && MainView.getView().getController().pressf3)
                            MainView.getView().getController().pressf3(event, MainView);
                    } catch {
                    }
                }
            return this;
        },

        getColumnByType(catalog, MainView, model) {

            let mdl = (model) ? model + '>' : MainView.IDAPP + 'tab>';

            let link = {};

            if (catalog.HOTSP)
                link = {
                    active: true,
                    press: catalog.prop?.press || (async (oEvent) =>
                        await MainView.getView()
                            .getController()
                            .hotspot(oEvent, MainView, catalog.REFKIND || catalog.FIELD)),
                    state: catalog.prop?.state || {
                        path: mdl + catalog.FIELD,
                        type: catalog.prop?.type || 'sap.ui.model.type.String',
                        formatter: catalog.formatter || ((val) => 'Information')
                    }
                }

            switch (catalog.DATATYPE) {
                case 'QUAN':
                    return new sap.m.ObjectStatus({
                        tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                        active: (catalog.HOTSP) ? true : false,
                        state: {
                            path: mdl + catalog.FIELD,
                            type: 'sap.ui.model.type.Integer',
                            formatter: catalog.formatter || ((val) => (catalog.VKEYM) ? 'Information' : sap.ui.core.ValueState.None)
                        },
                        text: '{' + mdl + catalog.FIELD + '}',
                        ...link,
                        ...catalog.propInclude
                    })

                case 'CHAR':
                    return new sap.m.ObjectStatus({
                        tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                        active: (catalog.HOTSP) ? true : false,

                        state: {
                            path: mdl + catalog.FIELD,
                            type: 'sap.ui.model.type.String',
                            formatter: catalog.formatter || ((val) => (catalog.VKEYM) ? 'Information' : sap.ui.core.ValueState.None)
                        },
                        text: '{' + mdl + catalog.FIELD + '}',
                        ...link,
                        ...catalog.propInclude
                    });
                case 'DATS':
                    return new sap.m.Label({
                        tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                        text: {
                            path: mdl + catalog.FIELD,
                            type: new sap.ui.model.type.Date({ source: {}, pattern: "dd.MM.yyyy" })

                        }, wrapping: false,
                        ...catalog.propInclude
                    });
                case 'TIMS':
                    return new sap.m.Label({
                        tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                        text: {
                            path: mdl + catalog.FIELD,
                            type: new sap.ui.model.type.Time({ source: {}, pattern: "hh.mm.ss" }),

                        }, wrapping: false,
                        ...catalog.propInclude
                    });
                case 'BOOL':
                    return new sap.m.ObjectStatus({
                        tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                        active: (catalog.HOTSP) ? true : false,
                        icon: {
                            parts: [{ path: mdl + catalog.FIELD }],
                            formatter: catalog.formatter || ((val) => (val) ? MainView.ICON_ACTIVE : ""),
                        },
                        ...link,
                        ...catalog.propInclude
                    });
                case 'ICON':

                    return new sap.m.ObjectStatus({
                        tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                        icon: '{' + mdl + catalog.FIELD + '}',
                        active: (catalog.HOTSP) ? true : false,
                        ...link,
                        ...catalog.propInclude
                    });
                case 'CURR':
                    return new sap.m.Label({
                        tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                        wrapping: false,
                        text: {
                            path: mdl + catalog.FIELD,
                            type: catalog.prop?.type || 'sap.ui.model.type.Float',
                            formatOptions: catalog.formatOptions || ({
                                maxIntegerDigits: 15,
                                maxFractionDigits: 2
                            })
                        },
                        ...link,
                        ...catalog.propInclude
                    });
                default:
                    debugger;
                    return new sap.m.Label({
                        tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                        text: '{' + mdl + field.FIELD + '}', wrapping: false,
                        ...catalog.propInclude
                    });

            }


        },
        execute: async function (oEvent) {

            MainView.selectScreenFilters = MainView._getselectScreenFilters();

            if (MainView.obligatoryCheck().checkByData(MainView.selectScreenFilters) === false) return;

            MainView.selectScreen.setBusy(true);

            MainView.headerToolbar.setBlocked(true);

            for (const key in MainView.selectScreenFilters) {
                if (!MainView.selectScreenFilters[key] || MainView.selectScreenFilters[key] === null)
                    delete MainView.selectScreenFilters[key];
            }

            let params = {
                "method": "POST",
                //"timeout": 500000,
                "actionName": MainView.collection + "." + MainView.service || ".list",
                "params": {
                    "pageSize": MainView.pageSize || 100,
                    "query": MainView.selectScreenFilters,
                    ...MainView.callParams
                }

            }

            await MainView.callService.postSync("add", params)
                .then(async (res) => {

                    if (res) {
                        res = JSON.parse(res);
                    } else {
                        throw new TypeError("ERR_TIMEOUT");
                    }

                    if (MainView.service === 'list') {
                        if (res.params)
                            MainView.params = { ...MainView.params, ...res.params };
                        res.DATA = res.rows;
                    }

                    if (res && (MainView.data?.length === 0 || res.length === 0)) {
                        MainView.headerToolbar.setBlocked(false);
                        MainView.selectScreen.setBusy(false);
                        MainView.message("dataNotFound");
                        return;
                    }

                    if (MainView.getView().getController().afterExecute)
                        await MainView.getView().getController().afterExecute(res, MainView);


                    if (MainView.promises) {
                        /**
                         * para o caso de existir pendências setadas no controller, aguardar
                         */
                        MainView.data = res.DATA;
                        Promise.all(MainView.promises).then((r) => {

                            MainView.navToViewTable({ DATA: MainView.data });
                            MainView.selectScreen.setBusy(false);
                            MainView.headerToolbar.setBlocked(false);
                        });

                    } else {
                        /**
                        * para o caso de existir pendências setadas no controller, aguardar
                        */
                        MainView.navToViewTable(res);
                        MainView.selectScreen.setBusy(false);
                        MainView.headerToolbar.setBlocked(false);
                    }

                }).catch((e) => {
                    MainView.headerToolbar.setBlocked(false);
                    MainView.selectScreen.setBusy(false);
                    throw e;
                })

        },
        navToViewTable: function (result) {

            result.that = MainView;

            if (!MainView.View || !MainView.View.Page) {
                //if (MainView.View) MainView.View.destroy();
                MainView.View = MainView.sc.factory(result, () => MainView.mainContent.back());
                MainView.mainContent.addPage(MainView.View.Page);
            } else {
                MainView.obligatoryCheck().setNoneAll();
                //MainView.getView().getController()?.setTableTitle(MainView, MainView.View);
                MainView.data = result.DATA;
                MainView.setModelTable(MainView);
            }

            MainView.mainContent.to(MainView.View.Page);
        },
        tableParts: function (MainView) {

            return {
                toolBar: toolBar
            }


            function toolBar() {

                return {
                    setToolBar: setToolBar
                }

                function setToolBar(table) {

                    table.setToolbar(new sap.m.Toolbar({
                        content: [
                            /**
                             * exmplo de botões  deverão ser implementados
                             * no controller
                             * REF: add.tax.operation.process
                             */
                            _getRefreshButton()
                        ]
                    }))

                    if (MainView.getView().getController().setToolBarTable)
                        MainView.getView().getController().setToolBarTable(table.getToolbar(), MainView, ViewTable);

                    if (MainView.getView().getController().beforeRefresh)
                        resp = MainView.getView().getController().beforeRefresh(resp, MainView);


                    ToolBarButtons.get(MainView).forEach(bt => table.getToolbar().addContent(bt));

                    //TODO: aqui incluir botões comuns da table, como configuração de colunas

                    function _getRefreshButton() {

                        return new sap.m.Button({
                            tooltip: "{i18n>refresh}",
                            icon: "sap-icon://refresh",
                            press: async function (oEvent) {

                                let bt = oEvent.getSource();
                                bt.setBlocked(true);
                                MainView.getView().setBusy(true);

                                await MainView.callService.postSync("add",
                                    {
                                        actionName: MainView.collection + "." + ((MainView.service) ? MainView.service : "list"),
                                        params: { query: { ...MainView.selectScreenFilters, ...MainView.callQuery }, ...MainView.callParams }
                                    })
                                    .then((resp) => {

                                        if (typeof resp === 'string')
                                            resp = JSON.parse(resp);

                                        if (resp.params)
                                            MainView.params = { ...MainView.params, ...resp.params };

                                        if (MainView.getView().getController().afterRefresh)
                                            resp = MainView.getView().getController().afterRefresh(resp, MainView);

                                        MainView.res = resp;
                                        MainView.data = resp.rows || resp.DATA;

                                        _unlock();
                                    }).catch((error) => {
                                        _unlock();
                                        throw new TypeError(error);
                                    })

                                function _unlock() {
                                    MainView.setModelTable(MainView);
                                    MainView.getView().setBusy(false);
                                    bt.setBlocked(false);
                                }

                            }
                        })
                    }
                }
            }

        },
        setModelTable(MainView, line) {

            if (MainView.getView().getController().beforeUpdateModelTable)
                MainView.getView().getController().beforeUpdateModelTable(MainView, line);

            if (line >= 0) {
                let path = MainView.View.table.getContextByIndex(line).sPath;
                let oModel = MainView.View.table.getModel(MainView.IDAPP + 'tab');
                let obj = oModel.getProperty(path);
                obj = MainView.data[line];
                oModel.refresh(true);
            } else {
                let oModel = MainView.View.table.getModel(MainView.IDAPP + 'tab');
                if (oModel) {
                    oModel.setData(MainView.data);
                    oModel.refresh(true);
                } else {
                    MainView.View.table.setModel(new sap.ui.model.json.JSONModel(MainView.data), MainView.IDAPP + 'tab');
                }
            }
            if (MainView.getView().getController().afterUpdateModelTable)
                MainView.getView().getController().afterUpdateModelTable(MainView, line);
        },
        factory: function (params) {

            ViewTable = this;
            MainView.data = params.DATA;

            ViewTable.context = [];

            ViewTable.Screen = new ScreenElements(ViewTable);

            for (const key in params.DATA[0]) {
                ViewTable.context.push({ field: key, COL_POS: ViewTable.context.length })
            }

            let footerContent = []
            if (MainView.getView().getController().getContentFooterTable)
                footerContent = MainView.getView().getController().getContentFooterTable(ViewTable, MainView);

            ViewTable.table = new sap.ui.table.Table({
                busy: true,
                ...MainView.propTable,
                columnResize: (oEvent) => { this.columnResize(oEvent) },
                columnMove: (oEvent) => { this.columnMove(oEvent) },
                footer: new sap.m.OverflowToolbar({ content: footerContent })
            });

            if (MainView.getView().getController().setTableTitle)
                MainView.getView().getController()?.setTableTitle(MainView, ViewTable);

            MainView.tableParts(MainView).toolBar().setToolBar(ViewTable.table);

            ViewTable.table.setModel(new sap.ui.model.json.JSONModel(params.DATA), MainView.IDAPP + 'tab');

            ViewTable.table.bindRows(MainView.IDAPP + 'tab>/');

            if (MainView.getView().getController().setRowSettingsTemplateTable)
                MainView.getView().getController().setRowSettingsTemplateTable(ViewTable.table, MainView);

            this.buildColumns(ViewTable, MainView);

            MainView.getView().setBusy(true);

            this.title = new sap.m.Label({
                text: params[MainView.title] || MainView.title || null
            });

            this.avatar = new sap.m.Avatar({
                src: MainView.icon,
                displaySize: sap.m.AvatarSize.XS,
                //backgroundColor: sap.m.AvatarColor.Accent1,
                tooltip: MainView.IDAPP
            });

            this.avatar.ondblclick = () => {

            }

            if (MainView.upButton || MainView.upButton === undefined)
                MainView.upButton = new sap.m.Button({
                    icon: 'sap-icon://slim-arrow-up', tooltip: '{i18n>openWindow}', visible: true, press: (oEvent) => {

                        let urlParams = new URLSearchParams(window.location.search);
                        urlParams.set('app', MainView.IDAPP);
                        if (params.id)
                            urlParams.set('id', params.id);
                        urlParams.set('tb', "0"); //"turn-off toolbar"
                        urlParams.set('nIO', "1"); // "turn-on navIfOne"

                        window.open("?" + urlParams.toString());
                        return;

                    }
                })
            this.Bar = new sap.m.Bar({
                contentLeft: [MainView.btBack, this.avatar, this.title],
                contentMiddle: [MainView.upButton],
                contentRight: []
            })

            this.Page = new sap.m.Page({
                showHeader: false,
                subHeader: this.Bar,
                showSubHeader: true,
                showNavButton: false,
                icon: MainView.icon,
                content: ViewTable.table
            });
            /*********************************************
             * construir elementos de tela
             ********************************************/
            sap.ui.core.BusyIndicator.hide();

            MainView.getView().setBusy(false);

            if (MainView.getView().getController().doubleClickLineTable) {
                ViewTable.table.attachBrowserEvent("dblclick",
                    MainView.getView().getController().doubleClickLineTable(ViewTable, MainView).onDblClick);
                ViewTable.table.attachBrowserEvent("click",
                    MainView.getView().getController().doubleClickLineTable(ViewTable, MainView).onClick);
            }

            if (MainView.getView().getController().afterRenderingTable)
                MainView.getView().getController().afterRenderingTable(MainView, ViewTable);

            return this;
        },
        columnResize: async function (oEvent) {
            let cat = MainView.View.fieldcat
                .find(c => c.FIELD === oEvent.getParameter('column').getProperty('filterProperty'))
            if (cat)
                cat.width = oEvent.getParameter('width');
        },
        columnMove: async function (oEvent) {

            let catm = MainView.View.fieldcat
                .find(c => c.FIELD === oEvent.getParameter('column').getProperty('filterProperty'))

            if (catm)
                catm.COL_POS = oEvent.getParameter('newPos');

            oEvent.getSource().getColumns().forEach(c => {
                let cat = MainView.View.fieldcat.find(ct => ct.FIELD === c.getProperty('filterProperty'))
                if (c.getIndex() > catm.COL_POS) {
                    cat.COL_POS = c.getIndex() + 1;
                } else {
                    cat.COL_POS = c.getIndex();
                }
            })
        },
        buildColumns: async function (ViewTable, MainView) {

            let catalog = await MainView.Helpers
                .getLastUsedVariant(MainView.IDAPP + "LIST", 'LY', MainView);

            if (catalog?.content)
                ViewTable.fieldcat = catalog?.content;

            promises = [Promise.resolve(ViewTable.Screen
                .getStruc(ViewTable.context, true).then((data) => {
                    if (!data) { console.error("ERR_GET_STRUCT_FAILED"); return }

                    if (!ViewTable.fieldcat) {
                        ViewTable.fieldcat = (typeof data === 'string') ?
                            JSON.parse(data) : data;
                    } else {

                        ViewTable.fieldcat = ViewTable.fieldcat.concat(((typeof data === 'string') ?
                            JSON.parse(data) : data).filter(d => !ViewTable.fieldcat.find(c => d.FIELD)) || []);
                    }
                    ViewTable.fieldcat = ViewTable.fieldcat.sort((a, b) => {
                        return (b.COL_POS < a.COL_POS) ? 1 : -1;
                    });

                    for (const field of ViewTable.fieldcat) {

                        if (MainView.getView().getController().addColumnTable) {

                            MainView.getView().getController()?.addColumnTable(field, ViewTable, MainView);

                        } else {

                            let oControl = new sap.m.Text({ text: '{' + MainView.IDAPP + 'tab>' + field.FIELD + '}', wrapping: false });
                            let label = field.SCRTEXT_S || field.SCRTEXT_M || field.SCRTEXT_L || field.DESCR;
                            let oColumn = new sap.ui.table.Column(
                                {
                                    width: field.width || 'auto',
                                    minWidth: 48,
                                    label: new sap.m.Label({ text: label, wrapping: false }),
                                    autoResizable: true,
                                    template: oControl,
                                    tooltip: field.SCRTEXT_L + " " + field.FIELD,
                                    sortProperty: field.FIELD,
                                    filterProperty: field.FIELD,
                                    autoResizable: true,
                                    //grouped: true

                                });

                            field.idUi5Column = oColumn.getId();

                            oColumn.setCreationTemplate(new sap.m.Input({ value: '{' + MainView.IDAPP + 'tab>' + field.FIELD + '}' }));

                            ViewTable.table.addColumn(oColumn);
                        }

                    };

                    ViewTable.table.setBusy(false);

                }))]

            Promise.all(promises);
        },
        getContent: function (promises) {

            MainView.selectScreen = new sap.m.Panel({
                headerText: null,//new sap.m.Label({ text: MainView.title }),
                headerToolbar: MainView.headerToolbar,
                content: new sap.ui.layout.form.SimpleForm({
                    width: '65%',
                    editable: true,
                    layout: "ResponsiveGridLayout",
                    columnsM: 2,
                    columnsL: 2,
                    columnsXL: 2
                })
            }
            );

            MainView.selectScreen.setBusyIndicatorDelay(50);
            MainView.selectScreen.setBusy(true);

            Promise.all(promises).then(async (data) => {

                new ScreenElements(MainView).set(MainView.context, MainView);

                if (MainView.Helpers) {

                    MainView.selectScreenFilters =
                        await MainView.Helpers
                            .getLastUsedVariant(MainView.IDAPP, 'SC', MainView);

                    if (MainView.selectScreenFilters) {

                        MainView.headerToolbar.getContent()[4].setVisible(true);

                        MainView.setSelectScreen(MainView.selectScreenFilters?.content);

                    }
                } else { throw new TypeError("ERR_HELPERS_NOT_FOUND_IN_CONTROLLER") }
                MainView.selectScreen.setBusy(false);
            })

            return MainView.selectScreen;

        },
        setSelectScreen(content) {
            for (const fld in content) {

                let el = sap.ui.getCore().byId(MainView.fieldcat.find(f => fld === (f.REFKIND || f.FIELD))?.idUi5);

                switch (el?.REFTYPE) {
                    case 'LB':
                        el.setSelectedKey(content[fld]);
                        break;
                    case 'MC':
                        el.setSelectedKeys(content[fld]?.$in);
                        break;
                    case 'DR':
                        let f = String(content[fld]?.$gte);
                        let t = String(content[fld]?.$lte);
                        el.setFrom(new Date(
                            parseInt(f.substring(0, 4)),
                            parseInt(f.substring(4, 6)) - 1,//month: from 0 to 11, so subtract one
                            parseInt(f.substring(6, 8))
                        ));
                        el.setTo(new Date(
                            parseInt(t.substring(0, 4)),
                            parseInt(t.substring(4, 6)) - 1, //month: from 0 to 11, so subtract one
                            parseInt(t.substring(6, 8))
                        ));
                        break;
                    default:
                        if (el)
                            el.setValue(content[fld]);
                        break;
                }
            }
        },
        async removeBtEvents() {

        }

    })

});