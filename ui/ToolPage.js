

sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/json/JSONModel",
    "../commons/AddModels",
    "sap/tnt/SideNavigation",
    "sap/m/NavContainer",
    "sap/m/ScrollContainer",
    "./ScreenFactory",
    "sap/m/TabContainerItem",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/base/Log",
    "./MainContent",
], function (Object, JSONModel, AddModels, SideNavigation, NavContainer, ScrollContainer, ScreenFactory, TabContainerItem, MessageBox, MessageToast, Log) {
    "use strict";

    var That;
    var This;
    var Screen;
    var Menu = [];
    var TabContainer;
    var Tabs = [];
    var Contents = [];
    var screenParts = undefined;

    return Object.extend("add.ui.ToolPage", {

        onNavBack: function (oEvent) {
            this.getParent().back();
        },
        constructor: function (that) {

            this.IDAPP = that.IDAPP;
            this.callService = that.callService;
            this.sideNavigation = {};
            this.setSideNavigation = that.setSideNavigation;
            this.ToolHeader = that.ToolHeader;
            that.appRoot = this;
            that.apps = {};
            this.user = that.user;

            This = this;
            That = that;

            this.config = sap.ui.getCore().getModel("AppConfig");

            if (!this.config || !this.config.getData()) {
                /**
                 * caso controller não tenha carregado as configurações
                 */
                that.loadingConnfig(this.IDAPP).then((data) => {

                    _continue(this);

                }).catch((err) => {

                    _go(that);

                });
            } else {

                _continue(this);
            }

            function _continue(that) {

                Screen = new ScreenFactory(This);

                This.config = sap.ui.getCore().getModel("AppConfig");

                try {
                    if (sap.ui.getCore().getModel("userInfo").getData().currentMandt) {
                        This.component =
                            This.config.getData().navigation[0].key;


                        if (!that.component) that.component = This.IDAPP;

                        Contents[This.component] = new ScreenFactory(This).create({
                            name: This.component
                        })

                        This.mainsContent = {};

                        This.mainsContent = new sap.m.NavContainer({
                            pages: [Contents[This.component]],
                            initialPage: Contents[This.component]
                        });

                        if (that.component !== This.IDAPP) {
                            This._setLoadConfig(This.IDAPP);
                            This._setTabContainer();
                            This._setToolHeader();
                            This._setScreenParts();
                        }
                        _go(that);

                    } else {

                        That.selectMandt(That.mandts);
                    }
                } catch {
                }
            }

            function _go() {

                if (!that.apps[that.IDAPP]) {
                    that.apps[that.IDAPP] = This.getContent();

                    that.main = new sap.m.NavContainer({
                        pages: [that.apps[that.IDAPP]],
                        initialPage: that.apps[that.IDAPP]
                    });

                    that.getView().getContent()[0].addPage(that.main);
                } else {
                    that.main.to(that.apps[that.IDAPP])
                }
                sap.ui.core.BusyIndicator.hide();
            }
        },
        /*************************************************************************
         *_setMainMenu.
         * @private
         * 
         *************************************************************************/
        _setLoadConfig: async function (idapp) {

            if (this.setSideNavigation || this.setSideNavigation === undefined)
                this._setSideNavigation();

        },
        /*************************************************************************
         *_getScreenParts.
         * @private
         * 
         *************************************************************************/
        _getScreenParts(that) {

            return screenParts || new sap.m.MessagePage(
                {
                    title: sap.ui.getCore().getModel("MessagePage").getData().title,
                    text: sap.ui.getCore().getModel("MessagePage").getData().text,
                    enableFormattedText: false,
                    showHeader: true,
                    description: sap.ui.getCore().getModel("MessagePage").getData().description,
                    icon: sap.ui.getCore().getModel("MessagePage").getData().icon
                });

        },
        /*************************************************************************
         *_getScreenParts.
         * @private
         * 
         *************************************************************************/
        _setScreenParts: function (param) {
            screenParts = new sap.tnt.ToolPage({
                header: this._getToolHeader(),
                sideContent: this._getSideNavigation(),
                // mainContents: //this.mainsContent
            });

            screenParts.addMainContent(Contents[this.component]);
        },
        /*************************************************************************
         *_getSideNavigation.
         * @private
         * 
         *************************************************************************/
        _getSideNavigation: function (param) {
            if (this.setSideNavigation || this.setSideNavigation === undefined)
                return this.sideNavigation;
        },
        /*************************************************************************
         *_setSideNavigation.
         * @private
         * 
         *************************************************************************/
        _setSideNavigation: function (model) {

            this.sideNavigation = new SideNavigation(
                {
                    expanded: true,
                    selectedKey: "{selectedKey}",
                    itemSelect: this.onItemSelectMenu,

                    item: new sap.tnt.NavigationList({
                        items: {
                            template: new sap.tnt.NavigationListItem({
                                text: '{AppConfig>title}',
                                icon: '{AppConfig>icon}',
                                enabled: '{AppConfig>enabled}',
                                expanded: '{AppConfig>expanded}',
                                key: '{AppConfig>key}',
                                href: '{AppConfig>href}',
                                visible: '{AppConfig>visible}',
                                items: {
                                    template: new sap.tnt.NavigationListItem({
                                        text: '{AppConfig>title}',
                                        key: '{AppConfig>key}',
                                        href: '{AppConfig>href}',
                                        enabled: '{AppConfig>enabled}'
                                    }),
                                    path: 'AppConfig>items',
                                    templateShareable: true
                                }
                            }),

                            path: 'AppConfig>/navigation'
                        }
                    }),
                    fixedItem: (this.config.getData().fixedNavigation) ? new sap.tnt.NavigationList({
                        items: {
                            template: new sap.tnt.NavigationListItem({
                                text: '{AppConfig>title}',
                                icon: '{AppConfig>icon}',
                                key: '{AppConfig>key}',
                                href: '{AppConfig>href}',
                                target: '{AppConfig>target}'
                            }),
                            path: 'AppConfig>/fixedNavigation'
                        }
                    }) : null
                }).setModel(sap.ui.getCore().getModel("AppConfig"), "AppConfig");

            //model.refresh();
        },
        /*************************************************************************
         *onItemSelectMenu.
         * @private
         * 
         *************************************************************************/
        onItemSelectMenu: function (oEvent) {

            // obtem objeto para identificar qual menú foi selecionado pelo usuário
            var item = oEvent.getParameter('item');

            This.addMainContent(item.mProperties.key);

        },

        addMainContent: function (component) {
            // remove conteúdo para ser setado posteriormente
            screenParts.removeAllMainContents();

            // verifica se o conteúdo já foi criado
            if (!Contents[component]) {

                if (!Screen) {
                    // gera o criador das telas
                    Screen = new ScreenFactory(this);
                }

                //seta nova tela e respectiva chave
                Contents[component] = Screen.create({
                    name: component
                })

            }

            sap.ui.getCore().setModel(
                new sap.ui.model.json.JSONModel({
                    root: component
                }), "rootComponent");

            // adiciona tela para ser exibida na área principal
            screenParts.addMainContent(Contents[component]);

            return;
            // ponto ideal para setar falhas de comunicação com componentes
            setTimeout(function () {
                if (Contents[component].getId() !== component)
                    Contents[component] = new sap.m.MessagePage(
                        {
                            showHeader: false,
                            text: "Não disponível",
                            showNavButton: true,
                            busyIndicatorDelay: 50,
                            busy: false,
                            enableFormattedText: true,
                            //description: desc || "Welcome DEV",
                            icon: "sap-icon://lateness"
                        });
            }, 3000);
        },
        navTo(screen) {

            screenParts.removeAllMainContents();

            screenParts.addMainContent(screen);

        },
        /*************************************************************************
         *_getTabContainer.
         * @private
         * 
         *************************************************************************/
        _getTabContainer: function (param) {

            return TabContainer;
        },
        /*************************************************************************
         *getContent.
         * @private
         * 
         *************************************************************************/
        getContent: function (that) {
            return this._getScreenParts(that);
        },
        /*************************************************************************
         *_setTabContainer.
         * @private
         * 
         *************************************************************************/
        _setTabContainer: function (param) {

            TabContainer = new sap.m.TabContainer({
                // itemSelect: fnOnItemSelected,
                itemClose: this.itemCloseHandler
                //addNewButtonPress:
            }).addStyleClass("sapUiResponsivePadding--header");

        },

        setToolBarParts(parts) {
            screenParts.setHeader(new sap.tnt.ToolHeader({
                content: parts
            }));
            return this;
        },

        setAvatar(avatar) {
            this.avatar = avatar;
            return this;
        },
        /*************************************************************************
         *_getToolHeader
         * @private
         * 
         *************************************************************************/
        _getToolHeader: function () {
            return this.toolHeader;
        },
        /*************************************************************************
         *_setTabContainer.
         * @private
         * 
         *************************************************************************/
        _setToolHeader: function () {

            this.toolHeader = this.getToolHeader();

        },
        userInfo: function (mandts) {

            const links = [];

            const mdt = sap.ui.getCore().getModel("userInfo").getData().currentMandt

            if (mandts && mandts.length > 0) {

                mandts.forEach((mandt) => {
                    if (mdt !== mandt)
                        links.push(new sap.m.QuickViewGroupElement({
                            label: "Outros clientes",
                            value: mandt,
                            url: "/?m=" + mandt,
                            type: sap.m.QuickViewGroupElementType.link
                        }))
                })
            }

            links.push(new sap.m.QuickViewGroupElement({
                // label: "Website",
                value: "Sair",
                url: "/logout",
                type: sap.m.QuickViewGroupElementType.link
            }))

            const usr = sap.ui.getCore().getModel("userInfo").getData().content.preferred_username;
            const name = sap.ui.getCore().getModel("userInfo").getData().content.name;

            return new sap.m.Button({
                text: sap.ui.getCore().getModel("userInfo").getData().content.email,
                icon: 'sap-icon://employee',
                //type: sap.m.ButtonType.Transparent,
                press: function () {
                    var userInfo = new sap.m.QuickView({
                        placement: sap.m.PlacementType.VerticalPreferedBottom,
                        pages: [
                            new sap.m.QuickViewPage({
                                header: 'Cliente:  ' + mdt,
                                title: name,
                                description: usr,
                                //titleUrl: "https://www.sap.com",
                                avatar: new sap.m.Avatar({
                                    initials: usr,
                                    src: "sap-icon://account",
                                    displayShape: "Square",
                                    detailBox: new sap.m.LightBox({
                                        imageContent: new sap.m.LightBoxItem({
                                            imageSrc: "https://addvisor.com.br/wp-content/uploads/2018/08/addvisor-logo-claro.png",
                                            title: name
                                        })
                                    })
                                }),
                                groups: [
                                    new sap.m.QuickViewGroup({
                                        //heading: "Store details",
                                        elements: links
                                    })
                                ]
                            })
                        ]
                    });

                    userInfo.openBy(this);

                    That.getView().addContent(userInfo);

                }
            })
        },
        getToolHeader() {
            let parts = [];

            if (!this.ToolHeader)
                parts = [
                    (this.setSideNavigation || this.setSideNavigation === undefined) ? new sap.m.Button({
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
                    }) : null,
                    new sap.m.ToolbarSpacer(),

                    //new sap.m.Image({ src: '../../favicon.png' }),
                    new sap.m.FormattedText({ htmlText: '<h3>' + sap.ui.getCore().getModel("AppConfig").getData().app.title + '</h3>', tooltip: sap.ui.getCore().getModel("AppConfig").getData().app.tooltip }),
                    new sap.m.ToolbarSpacer(), this.userInfo(That.mandts), this.notification || null
                    //new sap.m.Avatar({ displaySize: sap.m.AvatarSize.Custom })
                ]

            return this.ToolHeader || new sap.tnt.ToolHeader({
                content: parts
            });

        },
        /*************************************************************************
         *_setTabContainer.
         * @private
         * 
         *************************************************************************/
        itemCloseHandler: function (oEvent) {

            oEvent.preventDefault();
            var oItemToClose = oEvent.getParameter('item');

            MessageBox.confirm(AddModels.getI18n("CloseConfirme") + oItemToClose.getName() + "'?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {

                        Tabs.find((e) => {

                            if (e.name == oItemToClose.mProperties.name) {

                                try {
                                    Screen.close({ key: e.key })
                                        .then(result => {
                                            if (MessageBox.Action.OK == result) {

                                                MessageToast.show(AddModels.getI18n("Closed") + oItemToClose.getName(), { duration: 1500 });

                                                __removeTab(oItemToClose, e);
                                            }
                                        })

                                } catch (error) {

                                    __removeTab(oItemToClose, e);

                                    MessageToast.show(AddModels.getI18n("noImplemented") + oItemToClose.getName(), { duration: 2500 });
                                }
                            }
                        });

                    } else {
                        MessageToast.show(AddModels.getI18n("Canceled") + oItemToClose.getName(), { duration: 1500 });
                    }
                }


            });

            function __removeTab(oItemToClose, e) {

                /*************************************************************************                                                
                * Destroy Component
                **************************************************************************/

                TabContainer.removeItem(oItemToClose);

                Menu.MainTabItens.find((tab) => {
                    if (tab.name == e.name) tab.content.destroy();
                })

                Menu.MainTabItens = Menu.MainTabItens.filter(item => !(item.name == e.name));
                Tabs = Tabs.filter(item => !(item.name == oItemToClose.mProperties.name));
            }
        }

    });
});