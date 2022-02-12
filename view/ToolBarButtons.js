
sap.ui.define(
    [
        "../commons/Helpers",
        "sap/ui/core/util/Export",
        "sap/ui/core/util/ExportTypeCSV"
    ], function (Helpers, Export, ExportTypeCSV) {
        "use strict";
        var MainView;

        return {


            get: function (that) {

                MainView = that;

                try {


                    let buttons = [
                        new sap.m.ToolbarSpacer(),
                        new sap.m.Button({ tooltip: "{i18n>gridExport}" }).setIcon("sap-icon://excel-attachment")
                            .setType("Transparent")
                            .attachPress(this.exportToExcel),
                        new sap.m.Button({ tooltip: "{i18n>editLayoutTable}" }).setIcon("sap-icon://key-user-settings")
                            .setType("Transparent")
                            .attachPress(this.editLayoutTable),
                        new sap.m.Button({ tooltip: "{i18n>saveConfig}" }).setIcon("sap-icon://save")
                            .setType("Transparent")
                            .attachPress(this.openDialogToSave),
                        new sap.m.Button({ tooltip: "{i18n>searchConfig}" })
                            .setIcon("sap-icon://customize")
                            .setType("Transparent")
                            .attachPress(this.openDialogToList)
                    ]

                    buttons.forEach(bt => MainView.getView().addDependent(bt));

                    return buttons;

                } catch (error) {
                    console.log("ListButtonError: ", error);
                }
            },
            openDialogToList: function () {

                Helpers.openDialogToList(MainView, MainView.IDAPP + "LIST", 'LY').then(data => {
                    if (data) {
                        MainView.getView().setModel(new sap.ui.model.json.JSONModel(data), MainView.IDAPP + "TAB_CONFIG");
                        MainView.View.table.destroyColumns();
                        data.filter(f => f.VISIBLE === "X" || f.VISIBLE === true).forEach(column => MainView.getView().getController().addColumnTable(column, MainView.View, MainView));
                    }
                }).catch(err => {
                    console.log("Erro ao listar variante local: ", err);
                });
            },
            openDialogToSave: function () {
                let variante = MainView.getView().getModel(MainView.IDAPP + "TAB_CONFIG");
                debugger;
                if (!variante || variante.getData() !== MainView.View.fieldcat) {
                    MainView.getView().setModel(new sap.ui.model.json.JSONModel(MainView.View.fieldcat), MainView.IDAPP + "TAB_CONFIG");
                    variante = MainView.getView().getModel(MainView.IDAPP + "TAB_CONFIG");
                }
                Helpers.openDialogToSave(MainView, MainView.IDAPP + "LIST", 'LY', variante.oData);
            },
            editLayoutTable: function () {

                var struct = MainView.View.fieldcat;

                Helpers.TableLayoutHelper.openDialog(MainView, struct)
                    .then(data => {
                        if (data) {
                            MainView.getView().setModel(new sap.ui.model.json.JSONModel(data), MainView.IDAPP + "TAB_CONFIG");
                            MainView.View.table.destroyColumns();
                            data.filter(f => f.VISIBLE === "X" || f.VISIBLE === true).forEach(column => MainView.getView().getController().addColumnTable(column, MainView.View, MainView));
                        }

                    })
                    .catch(err => {
                        console.log("Table Layout s error: ", err);
                    });
            },

            exportToExcel: function () {

                var tStruc = MainView.View.fieldcat;
                var aColumns = [];
                if (tStruc instanceof Array) {
                    tStruc.sort(function (a, b) {
                        return a.COL_POS - b.COL_POS;
                    });
                    tStruc.forEach(function (value, index) {
                        let fld = value.FIELD.split(MainView.IDAPP).pop();
                        var vLabel = (value.SCRTEXT_S) ? value.SCRTEXT_S : fld;
                        var vStruc = {};
                        switch (value.DATATYPE) {
                            case ("CHAR"):
                            case ("NUMC"):
                            case ("QUAN"):
                            case ("UNIT"):
                            case ("DEC"):
                            case ("TIMS"):
                            case ("CURR"):
                                vStruc.name = vLabel;
                                vStruc.template = {
                                    content: {
                                        parts: [fld],
                                        formatter: function (value) {
                                            return "	" + value;
                                        }
                                    }
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
                                        }
                                    }
                                };
                                break;
                            default:
                                vStruc.name = vLabel;
                                vStruc.template = {
                                    content: fld
                                };

                        }
                        aColumns.push(vStruc);
                    });
                }

                var oExport = new Export({
                    exportType: new ExportTypeCSV({
                        separatorChar: ";",
                        charset: "utf-8"
                    }),
                    models: MainView.View.table.getModel(MainView.IDAPP + 'tab'),
                    rows: {
                        path: "/"
                    },
                    columns: aColumns

                });

                oExport.saveFile().catch(function (oError) {
                    sap.m.MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
                }).then(function () {
                    oExport.destroy();
                });
            },

            handlePopoverPress: function (oEvent) {
                MainView.oMessageView.navigateBack();
                MainView._oPopover.openBy(oEvent.getSource());
            }


        }
    });