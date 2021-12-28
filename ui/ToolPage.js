
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
    var Screen;
    var Menu = [];
    var TabContainer;
    var Tabs = [];
    var Contents = [];
    var screenParts = undefined;

    return Object.extend("add.ui.ToolPage", {

        AddModels: AddModels,

        navToCompany: function (Company) {


            if (!this.CompanyView) {


                this.CompanyView = new add.usrm.Company(Company, () => this.mainsContent.back());
                this.mainsContent.addPage(this.CompanyView);
            } else {

                this.CompanyView.getHeaderTitle().setObjectTitle(Company.header)
                this.CompanyView.getHeaderTitle().setObjectSubtitle(Company.subheader)
                this.CompanyView.getHeaderTitle().setObjectImageURI(Company.imageURI)

            }

            this.mainsContent.to(this.CompanyView);
        },
        navToProduct: function (Product) {

            if (!this.ProductView) {


                this.ProductView = new add.usrm.Product(Product, () => this.mainsContent.back());
                this.mainsContent.addPage(this.ProductView);
            } else {


                this.ProductView.getHeaderTitle().setObjectTitle(Product.header)
                this.ProductView.getHeaderTitle().setObjectSubtitle(Product.subheader)
                this.ProductView.getHeaderTitle().setObjectImageURI(Product.imageURI)
            }


            this.mainsContent.to(this.ProductView);
        },

        onNavBack: function (oEvent) {
            this.getParent().back();
        },
        constructor: function (that, idapp) {

            That = that;
            this.that = that;
            this.callService = that.callService;
            this.AddModels.constructor(that, idapp);
            this.prefixID = idapp;
            this.sideNavigation = {};
            this.toolHeader = {};
            this.prefixID = null;
            this.IDAPP = idapp;

            That.loadingConnfig(this.IDAPP);

            Screen = new ScreenFactory(this);

            this.config = sap.ui.getCore().getModel("AppConfig");

            try {
                this.component =
                    this.config.getData().navigation[0].key;
            } catch {
            }

            if (!this.component) this.component = this.IDAPP;

            Contents[this.component] = new ScreenFactory(That).create({
                name: this.component
            })

            this.mainsContent = {};

            this.mainsContent = new sap.m.NavContainer({
                pages: [Contents[this.component]],
                initialPage: Contents[this.component]
            });

            if (this.component !== this.IDAPP) {

                this._setLoadConfig(idapp);
                this._setTabContainer();
                this._setToolHeader();
                this._setScreenParts();

                sap.ui.core.BusyIndicator.hide();
            }

            //return this.mainsContent;

        },
        /*************************************************************************
         *_setMainMenu.
         * @private
         * 
         *************************************************************************/
        _setLoadConfig: async function (idapp) {

            this.setSideNavigation();

        },
        /*************************************************************************
         *_getScreenParts.
         * @private
         * 
         *************************************************************************/
        _getScreenParts(that) {

            return screenParts || new sap.m.MessagePage(
                {
                    title: '{i18n>error}',
                    text: '{i18n>serverNotFound}',
                    enableFormattedText: false,
                    showHeader: true,
                    description: '{I18N>connectionError}',
                    icon: "sap-icon://message-error"
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
            return this.sideNavigation;
        },
        /*************************************************************************
         *setSideNavigation.
         * @private
         * 
         *************************************************************************/
        setSideNavigation: function (model) {

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


            oEvent.getSource()
                .getParent()
                .getParent()
                .getController()
                .Ui.addMainContent(item.mProperties.key);

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
        _setToolHeader: function (param) {

            this.toolHeader = That.getToolHeader();

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