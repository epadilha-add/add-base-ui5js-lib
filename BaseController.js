sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "./callService"
], function (Controller, JSONModel, callService) {
    "use strict";

    return Controller.extend("add.home.app.component.BaseController", {
        callService: callService,
        loadingConnfig: function (idapp) {
            // Log.info("//TODO Definição temporária para obtenção do host");
            /**
             * definição temporária pois a escolha do host deverá ser feita no AS da plataforma,
             * portanto, as requisições serão 100% para o host principal da aplicação (window.location.origin)
             * e com base nas configurações do App managemant ou appe Add a requisição deverá redirecionar ao
             * servidor remoto previamente configurado 
             * Everton: 17/04/2021
             */
            let oModel = new JSONModel();
            oModel.loadData("add/config/" + idapp, null, false);
            sap.ui.getCore().setModel(oModel, "AppConfig");

            let oMe = new JSONModel();
            oMe.loadData("me", null, false);
            sap.ui.getCore().setModel(oMe, "userInfo");

        },

        userInfo: function () {

            return new sap.m.Button({
                text: sap.ui.getCore().getModel("userInfo").getData().email,
                icon: 'sap-icon://employee',
                //type: sap.m.ButtonType.Transparent,
                press: function () {
                    var userInfo = new sap.m.QuickView({
                        placement: sap.m.PlacementType.VerticalPreferedBottom,
                        pages: [
                            new sap.m.QuickViewPage({
                                header: "Informações do Usuário",
                                title: sap.ui.getCore().getModel("userInfo").getData().preferred_username,
                                //titleUrl: "https://www.sap.com",
                                /*       avatar: new sap.m.Avatar({
                                          initials: "JD",
                                          displayShape: "Circle",
                                          detailBox: new sap.m.LightBox({
                                              imageContent: sap.m.LightBoxItem({
                                                  imageSrc: "images/Woman_avatar_01.png",
                                                  title: "LightBox example"
                                              })
                                          })
                                      }) */
                                groups: [
                                    new sap.m.QuickViewGroup({
                                        //heading: "Store details",
                                        elements: [
                                            new sap.m.QuickViewGroupElement({
                                                // label: "Website",
                                                value: "Sair",
                                                url: "/logout",
                                                type: sap.m.QuickViewGroupElementType.link
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    });

                    userInfo.openBy(this);

                }
            })
        },

        getAppId(that) {
            // that.baseController = this;
            return that.getView().getId().split('---').pop()
        },

        getToolHeader(exParts) {

            let extenalParts = (exParts) ? exParts : null;

            let parts = [
                new sap.m.Button({
                    icon: 'sap-icon://menu2',
                    type: sap.m.ButtonType.Transparent,
                    press: function () {

                        var sideExpanded = this.getParent().getParent().getSideExpanded();

                        if (sideExpanded) {
                            this.setTooltip('Large Size Navigation');
                        } else {
                            this.setTooltip('Small Size Navigation');
                        }

                        this.getParent().getParent().setSideExpanded(!sideExpanded);
                    },
                    tooltip: 'Small Size Navigation'
                }),
                new sap.m.ToolbarSpacer(),

                //new sap.m.Image({ src: '../../favicon.png' }),
                new sap.m.FormattedText({ htmlText: '<h3>' + sap.ui.getCore().getModel("AppConfig").getData().app.title + '</h3>', tooltip: sap.ui.getCore().getModel("AppConfig").getData().app.tooltip }),
                new sap.m.ToolbarSpacer(), this.userInfo(), this.notification || null
                //new sap.m.Avatar({ displaySize: sap.m.AvatarSize.Custom })
            ]

            return new sap.tnt.ToolHeader({
                content: extenalParts || parts
            });

        }
    })
});