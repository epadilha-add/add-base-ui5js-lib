sap.ui.define(["./commons/callService"], function (callService) {
  "use strict";

  return {

    factory: function () {

      return this;
      return axios.create({
        baseURL: "http://localhost:5000/api/"
      });
    },

    call: async function (actionName, params, opts) {
      let token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ2TkFlVjlpSDZHVngtMHI4SWFBc1h6N3JwRkloRmVjTTg2RURfSlZzdUd3In0.eyJleHAiOjE2MzQwMDkxNTgsImlhdCI6MTYzMzk3MzE1OCwianRpIjoiYjI2YTMzYzctNzhhNC00Y2U2LTk4MmMtZjE0NGU4NmJkYjQ4IiwiaXNzIjoiaHR0cHM6Ly9hZGQtaWRlbnRpdHkuY2ZhcHBzLnVzMTAuaGFuYS5vbmRlbWFuZC5jb20vYXV0aC9yZWFsbXMvQUREVEFYIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6ImRhNWMzMDZkLTI4ZjMtNDk1NS05NTYwLWNmZDU1ODdhNmMxMSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImFkZHRheC1icm93c2VyIiwic2Vzc2lvbl9zdGF0ZSI6IjI3ZGNkOTAyLTA3NDMtNDNmNC04MjhiLWU1YzBjMjE1ZDY2NyIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1hZGR0YXgiLCJvZmZsaW5lX2FjY2VzcyIsImFkZC1jcm0tYWRtaW4iLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoiZW1haWwgcHJvZmlsZSIsInNpZCI6IjI3ZGNkOTAyLTA3NDMtNDNmNC04MjhiLWU1YzBjMjE1ZDY2NyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJtYW5kdCI6ImFkZHRheC1jcm0tYWRtaW4iLCJuYW1lIjoiQWRkdGF4IENSTSIsInByZWZlcnJlZF91c2VybmFtZSI6ImFkZHRheC5jcm0iLCJnaXZlbl9uYW1lIjoiQWRkdGF4IiwiZmFtaWx5X25hbWUiOiJDUk0ifQ.T0ED-UmhvHsQIPUrtOf2SwYb9gtVwLR20gexfiiPJGUj5rez2501IXHHGnX1uPsah6tAlsFfrIP573VBQHOo3JW-VDknS968H58PP7kIgD5Xw6JATyhig14AoJN26dyZGWrNXRlsfVCXSZZMTVbC0S0z0TbcpgTSpFXTjrabm8hNqJ_nYyfL_uQfMtZakOoYTSGE-LFt0dHR8hSCduLTZQPYzdq5oZr19Ptzj39RCpHIcsT32uSvKNnknaBo9eqVcxQ3vi532V0RtgRs7szNkr2ntS4ZB5KzkSKAej7c_ERlFBiyCaPz-LFdWhbzu2vXu1TYSaJuLibXzqQpygjbOQ";
      token = `Bearer ${token}`;


      return await fetch("http://localhost:5000/api/call", {
        mode: 'cors',
        method: 'POST',
        headers: {
          "accept": "*/*",
          "content-type": "application/json"
        },
        body: { "actionName": "usrm0200.list" }
      }).then((response) => {
        return response.text();
      }).then((data) => {
        return data;
      }).catch((err) => {
        return JSON.stringify(err);
      });


      //callService.setHeaders(header);
      //callService.setMethod("POST");


      return await callService.postSync("call", actionName, null, null, null, null, "http://localhost:5000/api");

      return this.http.post("call", { actionName, params, opts })
        .then(response => response)
        .catch(error => error.response);
    }
  }

});