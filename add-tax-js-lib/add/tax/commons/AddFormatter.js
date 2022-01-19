sap.ui.define([], function () {
    "use strict";

    return {

        formatProcx: function (sProcx) {
            if (sProcx == null) { return; }
            var addParam = sap.ui.getCore().getModel("AddPARAM");
            var desc = null;
            try {
                desc = (addParam.oData.VIEWS['0400'].find(function (x) { if (x.PROCP == sProcx) return x; })).DESCR;
                if (desc) {
                    desc = sProcx + " - " + desc;
                }
            } catch (e) {

            }

            return (desc) ? desc : sProcx;

        },
        formatBukrs: function (sBukrs) {
            if (sBukrs == null) { return; }
            var addParam = sap.ui.getCore().getModel("AddPARAM");
            var desc = null;
            try {
                desc = (addParam.oData.VIEWS['0200'].find(function (x) { if (x.BUKRS == sBukrs) return x; })).DESCR;
                if (desc) {
                    desc = sBukrs + " - " + desc;
                }
            } catch (e) {

            }
            return (desc) ? desc : sBukrs;

        },
        formatStatus: function (sSTATU, sProcx) {
            if (sSTATU == null) { return; }
            var addParam = sap.ui.getCore().getModel("AddPARAM");
            var desc = null;

            if (sProcx) {
                try {
                    var a0112 = (addParam.oData.VIEWS['0400'].find(function (x) { if (x.PROCP == sProcx) return x; }))['0112'];
                    if (a0112) {
                        desc = a0112.find(function (x) { if (x.STATU == sSTATU) return x; });
                        if (desc) {
                            desc = sSTATU + " - " + desc.DESCR;
                        }
                    } else {
                        desc = sSTATU;
                    }
                } catch (e) {
                    return sSTATU;
                }
            }
            //Caso a variável DESC esteja vazia/undefined tenta buscar na variante de status globais
            try {
                if (desc === undefined || desc === null) {
                    var a0104 = (addParam.oData.VIEWS['0104'].find(function (x) { if (x.STATU == sSTATU) return x; }));
                    if (a0104) {
                        desc = sSTATU + " - " + a0104.DESCR;
                    } else {
                        desc = sSTATU;
                    }
                }
            } catch (e) {
                return sSTATU;
            }
            return (desc) ? desc : sSTATU;

        },
        formatStatusState: function (sSTATU, sProcx) {
            if (sSTATU == null) { return; }
            var addParam = sap.ui.getCore().getModel("AddPARAM");
            var tpMSG = "";
            try {
                var a0112 = (addParam.oData.VIEWS['0400'].find(function (x) { if (x.PROCP == sProcx) return x; }))['0112'];
                if (a0112) {
                    tpMSG = a0112.find(function (x) { if (x.STATU == sSTATU) return x; });
                    tpMSG = tpMSG.TPMSG;
                }
            } catch (e) {

            }

            //Caso a variável DESC esteja vazia/undefined tenta buscar na variante de status globais
            try {
                if (tpMSG === undefined || tpMSG === null || tpMSG === "") {
                    var a0104 = (addParam.oData.VIEWS['0104'].find(function (x) { if (x.STATU == sSTATU) return x; }));
                    tpMSG = a0104.TPMSG;
                }
            } catch (e) {

            }

            var state = "None";
            switch (tpMSG) {
                case "E":
                    state = "Error";
                    break;
                case "W":
                    state = "Warning";
                    break;
                case "S":
                    state = "Success";
                    break;
                case "I":
                    state = "Information";
                    break;
            }
            /*if(sSTATU.startsWith("E")) {
                state = "Error";
            } else if (sSTATU.startsWith("W")) {
                state = "Warning";
            } else if (sSTATU.startsWith("S")) {
                state = "Success";
            } else if (sSTATU.startsWith("I")) {
                state = "Information";
            }*/
            return state;

        },
        formatDomin: function (sDomin) {
            if (sDomin == null) { return; }
            var addParam = sap.ui.getCore().getModel("AddPARAM");
            var desc = null;
            try {
                var a0500 = (addParam.oData.VIEWS['0500'].find(function (x) { if (x.DOMIN == sDomin) return x; }));
                if (a0500) {
                    desc = sDomin + " - " + a0500.DESCR;
                } else {
                    return;
                }
            } catch (e) {

            }
            return (desc) ? desc : sDomin;
        },
        formatAtivi: function (sAtivi, sProcx) {
            if (sAtivi == null || sProcx == null) { return; }
            var addParam = sap.ui.getCore().getModel("AddPARAM");
            var desc = null;
            try {
                var a0102 = (addParam.oData.VIEWS['0100'].find(function (x) { if (x.PROCX == sProcx) return x; }))['0102'];
                if (a0102) {
                    desc = a0102.find(function (x) {

                        if (x.ATIVI == sAtivi) { return x; }
                    });
                    if (desc) {
                        desc = sAtivi + " - " + desc.DESCR;
                    } else {
                        desc = a0102.find(function (x) {

                            return x; //first                        
                        });
                        desc = desc.ATIVI + " - " + desc.DESCR;
                    }
                }
            } catch (e) {

            }
            return (desc) ? desc : "00000 - Em Processo";
        },
        formatBoolean: function (params) {
            return (params) ? true : false;
        },
        formatCurrency: function (amount, field) {
            //NÃO UTILIZADA
            var oCurrency = new sap.ui.model.type.Currency({
                showMeasure: false,
                maxFractionDigits: 2
            });

            return oCurrency.formatValue([amount, "BRA"], "string");

        },
        pressOnlyNumber: function (oEvent) {
            //NÃO UTILIZADA
            var myString = oEvent.getSource().getValue();

            myString = myString.replace(/\D/g, "");

            oEvent.getSource().setValue(myString);

        },
        checkTypeFieldAndCreate: function (that, STRUC, namedModel, prefix, Type) {

            //*************************************************************** */
            //* that: controler
            //* STRUC: catalog fields
            //* nameMondel: literal string name model: e.g: 'alv>/'
            //* prefix: id prefix : duplication. 
            //*         for each screen to use '_', or '__', or '__'. Obligatory 
            //* to use '_'. is necessary to pop() command in ValueHelpFields
            //* Type: T or L (T = Text or L = Label OR I = Input)
            //*************************************************************** */
            let vCol = null;
            var Id = null;

            if (prefix) { Id = prefix + STRUC.FIELDNAME.split(that.IDAPP).pop(); }

            Id = undefined;

            //  console.log(Id);
            if (STRUC.CHECKBOX && STRUC.CHECKBOX == "X") {
                vCol = new sap.m.CheckBox({
                    id: Id,
                    //layoutData: new sap.m.FlexItemData({ growFactor: 2 }),
                    enabled: (STRUC.EDIT) ? true : false,
                    editable: (STRUC.EDIT) ? true : false,
                    selected: {
                        path: namedModel + STRUC.FIELDNAME.split(that.IDAPP).pop(),
                        type: 'sap.ui.model.type.Boolean',
                        formatter: that.formatter.formatBoolean
                    }
                })
                return vCol;
            }

            //    if (STRUC.FIELDNAME.split(that.IDAPP).pop() !== "STATU") { //--->temporário até ajustarmos esses tipos: Everton 02/12/2020

            switch (STRUC.DATATYPE) {
                case "CURR":
                case "DEC":
                //  case "NUMC":
                case "QUAN":

                    var decimals = 0;
                    var maxInt = 0;
                    var vType = 'sap.ui.model.type.Float';

                    switch (STRUC.DATATYPE) {

                        case "CURR":
                        case "DEC":
                            if (STRUC.FIELDNAME.split(that.IDAPP).pop().substring(0, 2) == 'AL') {
                                decimals = 6;
                                maxInt = 9;
                            } else {
                                decimals = 2;
                                maxInt = 15;
                            }
                            break;

                        default:
                            vType = 'sap.ui.model.type.Integer';
                            decimals = 0;
                            maxInt = 10;
                            break;
                    }


                    if (STRUC.EDIT !== "X" || Type == "L") {
                        vCol = new sap.m.Label({
                            id: Id,
                            tooltip: (STRUC.tooltip) ? STRUC.tooltip : "",
                            wrapping: false,
                            text: {
                                path: namedModel + STRUC.FIELDNAME.split(that.IDAPP).pop(),
                                type: vType,
                                formatOptions: {
                                    maxIntegerDigits: maxInt,
                                    maxFractionDigits: decimals
                                }
                            }
                        });
                    } else {
                        vCol = new sap.m.Input({
                            id: Id,
                            tooltip: (STRUC.tooltip) ? STRUC.tooltip : "",
                            // wrapping: false, -> incompatível
                            value: {
                                path: namedModel + STRUC.FIELDNAME.split(that.IDAPP).pop(),
                                type: vType,
                                formatOptions: {
                                    maxIntegerDigits: maxInt,
                                    maxFractionDigits: decimals
                                }
                            }
                        });
                    }
                    break;

                case "DATS":
                    if (STRUC.EDIT !== "X" || Type == "L") {
                        vCol = new sap.m.Label({
                            id: Id,
                            tooltip: (STRUC.tooltip) ? STRUC.tooltip : "",
                            wrapping: false,
                            //   submit: vSubmit,
                            text: {
                                path: namedModel + STRUC.FIELDNAME.split(that.IDAPP).pop(),
                                type: 'sap.ui.model.type.Date',
                                formatOptions: {
                                    style: 'short',
                                    source: {
                                        pattern: 'dd/mm/yyyy'
                                    }
                                }
                            }
                        });
                    } else {
                        vCol = new sap.m.DatePicker({
                            id: Id,
                            tooltip: (STRUC.tooltip) ? STRUC.tooltip : "",
                            displayFormat: "dd-MM-yyyy",
                            valueFormat: "yyyyMMdd",
                            change: (STRUC.submit) ? STRUC.submit : function () { },
                            enabled: (STRUC.EDIT) ? true : false,
                            //   submit: vSubmit,
                            value: {
                                path: namedModel + STRUC.FIELDNAME.split(that.IDAPP).pop()
                            }
                        });
                    }

                    break;

                case "TIMS":
                    if (STRUC.EDIT !== "X" || Type == "L") {
                        vCol = new sap.m.Label({
                            id: Id,
                            tooltip: (STRUC.tooltip) ? STRUC.tooltip : "",
                            wrapping: false,
                            text: {
                                path: namedModel + STRUC.FIELDNAME.split(that.IDAPP).pop(),
                                type: 'sap.ui.model.type.Time',
                                formatOptions: {
                                    source: {
                                        pattern: 'hh:mm:ss'
                                    }
                                }
                            }
                        });
                    } else {
                        vCol = new sap.m.TimePicker({
                            id: Id,
                            tooltip: (STRUC.tooltip) ? STRUC.tooltip : "",
                            displayFormat: "hh:mm:ss",
                            valueFormat: "hhmmss",
                            enabled: (STRUC.EDIT) ? true : false,
                            value: {
                                path: namedModel + STRUC.FIELDNAME.split(that.IDAPP).pop()
                            }
                        });
                    }
                    break;

                case "NUMC":

                    vCol = createElementByType(STRUC, namedModel, Type, that);
                    break;

                default:
                    vCol = createElementByType(STRUC, namedModel, Type, that);
                    break;
            }
            /*
            } else {

                try {
                    vCol = new sap.m.Link({
                        id: Id,
                        tooltip: (STRUC.tooltip) ? STRUC.tooltip : "",
                        text: { parts: [{ path: namedModel + STRUC.FIELDNAME.split(that.IDAPP).pop() }, { path: namedModel + 'PROCX' }], formatter: that.formatter.formatStatus },
                        press: that.processLogFromLine

                    });
                } catch {
                    vCol = createElementByType(STRUC, namedModel, Type, that);
                }
            }*/

            try {

                switch (STRUC.DATATYPE) {

                    case "TIMS":
                    case "DATS":
                        break;
                    default:
                        if (STRUC.submit)
                            vCol.attachSubmit(STRUC.submit);
                }
            } catch {
                throw new TypeError("submit incompatível com " + STRUC.FIELDNAME.split(that.IDAPP).pop());
            }

            return vCol;

            function createElementByType(STRUC, namedModel, Type, that) {

                var vCol;

                switch (Type) {

                    case 'T':

                        vCol = new sap.m.Text({
                            //id: Id,
                            text: '{' + namedModel + STRUC.FIELDNAME.split(that.IDAPP).pop() + '}',
                            width: '100%',
                            tooltip: (STRUC.tooltip) ? STRUC.tooltip : "",
                            wrapping: false,
                        }); //.bindProperty("text", namedModel + STRUC.FIELDNAME.split(that.IDAPP).pop());
                        break;

                    case 'I':

                        if (STRUC.RFTAB.length > 0 && STRUC.RFFLD.length > 0) {

                            vCol = new sap.m.Input({
                                id: Id,
                                width: '100%',
                                showValueHelp: true,
                                tooltip: (STRUC.tooltip) ? STRUC.tooltip : "",
                                valueHelpRequest: (STRUC.sh) ? STRUC.sh : function (oEvent) {
                                    that.ProcessMonitor.sh(oEvent, STRUC.FIELDNAME.split(that.IDAPP).pop(), that);
                                },
                                enabled: (STRUC.EDIT) ? true : false,
                                value: {
                                    path: namedModel + STRUC.FIELDNAME.split(that.IDAPP).pop(),


                                }
                            })

                        } else {
                            vCol = new sap.m.Input({
                                id: Id,
                                width: '100%',
                                tooltip: (STRUC.tooltip) ? STRUC.tooltip : "",
                                enabled: (STRUC.EDIT) ? true : false,
                                value: {
                                    path: namedModel + STRUC.FIELDNAME.split(that.IDAPP).pop(),
                                    enabled: (STRUC.EDIT) ? true : false,
                                }
                            });
                        }

                        break;

                    case 'L':

                        vCol = new sap.m.Label({
                            id: Id,
                            wrapping: false,
                        }).bindProperty("text", namedModel + STRUC.FIELDNAME.split(that.IDAPP).pop());
                        break;
                }

                return vCol;
            }
        }
    };
});