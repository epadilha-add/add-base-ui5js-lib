sap.ui.define(["sap/tnt/ToolHeader"], function () {
    "use strict";

    //sap.ui.getCore().setModel(new sap.ui.model.json.JSONModel({ app: { tootp: "", title: "" } }), "AppConfig");

    let usrInfo = new sap.m.Button({
        icon: 'sap-icon://employee',
        //type: sap.m.ButtonType.Transparent,
        press: function () {
            var userInfo = new sap.m.QuickView({
                placement: sap.m.PlacementType.VerticalPreferedBottom,
                pages: [
                    new sap.m.QuickViewPage({
                        header: "Informações do Usuário",
                        //  title: "Lorem ipsum dolor sit amet",
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

    return new sap.tnt.ToolHeader({

        content: [
            new sap.m.Button({
                icon: 'sap-icon://menu2',
                type: sap.m.ButtonType.Transparent,
                press: function () {
                    /*            var sideExpanded = screenParts.getSideExpanded();

                               if (sideExpanded) {
                                   this.setTooltip('Large Size Navigation');
                               } else {
                                   this.setTooltip('Small Size Navigation');
                               } */

                    // screenParts.setSideExpanded(!sideExpanded);
                },
                tooltip: 'Small Size Navigation'
            }),
            new sap.m.ToolbarSpacer(),

            //new sap.m.Image({ src: '../../favicon.png' }),
            //new sap.m.FormattedText({ htmlText: '<h3>' + sap.ui.getCore().getModel("AppConfig").getData().app.title + '</h3>', tooltip: sap.ui.getCore().getModel("AppConfig").getData().app.tooltip }),
            new sap.m.FormattedText({ htmlText: '<h3>' + '{AppConfig>title}' + '</h3>', tooltip: '{AppConfig>app.tooltip}' }),
            //new sap.m.ToolbarSpacer(), usrInfo, That.notification || null
            //new sap.m.Avatar({ displaySize: sap.m.AvatarSize.Custom })
        ]
    })
})