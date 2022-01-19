sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("add.tax.home.app.BaseController", {

        loadingConnfig: function (idapp) {
            // Log.info("//TODO Definição temporária para obtenção do host");
            /**
             * definição temporária pois a escolha do host deverá ser feita no AS da plataforma,
             * portanto, as requisições serão 100% para o host principal da aplicação (window.location.origin)
             * e com base nas configurações do App managemant ou Cliente AddTax a requisição deverá redirecionar ao
             * servidor remoto previamente configurado 
             * Everton: 17/04/2021
             */
            let oModel = new JSONModel();
            oModel.loadData("add/tax/config/" + idapp, null, false);
            sap.ui.getCore().setModel(oModel, "AppConfig");

        }

    })
});