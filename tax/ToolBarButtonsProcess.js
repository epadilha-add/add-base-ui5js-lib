sap.ui.define([], function () {

    return {

        setToolBarTable: (toolbar, MainView, ViewTable) => {


            try {
                Array.from([
                    _getMenuButton(),
                    //_getRefreshButton(),
                    _getSeparatorButton(),
                    _getExecuteButton(),
                    _geReverseButton(),
                    _getSeparatorButton(),
                    _getLogButton(ViewTable.table),
                ]).forEach((e) => toolbar.addContent(e));
            } catch (error) {
                console.log(error);
            }

            function _getMenuButton() {
                return new sap.m.Button({
                    tooltip: "{i18n>processAddMenu}",
                    icon: "sap-icon://menu",
                    press: function (oEvent) {
                        var oEventTrigger = oEvent.getSource();

                        MainView._menu = menu().getMenu();

                        MainView._menu.open(false, oEventTrigger, sap.ui.core.Popup.Dock.BeginTop, sap.ui.core.Popup.Dock.BeginBottom, oEventTrigger);

                        let prop = [
                            { text: "executeProcess", func: async (oEvent) => await _callTax(oEvent, "1") },
                            { text: "reverseProcess", func: async (oEvent) => await _callTax(oEvent, "2") },
                        ];

                        function menu() {
                            return {
                                getMenu: getMenu,
                            };

                            function getMenu() {
                                let m = new sap.ui.unified.Menu({
                                    //    title: "Total: " + MainView?.data?.length || 0,
                                    itemSelect: function (oEvent) {
                                        onSelectionProcessMenu(oEvent, prop);
                                    },
                                    items: [
                                        new sap.ui.unified.MenuItem({
                                            text: "{i18n>executeProcess}",
                                        }),
                                        new sap.ui.unified.MenuItem({
                                            text: "{i18n>reverseProcess}",
                                        }),
                                    ],
                                });

                                MainView.getView().addDependent(m);

                                return m;

                                function onSelectionProcessMenu(oEvent, menus) {
                                    var oItem = oEvent.getParameter("item");

                                    if (oItem.getSubmenu()) {
                                        return;
                                    }

                                    let fn = menus.find((p) => {
                                        if (MainView.i18n(p.text) == oItem.getText()) {
                                            return p;
                                        }
                                    });
                                    if (fn) {
                                        fn.func(oEvent, fn.ucomm);
                                    }
                                }
                            }
                        }
                    },
                });
            }

            function _getExecuteButton(table, prsap) {
                MainView.executeButtom = new sap.m.Button({
                    text: "{i18n>executeProcess}",
                    icon: "sap-icon://step",
                    visible: true,
                    enabled: true,
                    press: async (oEvent) => await _callTax(oEvent, "1"),
                });
                return MainView.executeButtom;
            }

            function _geReverseButton() {
                MainView.reverseButtom = new sap.m.Button({
                    //text: "{i18n>reverseProcess}",
                    icon: "sap-icon://undo",
                    visible: false,
                    enabled: false,
                    press: (oEvent) => _callTax(oEvent, "2"),
                });

                return MainView.reverseButtom;
            }

            function _getSeparatorButton() {
                return new sap.m.ToolbarSeparator();
            }

            function _getLogButton(table, externalQuery) {
                return new sap.m.Button({
                    text: "{i18n>showLog}",
                    icon: "sap-icon://activity-items",
                    press: async (oEvent) => await MainView.getView().getController().log(MainView, ViewTable).getLog(oEvent),
                });
            }

            async function _callTax(oEvent, prsap) {
                let bt = oEvent.getSource();
                bt.setBlocked(true);
                MainView.getView().setBusy(true);

                let lines = ViewTable.table.getSelectedIndices();
                if (!lines || lines.length === 0) {
                    ViewTable.table.setSelectedIndex(0);
                    lines = ViewTable.table.getSelectedIndices();
                }

                let _taxdo = [];

                for (const line of lines) {
                    await MainView.callService
                        .postSync("add", {
                            actionName: "TAX.callRp",
                            params: { PRSAP: prsap, query: { id: MainView.data[line].id } },
                        })
                        .then((resp) => {
                            if (typeof resp === "string") resp = JSON.parse(resp);
                            if (resp) MainView.data[line] = { ...resp.DATA[0] };

                            if (resp?.TAXDO.length > 0) _taxdo = _taxdo.concat(resp.TAXDO);
                            _unlock(line);
                        })
                        .catch((error) => {
                            MainView.getView().setBusy(false);
                            bt.setBlocked(false);
                            throw new TypeError(error);
                        });
                }

                MainView.getView().setBusy(false);
                bt.setBlocked(false);

                function _unlock(line) {
                    MainView.setModelTable(MainView, line);
                }

                await MainView.getView().getController().log().showLog(_taxdo, MainView);
            }
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
                    .then((resp) => {
                        if (typeof resp === "string") resp = JSON.parse(resp);
                        bt.setBlocked(false);
                        MainView.getView().setBusy(false);
                        if (resp.rows)
                            MainView.getView()
                                .getController()
                                .log()
                                .showLog(
                                    resp.rows.sort((a, b) => {
                                        return parseInt(a.CREDAT) > parseInt(b.CREDAT) ? -1 : 1;
                                    }),
                                    MainView
                                );
                    })
                    .catch((error) => {
                        bt.setBlocked(false);
                        MainView.getView().setBusy(false);
                        throw error;
                    });
            }

            async function showLog(rows, MainView) {
                if ((rows && rows.length === 0) || rows === 0) {
                    MainView.message("dataNotFound");
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
                                { field: "ATIVI" },
                                { field: "DTOCC" },
                                { field: "HROCC" },
                                { field: "INDOC" },
                                { field: "NUREF" },
                                { field: "SEREF" },
                                { field: "PRSAP" },
                                { field: "DESCR" },
                                { field: "NSTEP" },
                                { field: "FSTEP" },
                                { field: "ERNAM" },
                                { field: "D0000" },
                            ],
                            true,
                            true
                        )
                        .then((data) => {
                            if (!data) {
                                console.error("ERR_GET_STRUCT_FAILED");
                                return;
                            }

                            MainView.fieldcatLog = JSON.parse(data);

                            MainView.tabLog.setRowSettingsTemplate(
                                new sap.ui.table.RowSettings({
                                    highlight: {
                                        parts: [{ path: "TPMSG" }],
                                        formatter: MainView.getView().getController().formatter().TPMSG,
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
                                                formatter: MainView.getView().getController().formatter().DESCR,
                                            },
                                            wrapping: false,
                                        });

                                        break;
                                    case "STATU":
                                        oControl = new sap.m.ObjectStatus({
                                            // title: '{' + field.FIELD + '}',
                                            text: "{" + field.FIELD + "}",
                                            state: {
                                                parts: [{ path: "TPMSG" }],
                                                formatter: MainView.getView().getController().formatter().TPMSG,
                                            },
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

                if (!rows || !rows.length) return;
                MainView.tabLog.setModel(new sap.ui.model.json.JSONModel(rows.map((m) => {
                    MainView.populate(m);
                    m.DESCR = m.DSTATU;
                    return m;
                })));

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
                if (MainView.getView)
                    MainView.getView().addDependent(messageDialog);

                messageDialog.open();
            }
        },
    }
});