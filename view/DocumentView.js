sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/layout/Splitter",
    "sap/ui/layout/SplitterLayoutData",
    "sap/ui/layout/HorizontalLayout",
    "sap/ui/layout/VerticalLayout",
    "sap/m/Page",
    "sap/m/Button",
    "sap/m/CheckBox",
    "sap/m/Input",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/m/FlexItemData",
    "sap/m/PDFViewer",
    "sap/ui/table/Table",
    "../ui/ScreenElements",
    "./ToolBarButtons",
    "sap/ui/codeeditor/CodeEditor",
    "../commons/FieldsCatalog"
], function (Object, Splitter, SplitterLayoutData, HorizontalLayout, VerticalLayout, Page, Button, CheckBox, Input, Text, VBox, FlexItemData, PDFViewer, FieldsCatalog) {
    "use strict";
    let oSplitter = {};
    let This = {};
    var MainView;
    let pageSize = 50;
    return Object.extend("add.ui.View.DocumentView", {

        constructor: function (that, icon, topRight, lowerLeft, factory, title) {
            "use strict"


            MainView = that;
            this.topRight = topRight;
            this.lowerLeft = lowerLeft;

            let tit = new sap.m.Label({
                text: title || '{i18n>complementData}',
            });
            this.Page = new Page({
                showHeader: false,
                showSubHeader: true,
                showNavButton: false,
                // icon: ,
                subHeader: new sap.m.Bar({
                    contentLeft: [new sap.m.Button({
                        type: sap.m.ButtonType.Back,
                        tooltip: "Voltar",
                        press: () => {
                            MainView.mainContent.back();
                        },
                    }), tit],
                    contentMiddle: [],
                    contentRight: [new sap.m.Button({
                        icon: 'sap-icon://decline',
                        tooltip: "Voltar",
                        press: () => {
                            MainView.mainContent.back();
                        },
                    })],
                }),
                content: [
                ]
            });

            if (factory) {
                MainView.getView().addDependent(this.Page);
                MainView.mainContent.addPage(this.Page);
            }

            This = this;

            return new sap.m.Button({
                tooltip: "{i18n>documentView}",
                icon: icon || "sap-icon://accounting-document-verification",
                press: async (oEvent) => {
                    let bt = oEvent.getSource();
                    bt.setBlocked(true);
                    MainView.getView().setBusy(true);

                    let lines = MainView.View.table.getSelectedIndices();
                    if (!lines || lines.length === 0) {
                        MainView.View.table.setSelectedIndex(0);
                        lines = MainView.View.table.getSelectedIndices();
                    }

                    let ids = [];
                    for (const i of lines) {
                        ids.push(MainView.data[i].D0000 || MainView.data[i].id);
                    }

                    await This.setIds(topRight ? [ids[0]] : ids).getData(MainView, topRight ? [ids[0]] : ids, topRight, lowerLeft, factory, title);

                    MainView.mainContent.to(This.Page);
                    MainView.getView().setBusy(false);
                    bt.setBlocked(false);

                },
            });

        },
        setIds(docs) {
            this.ids = docs;
            return this;
        },
        async getData(MainView, docs = this.ids, topRight, lowerLeft, factory, title) {

            if (!docs) return;

            MainView.treeSelectPart = this.treeSelectPart;
            MainView.getTable = this.getTable;
            MainView.gotToItem = this.gotToItem;
            let d0000 = [];
            let dh = [];
            let d0002 = [];
            let datach = [];
            let datachb = [];

            d0000 = await MainView.callService
                .postSync("add", {
                    actionName: "TAXD0000.list",
                    params: {
                        pageSize: pageSize,
                        query: {
                            id: { $in: docs }
                        },
                    },
                })
                .then((resp) => {

                    if (typeof resp === "string") resp = JSON.parse(resp);

                    return resp.rows;

                }).catch(error => {

                })

            MainView.d0000 = d0000;

            if (d0000.length && This.topRight)
                dh = await MainView.callService
                    .postSync("add", {
                        actionName: "TAXDH.list",
                        params: {
                            pageSize: pageSize,
                            query: { D0000: { $in: d0000.map(d => d.id) } },
                        },
                    })
                    .then((resp) => {


                        if (typeof resp === "string") resp = JSON.parse(resp);

                        return resp.rows;

                    }).catch(error => {

                    })

            if (dh) {
                d0000.map(d00 => {
                    const h = dh.find(dh => dh.D0000 === d00.id);
                    d00 = { ...h, ...d00 }
                })
            }


            if (d0000.length)
                d0002 = await MainView.callService
                    .postSync("add", {
                        actionName: "TAXD0002.list",
                        params: {
                            pageSize: pageSize,
                            query: { D0000: { $in: d0000.map(d => d.id) } },
                        },
                    })
                    .then((resp) => {

                        if (typeof resp === "string") resp = JSON.parse(resp);

                        return resp.rows

                    }).catch(error => {

                    })

            if (d0002.length)
                datach = await MainView.callService
                    .postSync("add", {
                        actionName: "TAXDATCH.list",
                        params: {
                            pageSize: pageSize,
                            query: {
                                id: { $in: d0002.map(d => d.FILNR) }
                            },
                        },
                    })
                    .then((resp) => {


                        if (typeof resp === "string") resp = JSON.parse(resp);

                        return resp.rows

                    }).catch(error => {

                    })

            if (datach.length)
                datachb = await MainView.callService
                    .postSync("add", {
                        actionName: "TAXDATCHB.find",
                        params: {
                            pageSize: pageSize,
                            query: { DATCH: { $in: datach.map(d => d.id) } },
                            cache: false
                        },
                    })
                    .then((resp) => {

                        if (typeof resp === "string") resp = JSON.parse(resp);

                        return resp;

                    }).catch(error => {

                    })


            oSplitter = new Splitter({
                contentAreas: []
            });

            oSplitter.setLayoutData(new FlexItemData({
                growFactor: 1
            }));

            this.getTree(d0000, MainView, new SplitterLayoutData({
                resizable: true,
                size: "15%",
                minSize: 200
            })).then((topLeft) => {

                This.topLeft = topLeft;
                /* if (lowerLeft && This.lowerLeft) {
                     oSplitter.addContentArea(new Splitter({
                         contentAreas: [This.topLeft, This.lowerLeft],
                         orientation: "Vertical",
                         layoutData: new SplitterLayoutData({
                             resizable: true,
                             size: "30%",
                             minSize: 200
                         })
                     }))
                 } else { */
                oSplitter.addContentArea(new Splitter({
                    contentAreas: [This.topLeft],
                    orientation: "Vertical",
                    layoutData: new SplitterLayoutData({
                        resizable: true,
                        size: "30%",
                        minSize: 200
                    })
                }))

                //}

                if (topRight) {
                    this.getTable(dh || d0000, MainView, new SplitterLayoutData({
                        resizable: true,
                        size: "15%",
                        minSize: 100
                    })).then((topRight) => {

                        This.topRight = topRight;

                        MainView.treeSelectPart(d0002[0], MainView).then((lowerRight) => {
                            This.lowerRight = lowerRight;
                            oSplitter.addContentArea(
                                new Splitter({
                                    contentAreas: [This.topRight, This.lowerRight],
                                    orientation: "Vertical"
                                }));
                        });
                        oSplitter.setBusy(false);
                    });
                } else {
                    MainView.treeSelectPart(d0002[0], MainView).then((lowerRight) => {
                        This.lowerRight = lowerRight;
                        oSplitter.addContentArea(
                            new Splitter({
                                contentAreas: [This.lowerRight],
                                orientation: "Vertical"
                            }));
                    });
                    oSplitter.setBusy(false);
                }
            });

            this.Page.destroyContent();

            oSplitter.setBusy(true);

            this.Page.addContent(
                new VBox({
                    height: "100%",
                    items: [
                        oSplitter
                    ]
                })
            )

            this.Page.getSubHeader().getContentLeft()[1].setText(MainView.i18n(title));
        },
        async getTable(rows, MainView, lay) {

            if (!rows || rows.length === 0) return;

            let fields = [];
            let table = {};
            let catalog = [];

            table = new sap.ui.table.Table({
                selectionMode: "MultiToggle",
                visibleRowCount: 1,
                minAutoRowCount: 1,
                visibleRowCountMode: "Auto",
                ariaLabelledBy: "title",

            });

            for (const key in rows[0]) {
                fields.push({ field: key });
            }
            await new ScreenElements(MainView)
                .getStruc(fields, true, true)
                .then(data => {
                    if (!data) {
                        console.error("ERR_GET_STRUCT_FAILED");
                        return;
                    }

                    catalog = JSON.parse(data);

                    for (let field of catalog) {
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

                        table.addColumn(oColumn);
                    }

                    MainView.getView().addDependent(table);
                });


            table.setModel(new MainView.Model(rows));

            table.bindRows("/");

            /*             table.setToolbar(
                            new sap.m.Toolbar({
            
                            })
                        ) */
            this.avatar = new sap.m.Avatar({
                src: 'sap-icon://pdf-attachment',
                displaySize: sap.m.AvatarSize.XS,
                //backgroundColor: sap.m.AvatarColor.Accent1,
                //tooltip: MainView.IDAPP,
            });

            let navButton = !rows[0].INDEC

                ? new sap.m.Button({
                    icon: "sap-icon://forward",
                    tooltip: "Ir para Itens",
                    text: 'Ir para Itens', press: async (oEvent) => {

                        await MainView.gotToItem(rows, MainView);

                        oSplitter.getContentAreas()[1].getContentAreas()[0].destroy();
                        oSplitter.getContentAreas()[1].insertContentArea(This.topRight, -1);
                    }
                }) : new sap.m.Button({
                    icon: "sap-icon://response",
                    tooltip: "Voltar para o cabeçalho",
                    text: 'ir para cabeçalho',
                    press: async (oEvent) => {

                        This.topRight = await MainView.getTable(MainView.d0000, MainView);
                        oSplitter.getContentAreas()[1].getContentAreas()[0].destroy();
                        oSplitter.getContentAreas()[1].insertContentArea(This.topRight, -1);
                    }
                })

            return new sap.m.Page({
                showHeader: false,
                subHeader: new sap.m.Bar({
                    contentLeft: [navButton],
                    contentMiddle: [],
                    contentRight: [],
                }),
                showSubHeader: true,
                showNavButton: false,
                //icon: MainView.icon,
                content: table,
                enableScrolling: false,
                layoutData: lay || new SplitterLayoutData({
                    resizable: true,
                    size: "15%",
                    minSize: 150
                })
            });
        },

        async gotToItem(d0000, MainView) {

            let taxdi = await MainView.callService
                .postSync("add", {
                    actionName: "TAXDI.list",
                    params: {
                        pageSize: pageSize,
                        query: { D0000: d0000.id },
                        cache: false
                    },
                })
                .then((resp) => {

                    if (typeof resp === "string") resp = JSON.parse(resp);

                    return resp.rows;

                }).catch(error => {

                });
            This.topRight = await MainView.getTable(taxdi, MainView, new SplitterLayoutData({
                resizable: true,
                size: "15%",
                minSize: 100
            }));
        },

        treeSelectPart: async function (node, MainView) {

            if (!node || !node.FILNR) return;

            let file = await MainView.callService
                .postSync("add", {
                    actionName: "TAXDATCHB.find",
                    params: {
                        pageSize: pageSize,
                        query: { DATCH: node.FILNR },
                        cache: false
                    },
                })
                .then((resp) => {

                    if (typeof resp === "string") resp = JSON.parse(resp);

                    return resp;

                }).catch(error => {

                });

            if (!file) return;

            let blob;

            switch (node.TYPE) {
                case '.TXT':
                    blob = MainView.b64toBlob(file[0].FILBIN, 'text/plain');
                    break;
                case '.HTM':
                    blob = MainView.b64toBlob(file[0].FILBIN, 'text/html');
                    break;
                case '.PDF':
                    blob = MainView.b64toBlob(file[0].FILBIN, 'application/pdf');
                    break;
                case '.XML':

                    function formatXml(xml, tab) {
                        var formatted = '', indent = '';
                        tab = tab || '\t';
                        xml.split(/>\s*</).forEach(function (node) {
                            if (node.match(/^\/\w/)) indent = indent.substring(tab.length);
                            formatted += indent + '<' + node + '>\r\n';
                            if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab;
                        });
                        return formatted.substring(1, formatted.length - 3);
                    }

                    blob = MainView.b64toBlob(file[0].FILBIN, 'text/plain');

                    let code = new sap.ui.codeeditor.CodeEditor({
                        height: "100%",
                        type: 'xml',
                        editable: false,
                        colorTheme: "chrome",
                    })

                    code.setValue(formatXml(await blob.text(), '   '));
                    code.prettyPrint();
                    return code;
                default:

                    break;
            }


            return new sap.ui.core.HTML({
                preferDOM: true,
                sanitizeContent: false,
                content: "<iframe height='100%' width='100%' src=" + URL.createObjectURL(blob) + "></iframe>"
            })

        },
        async getTree(d0000, MainView, lay) {

            let d0002 = await MainView.callService
                .postSync("add", {
                    actionName: "TAXD0002.list",
                    params: {
                        pageSize: pageSize,
                        query: {
                            D0000: { $in: d0000.map(d => d.id) }
                        },
                    },
                })
                .then((resp) => {


                    if (typeof resp === "string") resp = JSON.parse(resp);

                    return resp.rows;

                }).catch(error => {

                }) || [];

            let d0003 = await MainView.callService
                .postSync("add", {
                    actionName: "TAXD0003.list",
                    params: {
                        pageSize: pageSize,
                        query: {
                            D0002: { $in: d0002.map(d2 => d2.id) }
                        },
                    },
                })
                .then((resp) => {

                    if (typeof resp === "string") resp = JSON.parse(resp);

                    return resp.rows;

                }).catch(error => {

                }) || [];

            var oData = [];
            let domins = [];
            let tree = {};
            let senders = [];
            let subjes = [];
            let sender = {};

            domins = new Set(d0000.map(d0 => d0.DOMIN));
            senders = new Set(d0000.map(d0 => d0.SENDE));

            for (const domin of domins) {

                tree =
                {
                    text: domin,
                    ref: "sap-icon://building",
                    state: "Success",
                    nodes: []
                }

                for (const send of senders) {

                    sender =
                    {
                        text: send,
                        state: "Success",
                        nodes: []
                    }

                    for (const d0 of d0000.filter(d0 => d0.DOMIN === domin && d0.SENDE === send)) {

                        sender.ref = d0.ORIGE === 'EM' ? "sap-icon://email-read" : 'sap-icon://document';
                        sender.FILNR = d0.FILNB;
                        sender.nodes.push(
                            {

                                text: MainView.dataFormat(String(d0.DTENV) + String(d0.HRENV)) + " : " + d0.SUBJE,
                                ref: "sap-icon://outdent",
                                FILNR: d0.FILNB,
                                TYPE: '.HTM',
                                nodes: d0002.filter(d2 => d0.id === d2.D0000).map(d2 => {

                                    let name = (d2.NAME.length > 20)
                                        ? (d2.NAME || ("FILE" + d2.TYPE)).substring(0, 10) + "..." + d2.TYPE
                                        : (d2.NAME || ("FILE" + d2.TYPE));

                                    let icon = d2.ICONA || MainView['ICON_' + d2.TYPE.split('.')[1]] || 'sap-icon://document';

                                    return {
                                        text: name,
                                        tooltip: (d2.NAME || ("FILE" + d2.TYPE)),
                                        ref: icon || "sap-icon://action",
                                        FILNR: d2.FILNR,
                                        TYPE: d2.TYPE,
                                        nodes: d0003.filter(d3 => d2.id === d3.D0002).map(d3 => {

                                            let icon = d3.ICON || MainView['ICON_' + d3.TYPE.split('.')[1]] || 'sap-icon://document';

                                            let name = (d3?.NAME.length > 20)
                                                ? (d3.NAME || ("FILE" + d3.TYPE)).substring(0, 10) + "..." + d3.TYPE
                                                : (d3.NAME || ("FILE" + d3.TYPE));

                                            return {
                                                text: name,
                                                ref: icon || "sap-icon://action",
                                                FILNR: d3.FILNR,
                                                TYPE: d3.TYPE,
                                            }

                                        })
                                    }

                                })
                            }, d0.LINK1 ? {
                                //text: d0000[0].LINK1,
                                icon: MainView.ICON_LINK1,
                                ref: MainView.ICON_LINK1,
                            } : null
                        )
                    }
                    tree.nodes.push(sender);
                }

                oData.push(tree);
                sender = {};
                tree = {};
            }

            var oTree = new sap.m.Tree({
                layoutData: lay
            }).addStyleClass("sapUiSizeCompact");

            //JSON
            var oModel = new sap.ui.model.json.JSONModel();
            var sType = "Active";
            oTree.setModel(oModel);
            oModel.setSizeLimit(200);
            // set the data to the model
            oModel.setData(oData);
            var oStandardTreeItem = new sap.m.StandardTreeItem({
                title: "{text}",
                highlight: "{state}",
                type: sType,
                //selected: true,
                press: async (oEvent) => {
                    let node = oEvent.getSource().getModel().getProperty(oEvent.getSource().getBindingContextPath());

                    if (!node.FILNR) return;

                    let content =
                        oSplitter.getContentAreas()[1].getContentAreas()[1] ||
                        oSplitter.getContentAreas()[1].getContentAreas()[0];
                    content.destroy();
                    oSplitter.getContentAreas()[1].addContentArea(await MainView.treeSelectPart(node, MainView));
                },
                //detailPress: handleControlEvent
            });

            oStandardTreeItem.bindProperty("icon", {
                path: "ref"
            })

            oTree.bindItems("/", oStandardTreeItem);
            var oBinding = oTree.getBinding("items");
            oTree.expandToLevel(2);

            //oTree.onItemExpanderPressed(oTree.getItems()[1], true)  

            //$("body").addClass("sapUiSizeCompact");
            return new sap.m.Page({

                content: [oTree],
                showHeader: false,
                layoutData: new SplitterLayoutData({
                    resizable: true,
                    //size: "30%",
                    minSize: 200
                })
            });
        }
    }
    )
});