sap.ui.define(["../commons/Helpers", "sap/ui/core/util/Export", "sap/ui/core/util/ExportTypeCSV"], function (Helpers, Export, ExportTypeCSV) {
    "use strict";
    var MainView;

    return {
        get: function (that, TABLE, CATALOG, VARIANT_NAME) {
            MainView = that;

            try {
                let buttons = [
                    new sap.m.ToolbarSpacer(),
                    new sap.m.Button({ tooltip: "{i18n>columnView}" }).setIcon("sap-icon://filter-facets").setType("Transparent").attachPress(this.popUpLine),
                    new sap.m.Button({ tooltip: "{i18n>gridExport}" }).setIcon("sap-icon://excel-attachment").setType("Transparent").attachPress(this.exportToExcel),
                    new sap.m.Button({ tooltip: "{i18n>editLayoutTable}" }).setIcon("sap-icon://key-user-settings").setType("Transparent").attachPress(this.editLayoutTable),
                    new sap.m.Button({ tooltip: "{i18n>saveConfig}" }).setIcon("sap-icon://save").setType("Transparent").attachPress(this.openDialogToSave),
                    new sap.m.Button({ tooltip: "{i18n>searchConfig}" }).setIcon("sap-icon://customize").setType("Transparent").attachPress(this.openDialogToList),
                ];

                if (MainView.getView) buttons.forEach(bt => MainView.getView().addDependent(bt));

                return buttons;
            } catch (error) {
                console.log("ListButtonError: ", error);
            }
        },
        openDialogToList: function () {
            const addColumn = this.addColumn;

            Helpers.openDialogToList(MainView, VARIANT_NAME + "LIST", VARIANT_NAME)
                .then(data => {
                    if (data) {
                        MainView.getView().setModel(new sap.ui.model.json.JSONModel(data), VARIANT_NAME + "TAB_CONFIG");
                        TABLE.destroyColumns();
                        data.filter(f => f.VISIBLE === "X" || f.VISIBLE === true).forEach(column => addColumn(column, MainView));
                    }
                })
                .catch(err => {
                    console.log("Erro ao listar variante local: ", err);
                });
        },
        addColumn: function (field, MainView) {
            let oControl = MainView.getColumnByType(field, MainView, TABLE.getBindingContextPath());

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

            oColumn.setCreationTemplate(new sap.m.Input({ value: "{" + TABLE.getBindingContextPath() + field.FIELD + "}" }));

            ViewTable.table.addColumn(oColumn);
        },
        openDialogToSave: function () {
            let variante = MainView.getView().getModel(VARIANT_NAME + "TAB_CONFIG");

            if (!variante || variante.getData() !== CATALOG) {
                MainView.getView().setModel(new sap.ui.model.json.JSONModel(CATALOG), VARIANT_NAME + "TAB_CONFIG");
                variante = MainView.getView().getModel(VARIANT_NAME + "TAB_CONFIG");
            }
            Helpers.openDialogToSave(MainView, VARIANT_NAME + "LIST", VARIANT_NAME, variante.oData);
        },
        editLayoutTable: function () {
            var struct = CATALOG;

            const addColumn = this.addColumn;

            Helpers.TableLayoutHelper.openDialog(MainView, struct)
                .then(data => {
                    if (data) {
                        data.sort(function (a, b) {
                            return a.COL_POS - a.COL_POS;
                        });
                        MainView.getView().setModel(new sap.ui.model.json.JSONModel(data), VARIANT_NAME + "TAB_CONFIG");
                        TABLE.destroyColumns();
                        data.filter(f => f.VISIBLE === "X" || f.VISIBLE === true).forEach(column => addColumn(column, MainView));
                    }
                })
                .catch(err => {
                    console.log("Table Layout s error: ", err);
                });
        },

        exportToExcel: function () {
            var tStruc = CATALOG;
            var aColumns = [];
            if (tStruc instanceof Array) {
                tStruc.sort(function (a, b) {
                    return a.COL_POS - b.COL_POS;
                });
                tStruc.forEach(function (value, index) {
                    let fld = value.FIELD.split(MainView.IDAPP).pop();
                    var vLabel = value.SCRTEXT_S ? value.SCRTEXT_S : fld;
                    var vStruc = {};
                    switch (value.DATATYPE) {
                        case "CHAR":
                        case "NUMC":
                        case "QUAN":
                        case "UNIT":
                        case "DEC":
                        case "TIMS":
                        case "CURR":
                            vStruc.name = vLabel;
                            vStruc.template = {
                                content: {
                                    parts: [fld],
                                    formatter: function (value) {
                                        return "	" + value;
                                    },
                                },
                            };
                            break;

                        case "DATS":
                            vStruc.name = vLabel;
                            vStruc.template = {
                                content: {
                                    parts: [fld],
                                    formatter: function (value) {
                                        if (value) {
                                            return String(value).substring(0, 4) + "-" + String(value).substring(4, 6) + "-" + String(value).substring(6, 8);
                                        }
                                        return value;
                                    },
                                },
                            };
                            break;
                        default:
                            vStruc.name = vLabel;
                            vStruc.template = {
                                content: fld,
                            };
                    }
                    aColumns.push(vStruc);
                });
            }

            var oExport = new Export({
                exportType: new ExportTypeCSV({
                    separatorChar: ";",
                    charset: "utf-8",
                }),
                models: TABLE.getModel(table.getModel()),
                rows: {
                    path: "/",
                },
                columns: aColumns,
            });

            oExport
                .saveFile()
                .catch(function (oError) {
                    sap.m.MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
                })
                .then(function () {
                    oExport.destroy();
                });
        },

        handlePopoverPress: function (oEvent) {
            MainView.oMessageView.navigateBack();
            MainView._oPopover.openBy(oEvent.getSource());
        },

        async popUpLine() {
            if (MainView.data.length === 0) return;
            let line = TABLE.getSelectedIndices();

            if (!line || line.length === 0) {
                MainView.message("selectLine");
                return;
            }

            if (line instanceof Array) {
                line = line[line.length - 1];
            }

            const tit = MainView.data[line].DOMIN + " : " + MainView.data[line].DSTATU + "  :  (" + MainView.data[line].id + ")";

            if (!MainView.tabLine) {
                MainView.tabLine = new sap.ui.table.Table({
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
                    .getStruc([{ field: "FIELD" }, { field: "VALUE" } /* , { field: "DATATYPE" }, { field: "SCRTEXT_S" }, { field: "REFCIND" } */], true, true)
                    .then(data => {
                        if (!data) {
                            console.error("ERR_GET_STRUCT_FAILED");
                            return;
                        }

                        MainView.catalogPopLine = JSON.parse(data);

                        for (let field of MainView.catalogPopLine) {
                            let oControl = new sap.m.Text({ text: "{" + field.FIELD + "}", wrapping: false });

                            let label = field.SCRTEXT_S || field.SCRTEXT_M || field.SCRTEXT_L || field.DESCR;
                            let leng = parseInt(field.OUTPUTLEN) ? parseInt(field.OUTPUTLEN) + "rem" : "auto";
                            let oColumn = new sap.ui.table.Column({
                                width: "35%",
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

                            MainView.tabLine.addColumn(oColumn);
                        }

                        MainView.messageDialogLine = new sap.m.Dialog({
                            title: tit,
                            icon: "sap-icon://filter-facets",
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
                                content: [MainView.tabLine],
                            }),

                            leftButton: new sap.m.Button({
                                text: "Ok",
                                press: function () {
                                    MainView.messageDialogLine.close();
                                },
                            }),
                        });

                        MainView.getView().addDependent(MainView.messageDialogLine);
                    });
            }

            let tab = [];
            let vl = Object.keys(MainView.data[line]);

            for (const key of vl) {
                let cat = CATALOG.find(c => c.FIELD === key);
                if (cat) tab.push({ FIELD: cat.SCRTEXT_L, VALUE: MainView.data[line][key] });
            }

            MainView.messageDialogLine.setTitle(tit);

            MainView.tabLine.setModel(new MainView.Model(tab));

            MainView.tabLine.bindRows("/");

            MainView.messageDialogLine.open();
        },
    };
});
