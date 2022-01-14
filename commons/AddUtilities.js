sap.ui.define([
    'sap/ui/core/util/Export',
    'sap/ui/core/util/ExportTypeCSV',
    "sap/ui/model/json/JSONModel",
    "./AddFormatter"
], function (Export, ExportTypeCSV, JSONModel, formatter) {
    "use strict";

    return {
        formatter: formatter,
        showMessage(codeMessageFromI18N, that) {
            var message = that.getView().getModel("i18n").getResourceBundle().getText(codeMessageFromI18N);
            if (!message) {
                message = codeMessageFromI18N;
            }
            sap.m.MessageToast.show(message);
        },
        getMessage(codeMessageFromI18N, that) {
            return that.getView().getModel("i18n").getResourceBundle().getText(codeMessageFromI18N);
        },
        formatDateToSAP: function (uData) {
            return sap.ui.core.format.DateFormat.getDateInstance({
                pattern: "YYYYMMdd"
            }).format(uData);
        },
        addDynTable: function (that, tableId, placeAtId, namedModel, rowsModel, strucModelName, tableType, extensionContent, totalLines) {

            var oTable = sap.ui.getCore().byId(tableId);

            function addColumnsToDynTable(value, index, array) {
                //console.log("INDEX: " + index + "VALUE: " + value.FIELDNAME);
                var vLabel = (value.SELTEXT_S) ? value.SELTEXT_S : value.FIELDNAME;
                //var vVisible = (value.VISIBLE)?value.VISIBLE:true;
                var vVisible = true;
                if (value.VISIBLE === false || value.VISIBLE === "false" || value.VISIBLE === "") {
                    vVisible = false;
                }
                value.EDIT = '';

                var vCol = formatter.checkTypeFieldAndCreate(that, value, namedModel, '_', 'T');

                oTable.addColumn(new sap.ui.table.Column({
                    tooltip: (value.SELTEXT_S) ? value.SELTEXT_S + ':' + value.FIELDNAME : value.SELTEXT_M + ':' + value.FIELDNAME,
                    label: new sap.ui.commons.Label({
                        text: vLabel
                    }),
                    // Creates an Header with value defined for the text attribute
                    //masterdata: new sap.m.Input({enabled: false}).bindProperty("value", namedModel+value.FIELDNAME), // binds the value into the text field defined using JSON
                    masterdata: vCol, // binds the value into the text field defined using JSON
                    sortProperty: value.FIELDNAME, // enables sorting on the column
                    filterProperty: value.FIELDNAME, // enables set filter on the column
                    // width: value.INTLEN + "px", // width of the column
                    autoResizable: true,
                    resizable: true,
                    visible: vVisible
                }));
            }

            function addColumnsToDynItensTable(value, index, array) {
                //console.log("INDEX: " + index + "VALUE: " + value.FIELDNAME);
                var vLabel = (value.SELTEXT_S) ? value.SELTEXT_S : value.FIELDNAME;
                //var vVisible = (value.VISIBLE)?value.VISIBLE:true;
                var vVisible = true;
                if (value.VISIBLE === false || value.VISIBLE === "false" || value.FIELDNAME == "MANDT" || value.FIELDNAME == "VARIA") {
                    vVisible = false;
                }

                var vEditable = false;
                if (value.EDIT === "X")
                    vEditable = true;

                var vCol = formatter.checkTypeFieldAndCreate(that, value, namedModel, '___', (tableType == "TDI") ? 'I' : 'T');

                oTable.addColumn(new sap.ui.table.Column({
                    tooltip: (value.SELTEXT_S) ? value.SELTEXT_S + ':' + value.FIELDNAME : value.SELTEXT_M + ':' + value.FIELDNAME,
                    label: new sap.ui.commons.Label({
                        text: vLabel
                    }), // Creates an Header with value defined for the text attribute

                    masterdata: vCol,
                    /*       masterdata: new sap.m.Input({
                              enabled: vEditable
                          }).bi 
                    ndProperty("value", namedModel + value.FIELDNAME),*/ // binds the value into the text field defined using JSON  

                    sortProperty: value.FIELDNAME, // enables sorting on the column
                    filterProperty: value.FIELDNAME, // enables set filter on the column
                    // width: value.INTLEN + "px", // width of the column
                    autoResizable: true,
                    visible: vVisible
                }));
            }

            function getExtensionHelperVariant(tableType) {

                var vContent = [];

                if (tableType === "ALV") {
                    vContent.push(new sap.m.Button().setIcon("sap-icon://excel-attachment").setType("Transparent").setTooltip("Exportar Excel").attachPress(
                        that.onExportExcel));
                    // vContent.push(new sap.m.ToolbarSeparator());
                    vContent.push(new sap.m.Button().setIcon("sap-icon://key-user-settings").setType("Transparent").setTooltip("Editar Layout da Tabela").attachPress(
                        that.onEditLayoutTablePress));
                    vContent.push(new sap.m.Button().setIcon("sap-icon://save").setType("Transparent").setTooltip("Gravar variante local").attachPress(that.onSaveTableVariantPress));
                    vContent.push(new sap.m.Button().setIcon("sap-icon://customize").setType("Transparent").setTooltip("Buscar variante local").attachPress(
                        that.onLoadTableVariantPress));
                } else if (tableType === "TDI") {
                    vContent.push(new sap.m.Button().setIcon("sap-icon://excel-attachment").setType("Transparent").setTooltip("Exportar Excel").attachPress(
                        that.tdiOnExportExcel));
                    //vContent.push(new sap.m.ToolbarSeparator());

                }

                return vContent;
            }

            function getExtension(tableType, extensionContent) {

                var vContent = [];

                if (tableType === "ALV") {

                    if (extensionContent) {
                        vContent = vContent.concat(extensionContent);
                    }
                    /*          transferido para o controle e enviados via extensionContent   
                                vContent.push(new sap.m.Button({
                                    tooltip: "{i18n>BT_REFRESH}",
                                    icon: "{i18n>BT_REFRESH_ICON}"
                                }).setType("Transparent").attachPress(that.refresh));
                                vContent.push(new sap.m.Button({
                                    text: "{i18n>BT_PROCESS_EXEC}",
                                    icon: "{i18n>BT_PROCESS_EXEC_ICON}"
                                }).setType("Transparent").attachPress(that.processExecute));
                                vContent.push(new sap.m.Button({
                                    text: "{i18n>BT_DATA_COMPLEMENT}",
                                    icon: "{i18n>BT_DATA_COMPLEMENT_ICON}"
                                }).setType("Transparent").attachPress(that.onNavToComplementData));
                                []
                                vContent.push(new sap.m.ToolbarSpacer());
                                vContent.push(new sap.m.Button().setIcon("sap-icon://ui-notifications").setText("").setType("Transparent").attachPress(that.processLogFromButton));
                                vContent.push(new sap.m.ToolbarSeparator()); */

                    vContent = vContent.concat(getExtensionHelperVariant(tableType));

                } else if (tableType === "TDI") {

                    //vContent.push(new sap.m.ToolbarSpacer());
                    vContent = vContent.concat(getExtensionHelperVariant(tableType));
                    vContent.push(new sap.m.ToolbarSeparator());
                    vContent.push(new sap.m.Button().setIcon("sap-icon://sys-add").setType("Transparent").setTooltip("Adicionar Item").attachPress(that.tdiOnAddItem));
                    vContent.push(new sap.m.Button().setIcon("sap-icon://sys-minus").setType("Transparent").setTooltip("Remover Item").attachPress(that.tdiOnRemoveItem));
                }

                return new sap.m.OverflowToolbar({
                    content: vContent
                }).addStyleClass("sapMTBHeader-CTX")

            }

            if (!oTable) {

                if (tableType === "ALV") {

                    oTable = new sap.ui.table.Table({
                        id: tableId,
                        //layoutData: new sap.m.FlexItemData({ growFactor: 1, baseSize: "0%" }),
                        //width: "auto",
                        //title: "{i18n>BUKRS_text}",
                        showNoData: true,
                        columnHeaderHeight: 10,
                        visibleRowCount: 20,
                        minAutoRowCount: 10,
                        visibleRowCountMode: "Auto",
                        // selectionBehavior: "Row",
                        // enableGrouping: true,
                        extension: getExtension(tableType, extensionContent),
                        rowSettingsmasterdata: new sap.ui.table.RowSettings({
                            highlight: {
                                parts: ["STATU", "PROCX"],
                                formatter: that.formatter.formatStatusState
                            }
                        })
                    });
                    oTable.bindRows(namedModel + rowsModel);
                } else if (tableType === "TDI") {
                    oTable = new sap.ui.table.Table({
                        id: tableId,
                        //title: tableTitle,
                        showNoData: true,
                        columnHeaderHeight: 10,
                        visibleRowCount: 4,
                        visibleRowCountMode: 'Fixed',
                        extension: getExtension(tableType, extensionContent)
                    });
                    var aFilters = [];
                    var oFilter = new sap.ui.model.Filter("LOEKZ", sap.ui.model.FilterOperator.NE, "X");
                    aFilters.push(oFilter);
                    oTable.bindRows(namedModel + rowsModel, null, null, aFilters);
                }

            } else {
                //var oTable = sap.ui.getCore().byId(tableId);
                oTable.destroyColumns();
                oTable.clearSelection();
                oTable.destroyExtension();
                oTable.addExtension(getExtension(tableType, extensionContent));
                //oTable.setMinAutoRowCount((totalLines) ? totalLines : 10);
            }

            var tStruc = (sap.ui.getCore().getModel(strucModelName)).oData;
            if (tStruc instanceof Array) {
                tStruc.sort(function (a, b) {
                    return a.COL_POS - b.COL_POS;
                });

                if (tableType === "TDI") {
                    tStruc.forEach(addColumnsToDynItensTable);
                } else if (tableType === "VAR") {
                    tStruc.forEach(addColumnsToDynItensTableVAR);
                } else {
                    tStruc.forEach(addColumnsToDynTable);
                }
            }

            oTable.placeAt(that.getView().createId(placeAtId));
        },
        getDefaultSTRUCIModel: function () {
            var jStruci = [{
                COL_POS: 2,
                CURRENCY: "",
                DATATYPE: "DEC",
                EDIT: "X",
                FIELDNAME: "IEBELN",
                INTLEN: "000009",
                SELTEXT_L: "Pedido de compra",
                SELTEXT_M: "Pedido de compra",
                SELTEXT_S: "Pedido de compra",
                VISIBLE: ""
            }, {
                COL_POS: 4,
                CURRENCY: "",
                DATATYPE: "DEC",
                EDIT: "X",
                FIELDNAME: "LBLNI",
                INTLEN: "000009",
                SELTEXT_L: "Folha de registro",
                SELTEXT_M: "Folha de registro",
                SELTEXT_S: "Folha de registro",
                VISIBLE: ""
            }, {
                COL_POS: 1,
                CURRENCY: "",
                DATATYPE: "DEC",
                EDIT: "X",
                FIELDNAME: "CHAVE",
                INTLEN: "000009",
                SELTEXT_L: "Chave de acesso transportada",
                SELTEXT_M: "Chave de acesso transportada",
                SELTEXT_S: "Chave de acesso transportada",
                VISIBLE: ""
            }, {
                COL_POS: 274,
                CURRENCY: "",
                DATATYPE: "DEC",
                EDIT: "X",
                FIELDNAME: "VGBEL",
                INTLEN: "000009",
                SELTEXT_L: "Valor Total",
                SELTEXT_M: "Valor Total",
                SELTEXT_S: "Valor Total",
                VISIBLE: ""
            }, {
                COL_POS: 5,
                CURRENCY: "",
                DATATYPE: "DEC",
                EDIT: "X",
                FIELDNAME: "MENGE",
                INTLEN: "000009",
                SELTEXT_L: "Quantidade",
                SELTEXT_M: "Quantidade",
                SELTEXT_S: "Quantidade",
                VISIBLE: ""
            }, {
                COL_POS: 3,
                CURRENCY: "",
                DATATYPE: "DEC",
                EDIT: "X",
                FIELDNAME: "EBELP",
                INTLEN: "000009",
                SELTEXT_L: "item Pedido de Compra",
                SELTEXT_M: "item Pedido de Compra",
                SELTEXT_S: "item Pedido de Compra",
                VISIBLE: ""
            }, {
                COL_POS: 274,
                CURRENCY: "",
                DATATYPE: "DEC",
                EDIT: "X",
                FIELDNAME: "IVA",
                INTLEN: "000009",
                SELTEXT_L: "IVA",
                SELTEXT_M: "IVA",
                SELTEXT_S: "IVA",
                VISIBLE: ""
            }];
            return jStruci;
        },
        getHtmlMediaContent: function (type, data, downlaod) {
            var htmlContent = "";
            //console.log("Tipo: " + type);
            switch (type) {
                case '.PDF':
                case '.pdf':


                    htmlContent = '<iframe src="data:application/pdf;base64,' + data + '" height="1100px" width="100%" style="border: none;"></iframe>';

                    /*              htmlContent =
                        '<PDFViewer source="' + data + '" height="{/Height}">' +
                        '<layoutData>' +
                        '<FlexItemData growFactor="1" />' +
                        '</layoutData>' +
                        '</PDFViewer>';
 */

                    break;
                case '.JPEG':
                case '.jpeg':
                case '.JPG':
                case '.jpg':
                case '.GIF':
                case '.gif':
                    htmlContent = '<div><img src="data:application/jpg;base64,' + data + '" /></div>';
                    break;
                case '.TXT':
                case '.txt':
                    var texto = window.atob(data);
                    //	console.log("Texto: " + texto);
                    if (texto.startsWith('<')) {
                        texto = texto.replaceAll('<', '&lt;');
                        texto = texto.replaceAll('&', '&amp;');
                    }
                    texto = texto.replaceAll(/\n/g, "<br />");
                    texto = texto.replaceAll('"', '\"');
                    //htmlContent = '<sap.m.TextArea value="' + texto + '" height="100%" growing="true" width="100%"/>';
                    htmlContent = '<code height="100%" width="100%">' + texto + '</code>';
                    break;
                case '.XML':
                case '.xml':

                    // var xmlText = window.atob(data);/
                    if (downlaod) {
                        var a = document.createElement("a");
                        a.href = "data:text/xml;base64," + data;
                        a.download = "file.xml";
                        a.click();
                        a.destroy();
                    }

                    //window.open(data);
                    htmlContent = '<iframe src="data:text/xml;base64,' + data + '" height="100%" width="100%" style="border: none;"></iframe>';


                    break;
            }
            //console.log(htmlContent);
            return htmlContent;
        },
        getProcessFlowModel: function (sProcx, currentActivity, status) {
            var addParam = sap.ui.getCore().getModel("AddPARAM");
            var procObj = null;
            var procFlow = {
                nodes: [],
                lanes: []
            };
            var encontrouAtivi = false;

            var statuDesc = null;
            var statuTPMSG = "";
            try {
                var a0112 = (addParam.oData.VIEWS['0400'].find(function (x) {
                    if (x.PROCP == sProcx) return x;
                }))['0112'];
                if (a0112) {
                    a0112 = a0112.find(function (x) {
                        if (x.STATU == status) return x;
                    });
                    statuDesc = status + " - " + a0112.DESCR;
                    statuTPMSG = a0112.TPMSG;
                }
            } catch (e) {

            }
            //Caso a variável DESC esteja vazia/undefined tenta buscar na variante de status globais
            try {
                if (statuTPMSG === undefined || statuTPMSG === null || statuTPMSG === "") {
                    var a0104 = (addParam.oData.VIEWS['0104'].find(function (x) {
                        if (x.STATU == status) return x;
                    }));
                    statuTPMSG = a0104.TPMSG;
                }
            } catch (e) {

            }

            statuDesc = (statuDesc) ? statuDesc : status;
            var statusState = "Neutral";
            var statusText = "OK";

            switch (statuTPMSG) {
                case "E":
                    statusState = "Negative";
                    statusText = "ERRO";
                    break;
                case "W":
                    statusState = "Neutral";
                    statusText = "ATENÇÃO";
                    break;
                case "S":
                    statusState = "Positive";
                    statusText = "OK";
                    break;
                case "I":
                    statusState = "Neutral";
                    statusText = "INFO";
                    break;
            }

            try {
                var countAtivi = 0;
                procObj = addParam.oData.VIEWS['0100'].find(function (x) {
                    if (x.PROCX == sProcx) return x;
                });
                let modelIndex = 0;
                procObj['0102'].forEach(function (oValue, i) {
                    if (oValue.PRSAP === "1" && oValue.PROCX === sProcx) {
                        countAtivi++;
                        var eLane = {
                            id: modelIndex,
                            icon: "sap-icon://variants",
                            label: oValue.DESCR,
                            //label: 'teste',
                            position: modelIndex
                        };
                        procFlow.lanes.push(eLane);

                        if (!encontrouAtivi && (currentActivity !== "00000")) {
                            if (oValue.ATIVI === currentActivity) {
                                encontrouAtivi = true;
                                var eFinalNode = {
                                    id: modelIndex + 1,
                                    lane: modelIndex,
                                    //title: "Titulo",
                                    //titleAbbreviation: "Tit",
                                    title: statuDesc,
                                    titleAbbreviation: statuDesc,
                                    children: [],
                                    state: statusState,
                                    stateText: statusText,
                                    focused: false,
                                    texts: [statuDesc]
                                };
                                procFlow.nodes.push(eFinalNode);
                            } else {
                                var eNodes = {
                                    id: modelIndex + 1,
                                    lane: modelIndex,
                                    //title: "Titulo",
                                    //titleAbbreviation: "Tit",
                                    title: oValue.DESCR,
                                    titleAbbreviation: oValue.DESCR,
                                    children: [modelIndex + 2],
                                    state: "Positive",
                                    stateText: "OK Status",
                                    focused: true,
                                    texts: [oValue.DESCR]
                                };
                                procFlow.nodes.push(eNodes);
                            }
                        }
                        modelIndex = modelIndex + 1;
                    }
                });

                if (procFlow.lanes.length === procFlow.nodes.length) {
                    var lnode = procFlow.nodes[procFlow.nodes.length - 1];
                    (procFlow.nodes[procFlow.nodes.length - 1]).children = [];
                }


                (procFlow.lanes[procFlow.lanes.length - 1]).icon = "sap-icon://pixelate";

            } catch (e) {

            }

            return procFlow;
        },
        getProcFlowModel: function (sProcx, currentActivity, bukrs, quantidades) {
            var addParam = sap.ui.getCore().getModel("AddPARAM");
            var oProcStartResult = JSON.parse(JSON.stringify(sap.ui.getCore().getModel("ProcStartResult").oData));
            let procAtivis = [];
            oProcStartResult.ALV.find(function (oValue, index) {
                if (oValue && oValue.BUKRS === bukrs && oValue.PROCX === sProcx)
                    procAtivis.push(oValue);

            });
            var procObj = null;
            var procFlow = {
                nodes: [],
                lanes: []
            };

            try {
                procObj = addParam.oData.VIEWS['0100'].find(function (x) {
                    if (x.PROCX == sProcx) return x;
                });
                let modelIndex = 0;
                procObj['0102'].forEach(function (oValue, i) {
                    if (oValue.PRSAP === "1" && oValue.PROCX === sProcx) {

                        let total = 0;
                        if (procAtivis) {
                            let resItem = procAtivis.find(function (x) { if ((x.ATIVI).substr(0, 5) === oValue.ATIVI) return x; });
                            if (resItem)
                                total = resItem.QUANT;
                        }
                        var eLane = {
                            id: modelIndex,
                            icon: "sap-icon://activity-individual",
                            label: oValue.ATIVI + " - " + oValue.DESCR,
                            position: modelIndex
                        };
                        procFlow.lanes.push(eLane);
                        var eNodes = {
                            id: modelIndex,
                            lane: modelIndex,
                            title: "Total: " + total,
                            titleAbbreviation: "Total: " + total,
                            children: [modelIndex + 1],
                            state: "Neutral",
                            stateText: "Aguardando: " + total,
                            atividade: oValue.ATIVI,
                            focused: false,
                            highlighted: true,
                            //texts: ["Linha", "Linha2", "Linha3"]
                        };
                        if (currentActivity === oValue.ATIVI || (currentActivity === "00000" && i === 0)) {
                            eNodes.focused = true;
                            eNodes.state = "Positive";
                            if (quantidades) {
                                eNodes.title = "Total: " + quantidades.TOTAL;
                                eNodes.titleAbbreviation = "Total: " + quantidades.TOTAL;
                                eNodes.stateText = "Aguardando: " + quantidades.AGUARDANDO;
                                eNodes.texts = ["ATENCAO: " + quantidades.ATENCAO, "ERROS: " + quantidades.ERROS];
                            }

                        }
                        procFlow.nodes.push(eNodes);
                        modelIndex = modelIndex + 1;
                    }

                });

                //Ajusta o vínculo do último node
                (procFlow.nodes[procFlow.nodes.length - 1]).children = [];

                //Muda o ícone da última atividade
                (procFlow.lanes[procFlow.lanes.length - 1]).icon = "sap-icon://pixelate";

            } catch (e) {

            }

            return procFlow;
        },
        exportToExcel: function (modelToBeExported, modelStruc, modelToBeExportedName) {

            var tStruc = (sap.ui.getCore().getModel(modelStruc)).oData;
            var aColumns = [];
            if (tStruc instanceof Array) {
                tStruc.sort(function (a, b) {
                    return a.COL_POS - b.COL_POS;
                });
                tStruc.forEach(function (value, index) {
                    var vLabel = (value.SELTEXT_S) ? value.SELTEXT_S : value.FIELDNAME;
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
                            vStruc.masterdata = {
                                content: {
                                    parts: [value.FIELDNAME],
                                    formatter: function (value) {
                                        return "	" + value;
                                    }
                                }
                            };
                            break;

                        case "DATS":
                            vStruc.name = vLabel;
                            vStruc.masterdata = {
                                content: {
                                    parts: [value.FIELDNAME],
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
                            vStruc.masterdata = {
                                content: value.FIELDNAME
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
                //models : this.getView().getModel("processes"),
                //models : oController.oView.getModel(),
                models: modelToBeExported,

                rows: {
                    path: "/" + modelToBeExportedName
                },
                columns: aColumns

            });

            // download exported file
            oExport.saveFile().catch(function (oError) {
                sap.m.MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
            }).then(function () {
                oExport.destroy();
            });
        },
        getStatusEnum: function (state) {
            switch (state) {
                case "info":
                    return sap.ui.core.MessageType.Information;
                case "error":
                    return sap.ui.core.MessageType.Error;
                case "success":
                    return sap.ui.core.MessageType.Success;
                case "warning":
                    return sap.ui.core.MessageType.Warning;
                default:
                    return sap.ui.core.MessageType.None;
            }
        },
        addSysLogMessage: function (status, page, message) {
            var syslogModel = sap.ui.getCore().getModel("SYSLOG");
            if (!syslogModel)
                syslogModel = new JSONModel([]);
            var date = new Date();
            var data = date.getFullYear() + '.' + date.getMonth() + '.' + date.getDate();
            var hora = date.getHours() + ':' + date.getMinutes() + '.' + date.getSeconds();
            //syslogModel.oData.push({ DATE: data, TIME: hora, STATUS: status, PAGE: page, MESSAGE: message, STATUSSTATE: sap.ui.core.MessageType.Error })
            syslogModel.oData.push({ DATE: data, TIME: hora, STATUS: status, PAGE: page, MESSAGE: message, STATUSSTATE: this.getStatusEnum(status) });
            sap.ui.getCore().setModel(syslogModel, "SYSLOG");
        },
        onAddAndShowSysLogMessage: function (that, status, page, message) {
            var syslogModel = sap.ui.getCore().getModel("SYSLOG");
            if (!syslogModel)
                syslogModel = new JSONModel([]);
            var date = new Date();
            var data = date.getFullYear() + '.' + date.getMonth() + '.' + date.getDate();
            var hora = date.getHours() + ':' + date.getMinutes() + '.' + date.getSeconds();
            //syslogModel.oData.push({ DATE: data, TIME: hora, STATUS: status, PAGE: page, MESSAGE: message, STATUSSTATE: sap.ui.core.MessageType.Error })
            syslogModel.oData.push({ DATE: data, TIME: hora, STATUS: status, PAGE: page, MESSAGE: message, STATUSSTATE: this.getStatusEnum(status) })
            sap.ui.getCore().setModel(syslogModel, "SYSLOG");

            that.getView().setModel(syslogModel, "SYSLOG");
            if (!that._oDialog) {
                that._oDialog = sap.ui.xmlfragment("AddPlatform.view.fragment.popUp.popUpSystemLogs", that);
            }

            that._oDialog.open();
        },

        onShowSysLog: function () {
            var syslogModel = sap.ui.getCore().getModel("SYSLOG");
            if (!syslogModel)
                syslogModel = new JSONModel([]);
            this.getView().setModel(syslogModel, "SYSLOG");
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("AddPlatform.view.fragment.popUp.popUpSystemLogs", this);
            }

            this._oDialog.open();
        },

        onCloseSysLogs: function (oEvent) {
            var oDialog = oEvent.getSource().getParent();
            oDialog.close();
        },

        onShowLogProcess: function () {

            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("AddPlatform.view.fragment.popUp.popUpLogs", this);
            }

            this._oDialog.open();
        },

        onShowLogProcessNoFormatter: function () {

            if (!this._oDialogNf) {
                this._oDialogNf = sap.ui.xmlfragment("AddPlatform.view.fragment.popUp.popUpLogsNoFormatter", this);
            }

            this._oDialogNf.open();
        },
        onCloseLogProcess: function (oEvent) {
            var oDialog = oEvent.getSource().getParent();
            oDialog.close();
        },
        checkBoxFields: function (field) {

            var aFiels = [];

            aFiels.push("FSTEP");
            aFiels.push("NSTEP");
            aFiels.push("PSTAT");
            aFiels.push("ISTAT");
            aFiels.push("EDITA");
            aFiels.push("ATIVO");
            aFiels.push("INPRO");
            aFiels.push("CANCEL");
            aFiels.push("ANULA");
            aFiels.push("MARK");
            aFiels.push("CHCK");
            aFiels.push("SOUNA");
            aFiels.push("LOEKZ");

            let count = 0

            aFiels.find((value) => {
                if (value === field) count++;
            });

            return (count) ? true : false;
        },
        showPopUpTable: function (that, tablestruc, alv, idBuzy, title) {

            //AddUtilities.showPopUpTable(that, oModel.oData.UI5.FIELDCAT, oModel.oData.UI5.ALV, idBuzy, AddUtilities.getMessage("MSG_SELECT_DATA", that));

            var columnsValues = [];
            var columnsTitle = [];

            tablestruc.forEach(line => {
                columnsValues.push(new sap.m.Label({
                    text: "{" + line.FIELDNAME + "}"
                }));
                columnsTitle.push(new sap.m.Column({
                    hAlign: "Begin",
                    header: new sap.m.Label({
                        // id: "xxxId" + line.FIELDNAME,
                        text: (line.SELTEXT_S) ? line.SELTEXT_S : line.SELTEXT_M
                    })
                }))
            })

            var oItemmasterdata1 = new sap.m.ColumnListItem({
                type: "Active",
                unread: false,
                cells: columnsValues
            });

            var oModel = new sap.ui.model.json.JSONModel(alv);

            /* 4) multi select table dialog with binding  */
            var oTableSelectCustomDialog = new sap.m.TableSelectDialog({
                title: title,
                // noDataText: "teste",
                multiSelect: false,
                search: function (oEvent) {
                    fnDoSearch(oEvent, tablestruc);
                },
                liveChange: function (oEvent) {
                    fnDoSearch(oEvent, tablestruc);
                },
                columns: [
                    columnsTitle
                ]
            });

            // set model & bind Aggregation
            oTableSelectCustomDialog.setModel(oModel);
            oTableSelectCustomDialog.bindAggregation("items", "/", oItemmasterdata1);

            // attach confirm listener
            oTableSelectCustomDialog.attachConfirm(function (evt) {
                oTableSelectCustomDialog.destroy();
            });

            if (idBuzy) { that.byId(idBuzy).setBusy(false); }

            oTableSelectCustomDialog.open();

            function fnDoSearch(oEvent, tablestruc) {
                var aFilters = [],
                    sSearchValue = oEvent.getParameter("value"),
                    itemsBinding = oEvent.getParameter("itemsBinding");

                // create the local filter to apply
                if (sSearchValue !== undefined && sSearchValue.length > 0) {
                    // create multi-field filter to allow search over all attributes

                    tablestruc.forEach(line => {
                        aFilters.push(new sap.ui.model.Filter(line.FIELDNAME, sap.ui.model.FilterOperator.Contains, sSearchValue));
                    });
                    // apply the filter to the bound items, and the Select Dialog will update
                    itemsBinding.filter(new sap.ui.model.Filter(aFilters, false), "Application"); // filters connected with OR
                } else {
                    // filter with empty array to reset filters
                    itemsBinding.filter(aFilters, "Application");
                }
            };
        },
        model: function () {

            var fModel = {};

            fModel.setModel = setModel;
            fModel.getModel = getModel;

            return fModel;

            function setModel(model, modelName, that) {

                /* em estudos
                 _saveModelIndexDb(model.oData, modelName)

                 .then((result) => {

                 }).catch((err) => {
                     that.AddUtilities.showMessage("MSG_ERROR_MODEL_UPDATE", that);
                 });
                  */

                if (that) {
                    that.getView().setModel(model, modelName);
                } else {
                    sap.ui.getCore().setModel(model, modelName);
                }
            }

            function getModel(modelName, that, callBack) {

                let oModel;

                if (that) {
                    oModel = that.getView().getModel(modelName);
                }

                if (!oModel) {
                    oModel = sap.ui.getCore().getModel(modelName);
                }

                if (oModel && callBack) {
                    callBack(oModel);
                }

                if (!callBack && oModel) {
                    return oModel;
                }

                if (!oModel) {

                    //return oModel = _selectModelIndexDb(modelName, callBack);
                }

            }

            function _selectModelIndexDb(modelName, callBack) {

                if (!window.indexedDB) return;

                //  return new Promise((resolve, reject) => {

                let idb = window.indexedDB.open('addLocalModel' + modelName, 1);

                idb.onupgradeneeded = e => {
                    let conn = e.target.result
                    if (conn != undefined) {
                        conn.createObjectStore(modelName, { keyPath: 'key' })
                    }
                }

                idb.onsuccess = e => {
                    let conn = e.target.result;
                    let transaction = conn.transaction([modelName], 'readwrite');
                    let store = transaction.objectStore(modelName);

                    let requestKeys = store.getAllKeys();
                    requestKeys.onsuccess = function () {

                        let request = store.getAll();

                        request.onsuccess = e => {
                            request.result.map((item, i) => {
                                return new JSONModel(item.value);
                                //resolve(new JSONModel(item.value));
                            });
                        }
                        request.onerror = e => {
                            alert(e.target.error);
                        }
                    }
                    requestKeys.onerror = e => {
                        alert(e.target.error);
                    }

                }
                idb.onerror = e => {
                    console.log(e);
                    alert(e.target.error);
                }

                //});
            }

            async function _saveModelIndexDb(data, modelName) {
                return new Promise((resolve, reject) => {
                    let idb = window.indexedDB.open('addLocalModel' + modelName, 1);

                    idb.onupgradeneeded = e => {
                        let conn = e.target.result
                        if (conn != undefined) {
                            conn.createObjectStore(modelName, { keyPath: 'key' })
                        }
                    }

                    idb.onsuccess = e => {
                        let conn = e.target.result;
                        let transaction = conn.transaction([modelName], 'readwrite');
                        let store = transaction.objectStore(modelName);
                        let request = store.put({ key: 1, value: data });

                        request.onsuccess = e => {
                            resolve(true);
                        }
                        request.onerror = e => {
                            reject(e.target.error)
                        }
                    }
                    idb.onerror = e => {
                        reject(e.target.error)
                    }
                });
            }

        },
        _getModel: async function (modelName) {

            let p = new Promise((resolve, reject) => {

                let idb = window.indexedDB.open('addLocalModel' + modelName, 1);

                idb.onupgradeneeded = e => {
                    let conn = e.target.result
                    if (conn != undefined) {
                        conn.createObjectStore(modelName, { keyPath: 'key' })
                    }
                }

                idb.onsuccess = e => {
                    let conn = e.target.result;
                    let transaction = conn.transaction([modelName], 'readwrite');
                    let store = transaction.objectStore(modelName);

                    let requestKeys = store.getAllKeys();
                    requestKeys.onsuccess = function () {

                        let request = store.getAll();

                        request.onsuccess = e => {
                            request.result.map((item, i) => {
                                return new JSONModel(item.value);
                            });
                        }
                        request.onerror = e => {
                            alert(e.target.error);
                        }
                    }
                    requestKeys.onerror = e => {
                        alert(e.target.error);
                    }

                }
                idb.onerror = e => {
                    console.log(e);
                    alert(e.target.error);
                }
            });

            return await p;

            /* let db = window.indexedDB.open('addLocalModel' + modelName, 1);

            let tx = db.transaction([modelName], 'readonly');
            let store = tx.objectStore(modelName);

            let itens = await store.getAll()[0].value;

            doNotTrack.close();

            console.log(itens);

            return new JSONModel(itens); */


        }
    };
});