
sap.ui.define(["../commons/AddModels", "../commons/Helpers", 'sap/ui/core/util/Export',
    'sap/ui/core/util/ExportTypeCSV',], function (AddModels, Helpers, Export, ExportTypeCSV) {
        "use strict";
        var That;

        return {


            get: function (that) {

                That = that;

                try {


                    return [
                        new sap.m.Button().setIcon("sap-icon://refresh")
                            .setType("Transparent")
                            .setTooltip("refresh")
                            .attachPress(that.refresh), //new sap.m.ToolbarSpacer(),
                        new sap.m.Button().setIcon("sap-icon://excel-attachment")
                            .setType("Transparent")
                            .setTooltip("excelExport")
                            .attachPress(this.exportToExcel),
                        new sap.m.Button().setIcon("sap-icon://key-user-settings")
                            .setType("Transparent")
                            .setTooltip("editLayoutTable")
                            .attachPress(this.editLayoutTable),
                        new sap.m.Button().setIcon("sap-icon://save")
                            .setType("Transparent")
                            .setTooltip("Gravar variante local")
                            .attachPress(this.openDialogToSave),
                        new sap.m.Button()
                            .setIcon("sap-icon://customize")
                            .setType("Transparent")
                            .setTooltip("Buscar variante local")
                            .attachPress(this.openDialogToList)
                    ]


                } catch (error) {
                    console.log("ListButtonError: ", error);
                }
            },
            openDialogToList: function () {

                Helpers.openDialogToList(That, That.screen.view + "LIST", 'table').then(data => {
                    if (data) {
                        That.models.model("AddStrucLIST").setModel(data);
                        That.list.table.destroyColumns();
                        That.list.addColumns(data);
                    }
                }).catch(err => {
                    console.log("Erro ao listar variante local: ", err);
                });
            },
            openDialogToSave: function () {
                let variante = That.models.model("AddStrucLIST").getModel();

                if (!variante) {
                    That.models.model("AddStrucLIST").setModel(That.STRUC);
                    variante = That.models.model("AddStrucLIST").getModel();
                }
                Helpers.openDialogToSave(That, That.screen.view + "LIST", 'table', variante.oData);
            },
            editLayoutTable: function () {

                var struct = That.STRUC;

                Helpers.TableLayoutHelper.openDialog(That, struct)
                    .then(data => {
                        if (data) {
                            That.models.model("AddStrucLIST").setModel(data);
                            That.list.table.destroyColumns();
                            That.list.addColumns(data);
                        }

                    })
                    .catch(err => {
                        console.log("Table Layout s error: ", err);
                    });
            },

            exportToExcel: function () {

                var tStruc = That.STRUC;
                var aColumns = [];
                if (tStruc instanceof Array) {
                    tStruc.sort(function (a, b) {
                        return a.COL_POS - b.COL_POS;
                    });
                    tStruc.forEach(function (value, index) {
                        let fld = value.FIELDNAME.split(That.IDAPP).pop();
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
                                                return value.substring(0, 4) + "-" + value.substring(4, 6) + "-" + value.substring(6, 8);
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
                    models: That.models.model("LIST").getModel(),
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
                That.oMessageView.navigateBack();
                That._oPopover.openBy(oEvent.getSource());
            }


        }
    });