sap.ui.define(["../commons/AddModels", "sap/ui/model/json/JSONModel", "sap/ui/core/format/DateFormat", "sap/base/Log",], function (AddModels, JSONModel, DateFormat, Log) {
    "use strict";
    var This = {};
    var oMessageView = {};
    var oPopover = {};
    return sap.m.Button.extend("add.ui.Notification", {

        factory: function (that) {
            this.modelStart();
            this.that = that;
            this.setIcon("sap-icon://bell");
            this.setType(sap.m.ButtonType.Transparent);
            this.setTooltip('{i18n>logOccurrences}');
            this.attachPress(this.handlePopoverPress);
            this._connected = false;

            this._log = sap.ui.getCore().getModel("AppConfig").getData().system.notifications || {
                active: false, "type": {
                    "erro": true,
                    "information": true,
                    "warning": true
                }, limitOccurrences: 0
            };

            This = this;
            this._buttons = [];
            return this;
        },
        factoryButton: function (that) {

            let bt = new sap.m.Button({ icon: "sap-icon://bell", type: sap.m.ButtonType.Transparent, tooltip: "{i18n>logOccurrences}", press: this.handlePopoverPress });
            this._buttons.push(bt);

            that.getView().addDependent(bt);

            return bt;

        },
        connect: function () {

            this.startNotificationArea();
            this.startWS();

            if (!sap.ui.getCore().getModel("AppConfig").getData().app.websSocket.connected) {
                this._connected = true;
                sap.ui.getCore().getModel("AppConfig").getData().app.websSocket.connected = true;
                sap.ui.getCore().getModel("AppConfig").getData().app.websSocket.app = AddModels.IDAPP;
            } else {
                Log.info("Already connected by ", sap.ui.getCore().getModel("AppConfig").getData().app.websSocket.app)
            }
        },
        getButton: function () {
            return this;
        }
        ,
        renderer: {},

        getAppNotifications: function () {
            let notfy = [];

            try {

                notfy = sap.ui.getCore().getModel("Notifications").getData().filter(item => item.app == AddModels.IDAPP);

                if (notfy && !(notfy instanceof Array)) notfy = [notfy];

                if (notfy && notfy.length > 0) {
                    notfy.sort(function (a, b) {
                        if (a.entry < b.entry) return -1;
                        if (a.entry > b.entry) return 1;
                        return 0;
                    }).reverse();
                    notfy.splice(this._log.limitOccurrences || 100, notfy.length);
                }
            } catch {
                Log.info("getAppNotifications", 'dataNotFound');
            }

            return (notfy.length > 0) ? new JSONModel(notfy) : null;
        },

        handlePopoverPress: function (oEvent) {
            try {

                let oModel = This.getAppNotifications();

                if (!oModel) return;

                oMessageView.setModel(oModel);

                oModel.refresh();
                oMessageView.navigateBack();

                if (oEvent) {
                    oPopover.openBy(oEvent.getSource());
                } else {
                    oPopover.openBy(This);
                }
            } catch (error) {
                Log.error(error);
            }
        },

        modelStart() {

            let oModel = sap.ui.getCore().getModel("AppConfig");

            if (!oModel) {
                oModel = new JSONModel();
                oModel.loadData("add/config/" + AddModels.IDAPP || "", null, false);
                sap.ui.getCore().setModel(oModel, "AppConfig");
            }
        },

        startWS() {

            if (!this._log.active) return;

            if (this.ws) return;

            let conf = sap.ui.getCore().getModel("AppConfig").getData();
            let port = (window.location.protocol == "http:") ? 8080 : (conf && conf.app.websSocket.port) ? conf.app.websSocket.port : 3000;

            let protocol = (window.location.protocol == "http:") ? "ws://" : "wss://";
            var HOST = protocol + window.location.hostname + ":" + port;
            try {
                this.ws = new WebSocket(HOST);
            } catch {
                Log.error("Erro websSocket adreess", HOST);
                return;
            }

            var el;

            this.ws.onopen = () => {
                this.ws.send(AddModels.IDAPP)
            }

            this.ws.onerror = (error) => {
                console.log(`WebSocket error: ${error}`)
            }

            this.ws.onmessage = (e) => {

                let msg = {};

                try {
                    msg = JSON.parse(e.data);
                } catch {
                    return;
                }

                if (msg instanceof Array) {
                    for (let msg of m) {
                        this.appendNotification(msg);
                    }
                } else {
                    this.appendNotification(msg);
                }
            }
            // this.connected();
        },

        _appendModel(oModel, msg) {

            if (this.isConnected() === false) return;

            msg.title = msg.entry + " : " + msg.title;

            if (oModel) {
                if (oModel.oData.length > 0) {
                    oModel.oData.unshift(msg);
                } else {
                    oModel.setData([msg]);
                }
            } else {
                try {
                    oModel = new JSONModel([msg]);
                } catch (error) {
                    oModel = new JSONModel([]);
                }
            }

            oModel.refresh();

            return oModel;
        },
        appendNotification(msg) {

            if (!msg) return;

            try {
                if (!this._log.type[msg.type]) return;
            } catch {
                Log.error("Notification area - type not found");
                return;
            }

            try {

                let oModel;

                if (this.isConnected() == true) {
                    oModel = sap.ui.getCore().getModel("Notifications");
                    oModel = this._appendModel(oModel, msg);
                    sap.ui.getCore().setModel(oModel, "Notifications");
                    oMessageView.setModel(oModel);
                    oModel.refresh();
                }

                if (msg.type == "Error" && AddModels.IDAPP == msg.app) {

                    this.setType("Negative");

                    for (const bt of this._buttons) {
                        bt.setType("Negative");
                    }

                    //sap.ui.getCore().byId("MainMenuOccurrences").setIcon("sap-icon://alert");
                    if (oPopover.isOpen() == false) {
                        try {
                            // this.handlePopoverPress();
                        } catch {
                            //pode estar sem foco
                        }

                    }
                };

            } catch (error) {
                throw new TypeError("ErrorNotification " + error);
            }
        }
        ,
        startNotificationArea: function () {

            var oLink = new sap.m.Link({
                text: "{i18n>showMore}",
                href: window.location.origin + "/add/notification/{uuid}",
                target: "_blank"
            });

            var oMessageTemplate = new sap.m.MessageItem({
                type: '{type}',
                title: '{title}',
                description: '{description}',
                subtitle: '{subtitle}',
                counter: '{counter}',
                markupDescription: '{markupDescription}',
                link: oLink
            });

            var oModel = new sap.ui.model.json.JSONModel();

            let m = {};

            try {
                m = AddModels.model("UserNotification").getModel().getProperty('/');
            } catch (error) {
                m = new JSONModel([]);
            }

            if (m instanceof Array) {
                oModel.setData(m);
            } else {
                oModel.setData([m]);
            }

            oMessageView = new sap.m.MessageView({
                showDetailsPageHeader: false,
                itemSelect: function () {
                    oBackButton.setVisible(true);
                },
                items: {
                    path: "/",
                    template: oMessageTemplate
                }
            });
            var oBackButton = new sap.m.Button({
                icon: sap.ui.core.IconPool.getIconURI("nav-back"),
                visible: false,
                press: function () {
                    oMessageView.navigateBack();
                    oPopover.focus();
                    this.setVisible(false);
                }
            });

            // oMessageView.setModel(oModel);

            var oCloseButton = new sap.m.Button({
                text: '{i18n>close}',
                press: function () {
                    oPopover.close();
                }
            });

            var oPopoverFooter = new sap.m.Bar({
                contentRight: oCloseButton
            });

            var oPopoverBar = new sap.m.Bar({
                contentLeft: [oBackButton],
                contentMiddle: [
                    new sap.m.Text({
                        text: '{i18n>messages}'
                    })
                ]
            });

            oPopover = new sap.m.Popover({
                customHeader: oPopoverBar,
                contentWidth: this._contentWidth || "640px",
                contentHeight: this.contentHeight || "440px",
                verticalScrolling: false,
                modal: false,
                content: [oMessageView],
                footer: oPopoverFooter
            });


            if (this.that) {
                this.that.getView().addDependent(oPopover);
            } else {
                This.that.getView().addDependent(oPopover);
            }
        },

        connected: function () {
            this._connected = true;
        },

        isConnected: function () {
            return this._connected || false;
        },

        getPopover() {
            return oPopover;
        },
        getMessageView() {
            return oMessageView;
        }
    })
});