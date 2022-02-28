sap.ui.define(
    [
        "../BaseController",
        "../ui/ScreenElements",
        "../ui/ScreenFactory",
        "../commons/Helpers",
        "./ToolBarButtons",
        "../view/JobPlanning",
        "../view/DocumentView",
        "../commons/FieldsCatalog",
        "sap/ui/richtexteditor/RichTextEditor",
        "sap/uxap/ObjectPageLayout",
        "sap/ui/table/Table",
    ],
    function (Object, ScreenElements, ScreenFactory, Helpers, ToolBarButtons, Job, DocumentView, FieldsCatalog) {
        "use strict";

        let MainView = {};
        let ViewTable = {};
        let promises = [];
        return Object.extend("add.ui5js.ui.ViewTable", {
            constructor: function (that) {
                MainView = that;
                MainView.ToolBarButtons = ToolBarButtons;
                MainView.getFieldByType = FieldsCatalog.getFieldByType;
                MainView.Helpers = Helpers;
                MainView.tableParts = this.tableParts;
                MainView.execute = MainView.getView().getController().execute || this.execute;
                MainView.log = MainView.getView().getController().log || this.log;
                MainView.navToViewTable = this.navToViewTable;
                MainView.setModelTable = MainView.getView().getController().setModelTable || this.setModelTable;
                MainView.setSelectScreen = this.setSelectScreen;
                MainView.formatter = MainView.getView().getController().formatter || this.formatter;
                //MainView.getSelectScreenFilters = this.getSelectScreenFilters;
                MainView.planScreen = this.planScreen;
                MainView.getParamsExecute = this.getParamsExecute;

                MainView.headerToolbar = new sap.m.Toolbar({
                    design: "Transparent",
                    content: [
                        new sap.m.Button({
                            icon: "sap-icon://away",
                            tooltip: "{i18n>execute}",
                            press: MainView.execute,
                        }).addStyleClass("sapUiSmallMarginEnd"),
                        new sap.m.ToolbarSeparator(),

                        ...(MainView.JobPlanning ? Job.get(MainView) : []),

                        new sap.m.Button({
                            blocked: false,
                            icon: "sap-icon://save",
                            text: "{i18n>save}",
                            tooltip: "{i18n>saveLocalVariantTootil}",
                            press: () => {
                                MainView.Helpers.openDialogToSave(MainView, MainView.IDAPP, "SC", MainView.getSelectScreenFilters(MainView));
                            },
                        }),
                        new sap.m.Button({
                            visible: false,
                            icon: "sap-icon://customize",
                            text: "{i18n>variants}",
                            tooltip: "{i18n>variantsTooltip}",
                            press: () => {
                                MainView.Helpers.openDialogToList(MainView, MainView.IDAPP, "SC");
                            },
                        }),
                    ],
                });
                //atalhos para F3 e F9  - nem todos os teclados ou browsers são cmpatíveis
                if (MainView.getView().getController().pressf8 || MainView.getView().getController().pressf3)
                    window.onkeyup = function (event) {
                        try {
                            if (event.code == "F8" && MainView.getView().getController().pressf8) MainView.getView().getController().pressf8(event, MainView);
                            if (event.code == "F3" && MainView.getView().getController().pressf3) MainView.getView().getController().pressf3(event, MainView);
                        } catch { }
                    };
                return this;
            },

            getParamsExecute() {
                let filters = { ...MainView.selectScreenFilters };
                delete filters.MAXROWS;

                return {
                    method: "POST",
                    //"timeout": 500000,
                    actionName: MainView.collection + "." + MainView.service || ".list",
                    params: {
                        pageSize: MainView.pageSize || MainView.selectScreenFilters["MAXROWS"] || 100,
                        query: MainView.query || {
                            ...filters,
                            ...MainView.queryInclude,
                        },
                        ...MainView.callParams,
                    },
                };
            },
            getColumnByType: function (catalog, MainView, model) {
                return MainView.getFieldByType(catalog, MainView, model);
            },
            execute: async function (oEvent, externalQuery) {
                MainView.selectScreenFilters = MainView.getSelectScreenFilters(MainView);

                if (MainView.obligatoryCheck().checkByData(MainView.selectScreenFilters) === false) return;

                MainView.selectScreen.setBusy(true);

                MainView.headerToolbar.setBlocked(true);

                for (const key in MainView.selectScreenFilters) {
                    if (!MainView.selectScreenFilters[key] || MainView.selectScreenFilters[key] === null) delete MainView.selectScreenFilters[key];
                }

                let params = externalQuery || MainView.getParamsExecute();

                if (MainView.getView().getController().beforeExecute) {
                    await MainView.getView().getController().beforeExecute(params, MainView)
                }

                await MainView.callService
                    .postSync("add", params)
                    .then(async res => {
                        if (res) {
                            res = JSON.parse(res);
                        } else {
                            throw new TypeError("ERR_TIMEOUT");
                        }

                        if (MainView.service === "list") {
                            if (res.params) MainView.params = { ...MainView.params, ...res.params };
                            res.DATA = res.rows;
                        }

                        if (MainView.showLogAfterExecute === true) {
                            MainView.log().showLog(res.TAXDO, MainView);
                        }

                        if (MainView.getView().getController().afterExecute) {
                            await MainView.getView().getController().afterExecute(res, MainView);
                        }

                        if (!res || !res.DATA || res.DATA.length === 0 || res === 0) {
                            MainView.headerToolbar.setBlocked(false);
                            MainView.selectScreen.setBusy(false);
                            MainView.message("dataNotFound");
                            return;
                        }

                        if (MainView.promises) {
                            /**
                             * para o caso de existir pendências setadas no controller, aguardar
                             */
                            MainView.data = res.DATA;
                            Promise.all(MainView.promises).then(r => {
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
                    })
                    .catch(e => {
                        MainView.headerToolbar.setBlocked(false);
                        MainView.selectScreen.setBusy(false);
                        throw e;
                    });
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
                    toolBar: toolBar,
                };

                function toolBar() {
                    return {
                        setToolBar: setToolBar,
                    };

                    function setToolBar(table) {
                        table.setToolbar(
                            new sap.m.Toolbar({
                                content: [
                                    /**
                                     * exmplo de botões  deverão ser implementados
                                     * no controller
                                     * REF: add.tax.operation.process
                                     */
                                    _getRefreshButton(),
                                ],
                            })
                        );

                        if (MainView.getView().getController().setToolBarTable) {
                            MainView.getView().getController().setToolBarTable(table.getToolbar(), MainView, ViewTable);
                        }

                        if (MainView.getView().getController().beforeRefresh) {
                            resp = MainView.getView().getController().beforeRefresh(resp, MainView);
                        }

                        MainView.JobPlanning ? Job.get(MainView).forEach(bt => table.getToolbar().addContent(bt, true)) : [];

                        if (MainView.treeView)
                            table.getToolbar().addContent(
                                _getDocumentViewButton(
                                    MainView.treeView.icon,
                                    MainView.treeView.topRight,
                                    MainView.treeView.lowerLeft,
                                    MainView.treeView.factory,
                                    MainView.treeView.title)
                            );

                        if (MainView.documentView)
                            table.getToolbar().addContent(
                                _getDocumentViewButton(
                                    MainView.documentView.icon,
                                    MainView.documentView.topRight,
                                    MainView.documentView.lowerLeft,
                                    MainView.documentView.factory,
                                    MainView.documentView.title)
                            );

                        ToolBarButtons.get(MainView).forEach(bt => table.getToolbar().addContent(bt));

                        //TODO: aqui incluir botões comuns da table, como configuração de colunas

                        function _getRefreshButton() {
                            return new sap.m.Button({
                                tooltip: "{i18n>refresh}",
                                icon: "sap-icon://refresh",
                                press: MainView.getView().getController().refresh
                                    ? async oEvent => {
                                        await MainView.getView().getController().refresh(oEvent, MainView);
                                    }
                                    : async function (oEvent) {
                                        let bt = oEvent.getSource();
                                        bt.setBlocked(true);
                                        MainView.getView().setBusy(true);

                                        let filters = { ...MainView.selectScreenFilters };
                                        delete filters.MAXROWS;

                                        const params = {
                                            actionName: MainView.collection + "." + (MainView.service ? MainView.service : "list"),
                                            params: {
                                                pageSize: MainView.pageSize || MainView.selectScreenFilters["MAXROWS"] || 100,
                                                query: MainView.query || {
                                                    ...filters,
                                                    ...MainView.queryInclude,
                                                },
                                                ...MainView.callParams,
                                            },
                                        };

                                        await MainView.callService
                                            .postSync("add", params)
                                            .then(async resp => {
                                                if (typeof resp === "string") resp = JSON.parse(resp);

                                                if (resp.params)
                                                    MainView.params = {
                                                        ...MainView.params,
                                                        ...resp.params,
                                                    };

                                                if (MainView.service === "list") {
                                                    if (resp.params) MainView.params = { ...MainView.params, ...resp.params };
                                                    resp.DATA = resp.rows;
                                                }

                                                if (MainView.getView().getController().afterRefresh) {
                                                    await MainView.getView().getController().afterRefresh(resp, MainView);
                                                }

                                                //MainView.res = resp;
                                                MainView.data = resp.rows || resp.DATA;

                                                _unlock();
                                            })
                                            .catch(error => {
                                                _unlock();
                                                throw new TypeError(error);
                                            });

                                        function _unlock() {
                                            MainView.setModelTable(MainView);
                                            MainView.getView().setBusy(false);
                                            bt.setBlocked(false);
                                        }
                                    },
                            });
                        }

                        function _getDocumentViewButton(icon, totRight, lowerLeft, factory, title) {
                            return new DocumentView(MainView, icon, totRight, lowerLeft, factory, title);
                        }
                    }
                }
            },
            setModelTable(MainView, line) {
                if (MainView.getView().getController().beforeUpdateModelTable) MainView.getView().getController().beforeUpdateModelTable(MainView, line);

                if (line >= 0) {
                    let path = MainView.View.table.getContextByIndex(line).sPath;
                    let oModel = MainView.View.table.getModel(MainView.IDAPP + "tab");
                    let obj = oModel.getProperty(path);
                    obj = MainView.data[line];
                    oModel.refresh(true);
                } else {
                    let oModel = MainView.View.table.getModel(MainView.IDAPP + "tab");
                    if (oModel) {
                        oModel.setData(MainView.data);
                        oModel.refresh(true);
                    } else {
                        MainView.View.table.setModel(new sap.ui.model.json.JSONModel(MainView.data), MainView.IDAPP + "tab");
                    }
                }
                if (MainView.getView().getController().afterUpdateModelTable) MainView.getView().getController().afterUpdateModelTable(MainView, line);
            },
            factory: function (params) {
                ViewTable = this;
                // configurações iniciais
                if (MainView.getView().getController().doubleClickLineTable) {
                    ViewTable.clicks = 0;
                    ViewTable.selectedIndex = -1;
                }

                MainView.data = params.DATA;

                ViewTable.context = [];

                ViewTable.Screen = new ScreenElements(ViewTable);

                for (const key in params.DATA[0]) {
                    ViewTable.context.push({ field: key, COL_POS: ViewTable.context.length });
                }

                let footerContent = [];
                if (MainView.getView().getController().getContentFooterTable) footerContent = MainView.getView().getController().getContentFooterTable(ViewTable, MainView);

                ViewTable.table = new sap.ui.table.Table({
                    busy: true,
                    ...MainView.propTable,
                    columnResize: oEvent => {
                        this.columnResize(oEvent);
                    },
                    columnMove: oEvent => {
                        this.columnMove(oEvent);
                    },
                    footer: new sap.m.OverflowToolbar({ content: footerContent }),
                });

                if (MainView.getView().getController().setTableTitle) MainView.getView().getController()?.setTableTitle(MainView, ViewTable);

                MainView.tableParts(MainView).toolBar().setToolBar(ViewTable.table);

                ViewTable.table.setModel(new sap.ui.model.json.JSONModel(params.DATA), MainView.IDAPP + "tab");

                ViewTable.table.bindRows(MainView.IDAPP + "tab>/");

                if (MainView.getView().getController().setRowSettingsTemplateTable) MainView.getView().getController().setRowSettingsTemplateTable(ViewTable.table, MainView);

                ViewTable.table.setBusy(true);
                this.buildColumns(ViewTable, MainView);

                MainView.getView().setBusy(true);

                this.title = new sap.m.Label({
                    text: params[MainView.title] || MainView.title || null,
                });

                this.avatar = new sap.m.Avatar({
                    src: MainView.icon,
                    displaySize: sap.m.AvatarSize.XS,
                    //backgroundColor: sap.m.AvatarColor.Accent1,
                    tooltip: MainView.IDAPP,
                });

                this.avatar.ondblclick = () => { };

                if (MainView.upButton || MainView.upButton === undefined)
                    MainView.upButton = new sap.m.Button({
                        icon: "sap-icon://slim-arrow-up",
                        tooltip: "{i18n>openWindow}",
                        visible: true,
                        press: oEvent => {
                            let urlParams = new URLSearchParams(window.location.search);
                            urlParams.set("app", MainView.IDAPP);
                            if (params.id) urlParams.set("id", params.id);
                            urlParams.set("tb", "0"); //"turn-off toolbar"
                            urlParams.set("nIO", "1"); // "turn-on navIfOne"

                            window.open("?" + urlParams.toString());
                            return;
                        },
                    });
                this.Bar = new sap.m.Bar({
                    contentLeft: [MainView.btBack, this.avatar, this.title],
                    contentMiddle: [MainView.upButton],
                    contentRight: [],
                });

                MainView.contentViewTable = MainView.sideContentTable
                    ? new sap.ui.layout.DynamicSideContent({ mainContent: ViewTable.table, sideContent: MainView.sideContentTable || [], ...MainView.propSideContentTable })
                    : ViewTable.table;

                this.Page = new sap.m.Page({
                    showHeader: false,
                    subHeader: this.Bar,
                    showSubHeader: true,
                    showNavButton: false,
                    icon: MainView.icon,
                    content: MainView.contentViewTable,
                });
                /*********************************************
                 * construir elementos de tela
                 ********************************************/
                sap.ui.core.BusyIndicator.hide();

                MainView.getView().setBusy(false);

                if (MainView.getView().getController().doubleClickLineTable) {
                    ViewTable.table.attachBrowserEvent("dblclick", MainView.getView().getController().doubleClickLineTable(ViewTable, MainView).onDblClick);
                    ViewTable.table.attachBrowserEvent("click", MainView.getView().getController().doubleClickLineTable(ViewTable, MainView).onClick);
                }

                if (MainView.getView().getController().afterRenderingTable) MainView.getView().getController().afterRenderingTable(MainView, ViewTable);

                return this;
            },
            columnResize: async function (oEvent) {
                let cat = MainView.View.fieldcat.find(c => c.FIELD === oEvent.getParameter("column").getProperty("filterProperty"));
                if (cat) cat.width = oEvent.getParameter("width");
            },
            columnMove: async function (oEvent) {
                const ctm = MainView.View.fieldcat.find(c => c.FIELD === oEvent.getParameter("column").getProperty("filterProperty"));

                if (ctm) ctm.COL_POS = oEvent.getParameter("newPos");

                const currentPos = ctm.COL_POS;

                for (const c of oEvent.getSource().getColumns()) {
                    let cat = MainView.View.fieldcat.find(ct => ct.FIELD === c.getProperty("filterProperty") && ct.FIELD !== ctm.FIELD);

                    if (!cat) continue;

                    if (c.getIndex() >= currentPos) {
                        cat.COL_POS = (cat.COL_POS || c.getIndex()) + 1;
                    } else {
                        cat.COL_POS = c.getIndex();
                    }
                };

                MainView.View.fieldcat.sort((a, b) => a.COL_POS - b.COL_POS);
            },
            buildColumns: async function (ViewTable, MainView) {
                //  await MainView.setFn("getFieldByType");
                /**
                 * verifica se exise alguma variante do usuário
                 */
                let catalog = await MainView.Helpers.getLastUsedVariant(MainView.IDAPP + "LIST", "LY", MainView);

                if (catalog?.content) ViewTable.fieldcat = catalog?.content;

                promises = [
                    Promise.resolve(
                        ViewTable.Screen.getStruc(ViewTable.context, true, { actionName: "TAXP0600" }).then(data => {
                            if (!data) {
                                console.error("ERR_GET_STRUCT_FAILED");
                                ViewTable.table.setBusy(false);
                                return;
                            }
                            data = typeof data === "string" ? JSON.parse(data) : data;
                            if (!ViewTable.fieldcat) {
                                /**
                                 * não existem dados de variantes, portanto considerar do servidor
                                 */
                                ViewTable.fieldcat = data;
                            } else {
                                /**
                                 * somente considerar os campos que a variante não posssui
                                 */
                                ViewTable.fieldcat.sort((a, b) => {
                                    return b.COL_POS > a.COL_POS ? -1 : 1;
                                });
                                for (const ncat of data) {
                                    if (!ViewTable.fieldcat.find(f => f.FIELD === ncat.FIELD)) {
                                        ViewTable.fieldcat.push(ncat);
                                    }
                                }
                            }


                            for (const field of ViewTable.fieldcat.filter(f => f.VISIBLE)) {
                                /*
                                 * aqui faz a leitura para que configurações do servidor sejam
                                 * consideradas no layout  para casos onde a variante tenha
                                 * algum valor desatualizado
                                 */
                                let currentConfig = data.find(cf => cf.FIELD === field.FIELD);
                                if (!currentConfig) continue;
                                currentConfig.width = field.width;
                                currentConfig.COL_POS = field.COL_POS;

                                if (MainView.getView().getController().addColumnTable) {
                                    /**
                                     * configuraçẽos do controller
                                     */
                                    MainView.getView()
                                        .getController()
                                        ?.addColumnTable(currentConfig || field, ViewTable, MainView);
                                } else {
                                    /**
                                     * configuraçẽos standard Add
                                     */
                                    this.addColumn(currentConfig || field, ViewTable, MainView);
                                }
                            }

                            ViewTable.table.setBusy(false);
                        })
                    ),
                ];

                // Promise.all(promises);
            },

            hotspot: async function (oEvent, MainView, field) {
                MainView.getView().setBusy(true);
                /**
                 * obtem informações da linha selecionada
                 */
                var index = oEvent.getSource().getParent().getIndex();
                var path = MainView.View.table.getContextByIndex(index).getPath();
                var lineTable = MainView.View.table.getContextByIndex(index).getProperty(path);
                var value = lineTable[field];

                if (!MainView["H0600" + field]) {
                    /**
                     * construir a função caso ainda não esteja instanciada
                     */
                    try {
                        MainView["H0600" + field] = await MainView.buildFn("H0600" + field);
                    } catch (error) {
                        MainView.getView().setBusy(false);
                        console.log(error);
                        return;
                    }
                }
                if (MainView["H0600" + field] instanceof Function) {
                    /**
                     * invoca função passando o valor da coluna selecionada, a linha completa da tabela e a MainView
                     */
                    await MainView["H0600" + field](value, lineTable, MainView);
                    /**
                     * atualiza o model da linha para o caso de a mesma ter sofrido alteração dentro da exit
                     */
                    MainView.View.table.getContextByIndex(index).getModel().setProperty(path, lineTable);
                }
                MainView.getView().setBusy(false);
            },

            log: function (MainView, ViewTable) {
                return {
                    getLog: getLog,
                    showLog: showLog,
                };

                async function getLog(oEvent, externalQuery) {
                    let bt = oEvent.getSource();
                    bt.setBlocked(true);
                    MainView.getView().setBusy(true);

                    let lines = ViewTable.table.getSelectedIndices();
                    if (!lines || lines.length === 0) {
                        ViewTable.table.setSelectedIndex(0);
                        lines = ViewTable.table.getSelectedIndices();
                    }

                    let query = {
                        D0000: {
                            $in: [],
                        },
                    };

                    if (!externalQuery) {
                        for (const iterator of lines) {
                            query.D0000.$in.push(MainView.data[iterator].D0000);
                        }
                        if (query.D0000.$in.length === 0) return;
                    }

                    await MainView.callService
                        .postSync("add", {
                            actionName: "TAXDO.list",
                            params: {
                                pageSize: MainView.pageSizeLog || 100,
                                query: externalQuery || query,
                                sort: "-CREDAT",
                            },
                        })
                        .then(resp => {
                            if (typeof resp === "string") resp = JSON.parse(resp);
                            bt.setBlocked(false);
                            MainView.getView().setBusy(false);
                            if (resp.rows)
                                MainView.getView()
                                    .getController()
                                    .log()
                                    .showLog(
                                        resp.rows
                                            .map(r => MainView.populate(r))
                                            .sort((a, b) => {
                                                return parseInt(a.CREDAT) > parseInt(b.CREDAT) ? -1 : 1;
                                            }),
                                        MainView
                                    );
                        })
                        .catch(error => {
                            bt.setBlocked(false);
                            MainView.getView().setBusy(false);
                            throw error;
                        });
                }

                async function showLog(rows, MainView) {
                    if ((rows && rows.length === 0) || !rows || rows === 0) {
                        MainView.message("logNotFound");
                        return;
                    }

                    if (!MainView.fieldcatLog) {
                        MainView.tabLog = new sap.ui.table.Table({
                            width: "100%",
                            //columnHeaderHeight: 20,
                            //visibleRowCountMode: "Auto",
                            enableGrouping: true,
                            visibleRowCount: 10,
                            selectionMode: sap.ui.table.SelectionMode.Single,
                            enableColumnReordering: true,
                            //fixedBottomRowCount: 1,
                        });

                        await new ScreenElements(MainView)
                            .getStruc(
                                [
                                    { field: "STATU" },
                                    { field: "DESCR" },
                                    { field: "PROCX" },
                                    { field: "DTOCC" },
                                    { field: "HROCC" },
                                    { field: "INDOC" },
                                    { field: "DESCR" },
                                    { field: "ERNAM" },
                                    { field: "D0000" },
                                ],
                                true,
                                true
                            )
                            .then(data => {
                                if (!data) {
                                    console.error("ERR_GET_STRUCT_FAILED");
                                    return;
                                }

                                MainView.fieldcatLog = JSON.parse(data);

                                MainView.tabLog.setRowSettingsTemplate(
                                    new sap.ui.table.RowSettings({
                                        highlight: {
                                            parts: [{ path: "TPMSG" }],
                                            formatter: MainView.formatter().TPMSG,
                                        },
                                    })
                                );

                                for (let field of MainView.fieldcatLog) {
                                    let oControl = {};

                                    switch (field.FIELD) {
                                        case "DESCR":
                                            oControl = new sap.m.Text({
                                                text: {
                                                    parts: [{ path: "DESCR" }, { path: "STATU" }],
                                                    formatter: MainView.formatter().DESCR,
                                                },
                                                wrapping: false,
                                            });

                                            break;
                                        case "STATU":
                                            oControl = new sap.m.ObjectStatus({
                                                // title: '{' + field.FIELD + '}',
                                                text: "{" + field.FIELD + "}",
                                                state: { parts: [{ path: "TPMSG" }], formatter: MainView.formatter().TPMSG },
                                            });
                                            break;

                                        default:
                                            oControl = new sap.m.Text({ text: "{" + field.FIELD + "}", wrapping: false });
                                            break;
                                    }
                                    let label = field.SCRTEXT_S || field.SCRTEXT_M || field.SCRTEXT_L || field.DESCR;
                                    let leng = parseInt(field.OUTPUTLEN) ? parseInt(field.OUTPUTLEN) + "rem" : "auto";
                                    let oColumn = new sap.ui.table.Column({
                                        width: leng,
                                        minWidth: 48,
                                        label: new sap.m.Label({ text: label, wrapping: false }),
                                        autoResizable: true,
                                        template: oControl,
                                        tooltip: field.SCRTEXT_L + " " + field.FIELD,
                                        sortProperty: field.FIELD,
                                        filterProperty: field.FIELD,
                                        autoResizable: true,
                                        // grouped: true
                                    });

                                    oColumn.setCreationTemplate(new sap.m.Input({ value: "{" + field.FIELD + "}" }));

                                    MainView.tabLog.addColumn(oColumn);
                                }
                            });
                    }

                    //this.tabLog.setTitle("Total: " + table?.length || 0)
                    MainView.tabLog.setModel(new sap.ui.model.json.JSONModel(rows));

                    MainView.tabLog.bindRows("/");

                    const messageDialog = new sap.m.Dialog({
                        title: "{i18n>occurrenceLog}  " + " - Total: " + rows?.length || 0,
                        icon: "sap-icon://activity-items",
                        verticalScrolling: true,
                        horizontalScrolling: true,
                        showHeader: true,
                        contentHeight: "45%",
                        contentWidth: "80%",
                        resizable: true,
                        //type: sap.m.DialogType.Message,
                        content: new sap.m.Page({
                            showHeader: false,
                            enableScrolling: false,
                            content: [MainView.tabLog],
                        }),

                        leftButton: new sap.m.Button({
                            text: "Ok",
                            press: function () {
                                messageDialog.close();
                            },
                        }),
                    });

                    MainView.getView().addDependent(messageDialog);

                    messageDialog.open();
                }
            },
            formatter: function () {
                return {
                    DESCR: (DESCR, STATU) => {
                        return STATU + ":" + DESCR;
                    },
                    INFORMATION: () => "Information",

                    TPMSG: TPMSG => {
                        switch (TPMSG) {
                            case "E":
                                return "Error";
                                break;
                            case "W":
                                return "Warning";
                                break;
                            case "S":
                                return "Success";
                                break;
                            default:
                                //case "I":
                                return "Information";
                                break;
                        }
                    },
                };
            },
            addColumn: function (field, ViewTable, MainView) {
                let oControl = ViewTable.getColumnByType(field, MainView, MainView.IDAPP + "tab");

                let label = field.SCRTEXT_S || field.SCRTEXT_M || field.SCRTEXT_L || field.DESCR;
                let oColumn = new sap.ui.table.Column({
                    width: field.width || "auto",
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

                oColumn.setCreationTemplate(new sap.m.Input({ value: "{" + MainView.IDAPP + "tab>" + field.FIELD + "}" }));

                ViewTable.table.addColumn(oColumn);
            },
            getContent: function (promises) {
                MainView.selectScreen = new sap.m.Panel({
                    headerText: null, //new sap.m.Label({ text: MainView.title }),
                    headerToolbar: MainView.headerToolbar,
                    content: new sap.ui.layout.form.SimpleForm({
                        width: "60%",
                        editable: true,
                        layout: "ResponsiveGridLayout",
                        columnsM: 1,
                        columnsL: 1,
                        columnsXL: 1,
                    }),
                });

                MainView.selectScreen.setBusyIndicatorDelay(50);
                MainView.selectScreen.setBusy(true);

                Promise.all(promises).then(async data => {
                    new ScreenElements(MainView).set(MainView.context, MainView);

                    if (MainView.Helpers) {
                        MainView.selectScreenFilters = await MainView.Helpers.getLastUsedVariant(MainView.IDAPP, "SC", MainView);

                        if (MainView.selectScreenFilters) {
                            MainView.headerToolbar.getContent()[4].setVisible(true);

                            MainView.setSelectScreen(MainView.selectScreenFilters?.content);
                        }
                    } else {
                        throw new TypeError("ERR_HELPERS_NOT_FOUND_IN_CONTROLLER");
                    }

                    MainView.selectScreen.setBusy(false);
                });

                MainView.contentScreen = MainView.propSideContentScreen
                    ? new sap.ui.layout.DynamicSideContent({
                        mainContent: MainView.selectScreen,
                        sideContent: this.getSideContentScreen(MainView),
                        ...MainView.propSideContentScreen,
                    })
                    : MainView.selectScreen;

                return MainView.contentScreen;
            },

            getSideContentScreen: function (MainView) {
                if (MainView.getView().getController().sideContentScreen) {
                    return MainView.getView().getController().sideContentScreen(MainView).getSideContentScreen();
                }
            },

            planScreen: function (oEvent, MainView) {
                return {
                    showPanel: () => {
                        MainView.fieldcat.forEach(el => {
                            if (el.FIELD === "MAXROWS") return;
                            sap.ui.getCore().byId(el.idUi5).setWidth("100%");
                        });
                        MainView.contentScreen.setShowSideContent(true);
                    },
                    closePanel: () => {
                        MainView.fieldcat.forEach(el => {
                            if (el.FIELD === "MAXROWS") return;
                            sap.ui.getCore().byId(el.idUi5).setWidth("50%");
                        });
                        MainView.contentScreen.setShowSideContent(false);
                    },
                };
            },
            setSelectScreen(content) {
                for (const fld in content) {
                    let el = sap.ui.getCore().byId(MainView.fieldcat.find(f => fld === (f.REFKIND || f.FIELD))?.idUi5);

                    switch (el?.REFTYPE) {
                        case "LB":
                            el.setSelectedKey(content[fld]);
                            break;
                        case "MC":
                            el.setSelectedKeys(content[fld]?.$in);
                            break;
                        case "DR":
                            let f = String(content[fld]?.$gte);
                            let t = String(content[fld]?.$lte);
                            el.setFrom(
                                new Date(
                                    parseInt(f.substring(0, 4)),
                                    parseInt(f.substring(4, 6)) - 1, //month: from 0 to 11, so subtract one
                                    parseInt(f.substring(6, 8))
                                )
                            );
                            el.setTo(
                                new Date(
                                    parseInt(t.substring(0, 4)),
                                    parseInt(t.substring(4, 6)) - 1, //month: from 0 to 11, so subtract one
                                    parseInt(t.substring(6, 8))
                                )
                            );
                            break;
                        case "CB":
                            el.setProperty("selected", content[fld]);
                            break;
                        default:
                            if (el) el.setValue(content[fld]);
                            break;
                    }
                }
            },
            removeBtEvents: async function () { },
        });
    }
);
