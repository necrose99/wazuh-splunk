/*
 * Wazuh app - Overview agent summary controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
require([
  "jquery",
  "splunkjs/mvc/layoutview",
  "/static/app/SplunkAppForWazuh/js/directives/agentsTable.js",
  "/static/app/SplunkAppForWazuh/js/services/credentialService.js",
  "/static/app/SplunkAppForWazuh/js/services/apiService.js",
  "/static/app/SplunkAppForWazuh/js/directives/toaster.js",
  "/static/app/SplunkAppForWazuh/js/directives/selectedCredentialsDirective.js",
  'splunkjs/mvc',
  "splunkjs/mvc/searchmanager",
  "splunkjs/mvc/simplexml/element/table",
  "splunkjs/mvc/utils",
  "splunkjs/mvc/tokenutils",
  "splunkjs/mvc/simplexml",
  "splunkjs/mvc/simplexml/eventhandler",
  "splunkjs/mvc/simplexml/searcheventhandler"
],
  function (
    $,
    LayoutView,
    agentsTable,
    CredentialService,
    ApiService,
    Toast,
    SelectedCredentials,
    mvc,
    SearchManager,
    TableElement,
    utils,
    TokenUtils,
    DashboardController,
    EventHandler,
    SearchEventHandler
  ) {

    CredentialService.checkSelectedApiConnection().then(({ api, selectedIndex }) => {

      let nameFilter = ""
      if (api.filter[0] && typeof api.filter[0] === "string" && api.filter[1] && typeof api.filter[1] === "string") {
        nameFilter = api.filter[0] + '=' + api.filter[1]
      }
      const submittedTokenModel = mvc.Components.getInstance('submitted', { create: true })

      const customErrorToast = (msg) => {
        return new Toast('error', 'toast-bottom-right', msg, 1000, 250, 250)
      }

      /**
       * Initializes agent table and data from API
       */
      const initializeData = async () => {
        try {
          // Listen for a change to the token tokHTML value
          const searchTopAgent = new SearchManager({
            "id": "searchTopAgent",
            "cancelOnUnload": true,
            "sample_ratio": 1,
            "earliest_time": "$when.earliest$",
            "status_buckets": 0,
            "search": "index=" + selectedIndex + " " + nameFilter + "| top agent.name",
            "latest_time": "$when.latest$",
            "app": utils.getCurrentApp(),
            "auto_cancel": 90,
            "preview": true,
            "tokenDependencies": {
            },
            "runWhenTimeIsUndefined": true
          }, { tokens: true, tokenNamespace: "submitted" })

          new SearchEventHandler({
            managerid: "searchTopAgent",
            event: "done",
            conditions: [
              {
                attr: "any",
                value: "*",
                actions: [
                  { "type": "set", "token": "tokHTML", "value": "$result.agent.name$" },
                ]
              }
            ]
          })

          submittedTokenModel.on("change:tokHTML", function (model, tokHTML, options) {
            const tokHTMLJS = submittedTokenModel.get("tokHTML");
            if (tokHTMLJS !== undefined) {
              const url = `${ApiService.getBaseUrl()}/app/SplunkAppForWazuh/search?q=index=${selectedIndex}%20${nameFilter}%20sourcetype=wazuh%20user.name=${tokHTMLJS}`
              $("#higherActivity").html(`<a href=${url}>${tokHTMLJS}</a>`)
            }
          })
          const tokHTMLJS = submittedTokenModel.get("tokHTML")
          if ($("#higherActivity").text() === "$result.agent.name$") {
            $("#higherActivity").text('-');
          }
          const start = new Date()
          const data = await Promise.all([
            ApiService.get('/agents/summary?ip=' + api.url + '&port=' + api.portapi + '&pass=' + api.passapi + '&user=' + api.userapi),
            ApiService.get('/agents/agents?ip=' + api.url + '&port=' + api.portapi + '&pass=' + api.passapi + '&user=' + api.userapi),
            ApiService.get('/agents/agents_uniq?ip=' + api.url + '&port=' + api.portapi + '&pass=' + api.passapi + '&user=' + api.userapi)
          ])
          const end = new Date()

          $('#activeUsers').text(data[0][0].agent_summary_active)
          $('#neverConnected').text(data[0][0].agent_summary_neverconnected)
          $('#disconnectedUsers').text(data[0][0].agent_summary_disconnected)
          $('#agentsCoverage').text(Math.round((data[0][0].agent_summary_active / data[0][0].agent_summary_total * 100)))
          $('#lastRegisteredAgent').text((data[1].data.items[0].name))

          SelectedCredentials.render($('#selectedCredentials'), api.filter[1])

          let table = new agentsTable($('#row1'), api)
          table.build()

          // Building operating system filter
          const rawPlatforms = data[2].data.items.map(one => one.os)
          const cleanUndefinedPlatforms = rawPlatforms.filter(one => typeof one !== 'undefined')
          const platforms = ['All',...new Set(cleanUndefinedPlatforms.map(one => one.platform))]

          // Building version filter
          const rawVersions = data[2].data.items.map(one => one.version);
          const versions = ['All',... new Set(rawVersions.filter(one => typeof one !== 'undefined'))]

          table.setFilterInputMaxWidth('Search agents', 50, 'left')
          table.generateDropdownFilter(['All', 'Active', 'Disconnected', 'Never Connected'], 16, 'right', 3)
          table.generateDropdownFilter(platforms, 16, 'right', 4)
          table.generateDropdownFilter(versions, 16, 'right', 5)

        } catch (err) {
          customErrorToast(err).show()
        }
      }

      /**
       * On document ready load agent table
       */
      $(document).ready(() => initializeData())

      new LayoutView({ "hideFooter": false, "hideChrome": false, "hideSplunkBar": false, "hideAppBar": false })
        .render()
        .getContainerElement()
        .appendChild($('.dashboard-body')[0])
    }).catch((err) => {
      window.location.href = '/en-US/app/SplunkAppForWazuh/settings'
    })
  }
)