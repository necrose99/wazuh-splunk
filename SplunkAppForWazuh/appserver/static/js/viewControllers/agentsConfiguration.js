/*
 * Wazuh app - Configuration view controller
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
  "/static/app/SplunkAppForWazuh/js/services/credentialService.js",
  "/static/app/SplunkAppForWazuh/js/services/apiService.js",
  "/static/app/SplunkAppForWazuh/js/directives/toaster.js",
  "/static/app/SplunkAppForWazuh/js/services/promisedReq.js",
  "/static/app/SplunkAppForWazuh/js/directives/selectedCredentialsDirective.js"

],
  function (
    $,
    LayoutView,
    CredentialService,
    ApiService,
    Toast,
    promisedReq,
    SelectedCredentials

  ) {

    CredentialService.checkSelectedApiConnection().then(({ api }) => {
      SelectedCredentials.render($('#selectedCredentials'), api.filter[1])
      const errorConnectionToast = new Toast('error', 'toast-bottom-right', 'Error when loading data', 1000, 250, 250)
      const errorChangeAgent = new Toast('error', 'toast-bottom-right', 'Error when change agent', 1000, 250, 250)
      const handleError = err => errorConnectionToast.show()
      const noConfigHtml =
        `<p>This agent belongs to a group where actually there's no configuration.</p></br>` +
        `<p>Use the following link to learn about the centralized configuration process and how to set it up:</p></br>` +
        `<a href=https://documentation.wazuh.com/current/user-manual/reference/centralized-configuration.html>https://documentation.wazuh.com/current/user-manual/reference/centralized-configuration.html</a>`

      const noAgents = '<p>There are no registered agents.</p>'

      /**
       * Render File Integrity data with object received
       * @param {Object} data 
       */
      const fileIntegrityContent = async (data) => {
        try {
          const globalUrl = "/static/app/SplunkAppForWazuh/views/agentConfigurationViews/fileIntegrity.html"
          await promisedReq.promisedLoad($('#dynamicContent'), globalUrl)
          $('#fileIntegrityDisabledView').text(data.disabled)
          $('#fileIntegrityFrequencyView').text(data.frequency)
          $('#fileIntegrityAlertNewFiles').text(data.alert_new_files)
          $('#fileIntegritySkipNFS').text(data.skip_nfs)
          $('#fileIntegrityScanOnStart').text(data.scan_on_start)
          $('#fileIntegrityScanTime').text(data.scan_time)
          $('#fileIntegrityAutoIgnore').text(data.auto_ignore)
          // $('#fileIntegrityNoDiff').text(data.nodiff)
          for (const element of data.nodiff) {
            const item = typeof element !== 'object' ? element : element.item
            $('#fileIntegrityNoDiff').append(
              `<hr>` +
              `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
              `<p class='wz-flex-item-30'>File</p>` +
              `<p>` +
              `${item}` +
              `</p>` +
              `</div>`
            )
          }
          for (const path of data.directories) {
            $('#fileIntegrityMonitoredFiles').append(
              `<hr>` +
              `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
              `<p class='wz-flex-item-30'>Path</p>` +
              `<p>` +
              `${path.path}` +
              `</p>` +
              `</div>` +
              `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
              `<p class='wz-flex-item-30'>Check all</p>` +
              `<p>` +
              `${path.check_all}` +
              `</p>` +
              `</div>`
            )
          }
          for (const ignore of data.ignore) {
            const element = typeof ignore !== 'object' ? ignore : ignore.item
            $('#fileIntegrityIgnoredFiles').append(
              `<hr>` +
              `<div  class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
              `<p class="wz-flex-item-30">File</p>` +
              `<p >` +
              `${element}` +
              `</p>` +
              `</div>`
            )
          }
        } catch (err) {
          return Promise.reject(err)
        }
      }

      /**
       * Render Policy Monitoring data with object received
       * @param {Object} data 
       */
      const policyMonitoring = async (data) => {
        try {
          const globalUrl = "/static/app/SplunkAppForWazuh/views/agentConfigurationViews/policyMonitoring.html"
          await promisedReq.promisedLoad($('#dynamicContent'), globalUrl)

          $('#policyMonitoringDisabledView').text(data.disabled)
          $('#policyMonitoringBaseDirectoryView').text(data.base_directory)
          $('#policyMonitoringFrequencyView').text(data.frequency)
          $('#policyMonitoringSkipNFS').text(data.skip_nfs)
          $('#policyMonitoringScanAllFiles').text(data.scanall)
          $('#policyMonitoringChecksIf').text(data.check_if)
          $('#policyMonitoringChecksPid').text(data.check_pids)
          $('#policyMonitoringChecksFiles').text(data.check_files)
          $('#policyMonitoringChecksDev').text(data.check_dev)
          $('#policyMonitoringChecksPorts').text(data.check_ports)
          $('#policyMonitoringChecksSys').text(data.check_sys)
          $('#policyMonitoringChecksTrojans').text(data.check_trojans)
          $('#policyMonitoringChecksUnixAudit').text(data.check_unixaudit)
          $('#policyMonitoringChecksWinApps').text(data.check_winapps)

          for (let i = 0; i < data.windows_audit.length; i++) {
            const item = data.windows_audit[i] !== 'object' ? data.windows_audit[i] : data.windows_audit[i].item
            $('#policyMonitoringWinAuditFiles').append(
              '<hr>' +
              '<div  class="wz-margin-left-10 wz-flex-container wz-flex-row">' +
              '<p class="wz-flex-item-30">File</p>' +
              '<p >' +
              item +
              '</p>' +
              '</div>'
            )
          }

          for (let i = 0; i < data.windows_apps.length; i++) {
            const item = data.windows_apps[i] !== 'object' ? data.windows_apps[i] : data.windows_apps[i].item
            $('#policyMonitoringWinAppsFiles').append(
              '<hr>' +
              '<div  class="wz-margin-left-10 wz-flex-container wz-flex-row">' +
              '<p class="wz-flex-item-30">File</p>' +
              '<p >' +
              item +
              '</p>' +
              '</div>'
            )
          }

          for (let i = 0; i < data.windows_malware.length; i++) {
            const item = data.windows_malware[i] !== 'object' ? data.windows_malware[i] : data.windows_malware[i].item
            $('#policyMonitoringWinMalwareFiles').append(
              '<hr>' +
              '<div  class="wz-margin-left-10 wz-flex-container wz-flex-row">' +
              '<p class="wz-flex-item-30">File</p>' +
              '<p >' +
              item +
              '</p>' +
              '</div>'
            )
          }

          for (let i = 0; i < data.rootkit_files.length; i++) {
            const item = data.rootkit_files[i] !== 'object' ? data.rootkit_files[i] : data.rootkit_files[i].item
            $('#policyMonitoringRootkitFiles').append(
              '<hr>' +
              '<div  class="wz-margin-left-10 wz-flex-container wz-flex-row">' +
              '<p class="wz-flex-item-30">Files</p>' +
              '<p >' +
              item +
              '</p>' +
              '</div>'
            )
          }

          for (let i = 0; i < data.rootkit_trojans.length; i++) {
            const item = data.rootkit_trojans[i] !== 'object' ? data.rootkit_trojans[i] : data.rootkit_trojans[i].item
            $('#policyMonitoringRootkitTrojans').append(
              '<hr>' +
              '<div  class="wz-margin-left-10 wz-flex-container wz-flex-row">' +
              '<p class="wz-flex-item-30">Trojans</p>' +
              '<p >' +
              item +
              '</p>' +
              '</div>'
            )
          }
        } catch (err) {
          return Promise.reject(err)
        }
      }

      /**
       * Render Syscollector data with object received
       * @param {Object} data 
       */
      const sysCollector = async (data) => {
        try {
          const globalUrl = "/static/app/SplunkAppForWazuh/views/agentConfigurationViews/syscollector.html"
          await promisedReq.promisedLoad($('#dynamicContent'), globalUrl)
          $('#syscollectorDisabledView').text(data.disabled)
          $('#syscollectorHardwareView').text(data.hardware)
          $('#syscollectorIntervalView').text(data.interval)
          $('#syscollectorOSView').text(data.os)
          $('#syscollectorPackagesView').text(data.packages)
          $('#syscollectorScanOnStartView').text(data.scan_on_start)
        } catch (err) {
          return Promise.reject(err)
        }
      }

      /**
       * Render OpenSCAP data with object received
       * @param {Object} data 
       */
      const openSCAP = async (data) => {
        try {
          const globalUrl = "/static/app/SplunkAppForWazuh/views/agentConfigurationViews/openSCAP.html"
          await promisedReq.promisedLoad($('#dynamicContent'), globalUrl)
          $('#openscapDisabledView').text(data.disabled)
          $('#openscapIntervalView').text(data.interval)
          $('#openscapTimeoutView').text(data.timeout)
          $('#openscapScanOnStartView').text(data['scan-on-start'])
        } catch (err) {
          return Promise.reject(err)
        }
      }

      /**
       * Render CIS-CAT data with object received
       * @param {Object} data 
       */
      const cisCat = async (data) => {
        try {
          const globalUrl = "/static/app/SplunkAppForWazuh/views/agentConfigurationViews/ciscat.html"
          await promisedReq.promisedLoad($('#dynamicContent'), globalUrl)
          $('#ciscatPathView').text(data.ciscat_path)
          $('#ciscatDisabledView').text(data.disabled)
          $('#ciscatIntervalView').text(data.interval)
          $('#ciscatTimeoutView').text(data.timeout)
          $('#ciscatScanOnStartView').text(data['scan-on-start'])
          $('#ciscatJavaPathView').text(data['java_path'])
        } catch (err) {
          return Promise.reject(err)
        }
      }

      /**
       * Render Log collection data with object received
       * @param {Array} files 
       */
      const logCollection = async (files) => {
        try {
          const globalUrl = "/static/app/SplunkAppForWazuh/views/agentConfigurationViews/logCollection.html"
          await promisedReq.promisedLoad($('#dynamicContent'), globalUrl)
          for (const item of files) {
            $('#logCollectionFiles').append(
              `<hr>`
            )
            if (item["log_format"])
              $(`#logCollectionFiles`).append(
                `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
                `<p class='wz-flex-item-30'>Log format</p>` +
                `<p>${item['log_format']}</p>` +
                `</div>`
              )
            if (item.location)
              $('#logCollectionFiles').append(
                `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
                `<p class='wz-flex-item-30'>Location</p>` +
                `<p>${item.location}</p>` +
                `</div>`
              )
            if (item.query)
              $('#logCollectionFiles').append(
                `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
                `<p class='wz-flex-item-30'>Query</p>` +
                `<p>${item.query}</p>` +
                `</div>`
              )
            if (item.frequency)
              $('#logCollectionFiles').append(
                `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
                `<p class='wz-flex-item-30'>Frecuency</p>` +
                `<p>${item.frequency}</p>` +
                `</div>`
              )
            if (item.command)
              $('#logCollectionFiles').append(
                `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
                `<p class='wz-flex-item-30'>Command</p>` +
                `<p>${item.command}</p>` +
                `</div>`
              )
            if (item.alias)
              $('#logCollectionFiles').append(
                `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
                `<p class='wz-flex-item-30'>Alias</p>` +
                `<p>${item.alias}</p>` +
                `</div>`
              )
            if (item['only-future-events'])
              $('#logCollectionFiles').append(
                `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
                `<p class='wz-flex-item-30'>Only future events</p>` +
                `<p>${item['only-future-events']}</p>` +
                `</div>`
              )
          }
        } catch (err) {
          return Promise.reject(err)
        }
      }

      /**
       * Render Remote commands data with object received
       * @param {Array} files 
       */
      const remoteCommands = async (files) => {
        try {
          const globalUrl = '/static/app/SplunkAppForWazuh/views/agentConfigurationViews/remoteCommand.html'
          await promisedReq.promisedLoad($('#dynamicContent'), globalUrl)

          for (const item of files) {
            $('#remoteCommands').append(
              `<hr>`
            )
            if (item["command"])
              $('#remoteCommands').append(
                `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
                `<p class='wz-flex-item-30'>Command</p>` +
                `<p>${item.command}</p>` +
                `</div>`
              )
            if (item.disabled)
              $('#remoteCommands').append(
                `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
                `<p class='wz-flex-item-30'>Disabled</p>` +
                `<p>${item.disabled}</p>` +
                `</div>`
              )
            if (item['ignore_output'])
              $('#remoteCommands').append(
                `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
                `<p class='wz-flex-item-30'>Ignore output</p>` +
                `<p>${item['ignore_output']}</p>` +
                `</div>`
              )
            if (item.interval)
              $('#remoteCommands').append(
                `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
                `<p class='wz-flex-item-30'>Interval</p>` +
                `<p>${item.interval}</p>` +
                `</div>`
              )
            if (item['run_on_start'])
              $('#remoteCommands').append(
                `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
                `<p class='wz-flex-item-30'>Run on start</p>` +
                `<p>${item['run_on_start']}</p>` +
                `</div>`
              )
            if (item.tag)
              $('#remoteCommands').append(
                `<div class="wz-margin-left-10 wz-flex-container wz-flex-row">` +
                `<p class='wz-flex-item-30'>Tag</p>` +
                `<p>${item.tag}</p>` +
                `</div>`
              )
          }
        } catch (err) {
          return Promise.reject(err)
        }
      }

      const initializeData = async data => {
        try {
          // If there is syscheck data then render
          if (data.syscheck) {
            $('#ifSyscheck').parent().addClass('wz-dashboard-cell wz-dashboard-panel-table wz-margin-bottom-10')
            $('#ifSyscheck').html(
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              ` <h3 id="fileIntegrity" class="wz-headline-title wz-text-link">File Integrity</h3>` +
              `</div>` +
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              `<p class='wz-flex-item-30'>Disabled</p>` +
              `<p>${data.syscheck.disabled}</p>` +
              `</div>` +
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              `<p class='wz-flex-item-30'>Frequency</p>` +
              `<p>${data.syscheck.frequency}</p>` +
              `</div>` +
              `</div>`
            )

            // If click on Syscheck section
            // await fileIntegrityContent(data.syscheck)

            $('#fileIntegrity').click(() => fileIntegrityContent(data.syscheck).catch(handleError))
          }

          // If there is rootcheck data then render it
          if (data.rootcheck) {
            $('#ifRootcheck').parent().addClass('wz-dashboard-cell wz-dashboard-panel-table wz-margin-bottom-10')
            $('#ifRootcheck').html(
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              ` <h3 id="policyMonitoring" class="wz-headline-title wz-text-link">Policy Monitoring</h3>` +
              `</div>` +
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              `<p class='wz-flex-item-30'>Disabled</p>` +
              `<p>${data.rootcheck.disabled}</p>` +
              `</div>` +
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              `<p class='wz-flex-item-30'>Base directory</p>` +
              `<p>${data.rootcheck.base_directory}</p>` +
              `</div>` +
              `</div>`
            )

            // Click on Policy Monitoring
            $('#policyMonitoring').click(() => policyMonitoring(data.rootcheck).catch(handleError))
          }

          if (data.syscollector) {
            $('#ifSyscollector').parent().addClass('wz-dashboard-cell wz-dashboard-panel-table wz-margin-bottom-10')
            $('#ifSyscollector').html(
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              ` <h3 id="syscollector" class="wz-headline-title wz-text-link">Syscollector</h3>` +
              `</div>` +
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              `<p class='wz-flex-item-30'>Disabled</p>` +
              `<p>${data.syscollector.disabled}</p>` +
              `</div>` +
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              `<p class='wz-flex-item-30'>Scan on start</p>` +
              `<p>${data.syscollector.scan_on_start}</p>` +
              `</div>` +
              `</div>`
            )
            // $('#syscollectorDisabled').text(data.syscollector.disabled)
            // $('#syscollectorScan').text(data.syscollector.scan_on_start)

            // Click on Syscollector
            $('#syscollector').click(() => sysCollector(data.syscollector).catch(handleError))
          }

          if (data['open-scap']) {
            $('#ifOpenScap').parent().addClass('wz-dashboard-cell wz-dashboard-panel-table wz-margin-bottom-10')
            $('#ifOpenScap').html(
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              ` <h3 id="openscap" class="wz-headline-title wz-text-link">OpenSCAP</h3>` +
              `</div>` +
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              `<p class='wz-flex-item-30'>Disabled</p>` +
              `<p>${data['open-scap'].disabled}</p>` +
              `</div>` +
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              `<p class='wz-flex-item-30'>Interval</p>` +
              `<p>${data['open-scap'].interval}</p>` +
              `</div>` +
              `</div>`
            )
            // $('#openscapDisabled').text(data['open-scap'].disabled)
            // $('#openscapInterval').text(data['open-scap'].interval)
            // Click on Syscollector
            $('#openscap').click(() => openSCAP(data['open-scap']).catch(handleError))
          }

          if (data['cis-cat']) {
            $('#ifCisCat').parent().addClass('wz-dashboard-cell wz-dashboard-panel-table wz-margin-bottom-10')
            $('#ifCisCat').html(
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              ` <h3 id="ciscat" class="wz-headline-title wz-text-link">CIS-CAT</h3>` +
              `</div>` +
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              `<p class='wz-flex-item-30'>Disabled</p>` +
              `<p>${data['cis-cat'].disabled}</p>` +
              `</div>` +
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              `<p class='wz-flex-item-30'>Interval</p>` +
              `<p>${data['cis-cat'].interval}</p>` +
              `</div>` +
              `</div>`
            )

            // $('#ciscatDisabled').text(data['cis-cat'].disabled)
            // $('#ciscatInterval').text(data['cis-cat'].interval)

            // Click on cis-cat
            $('#ciscat').click(() => cisCat(data['cis-cat']).catch(handleError))

          }

          if (data.localfile) {
            $('#ifLog').parent().addClass('wz-dashboard-cell wz-dashboard-panel-table wz-margin-bottom-10')
            $('#ifLog').html(
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              ` <h3 id="logcollection" class="wz-headline-title wz-text-link">Log Collection</h3>` +
              `</div>` +
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              `<p>Visualize all Log Collection settings</p>` +
              `</div>`
            )
            // Click on Log Collection
            $('#logcollection').click(() => logCollection(data.localfile).catch(handleError))
          }

          if (data.command) {
            $('#ifCommand').parent().addClass('wz-dashboard-cell wz-dashboard-panel-table wz-margin-bottom-10')
            $('#ifCommand').html(
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              ` <h3 id="remote" class="wz-headline-title wz-text-link">Remote Command</h3>` +
              `</div>` +
              `<div class="wz-flex-align-space-between wz-flex-container wz-flex-row">` +
              `<p>Visualize all remote command settings</p>` +
              `</div>`
            )
            // Click on Commands
            $('#remote').click(() => remoteCommands(data.command).catch(handleError))
          }
        } catch (err) {
          return Promise.reject(err)
        }
      }

      /**
       * Fill first visualization with data from API
       * @param {String} groupInformationEndpoint 
       */
      const loadAgentConfig = async groupInformationEndpoint => {
        try {
          const groupConfJSON = await ApiService.get(groupInformationEndpoint)
          if (groupConfJSON && groupConfJSON.items && groupConfJSON.items[0] && groupConfJSON.items[0].config) {
            await initializeData(groupConfJSON.items[0].config)
          }
          else {
            $('#dynamicContent').html(noConfigHtml)
          }

        } catch (err) {
          return Promise.reject(err)
        }
      }

      /**
       * Gets the first agent
       */
      const getFirstAgent = async () => {
        try {
          const agentListEndpoint = '/agents/agents_name?ip=' + api.url + '&port=' + api.portapi + '&user=' + api.userapi + '&pass=' + api.passapi
          const agentListJson = await ApiService.get(agentListEndpoint)
          if (agentListJson && agentListJson.data && agentListJson.data.items && agentListJson.data.items.length > 1) {
            return agentListJson.data.items[1]
          } else {
            return false
          }
        } catch (err) {
          return Promise.reject(err)
        }
      }

      /**
       * Agent list for dropdown
       * @param {String} agentListEndpoint 
       */
      const agentList = async () => {
        try {
          const agentListEndpoint = '/agents/agents_name?ip=' + api.url + '&port=' + api.portapi + '&user=' + api.userapi + '&pass=' + api.passapi
          const agentListJson = await ApiService.get(agentListEndpoint)
          for (const agent of agentListJson.data.items) {
            if (agent.id !== "000") {
              $('#agentList').append(
                '<option value="' + agent.id + '">' + agent.name + ' - ' + agent.id + '</option>'
              )
            }
          }
        } catch (err) {
          return Promise.reject(err)
        }
      }

      /**
       * Attaches event to dropdown change
       */
      $('#agentList').on('change', function () {
        loadDataById($(this).val()).then().catch(err => {
          errorChangeAgent.show()
        })
      })

      /**
       * Request agent configuration data
       */
      const loadDataById = async (id) => {
        try {
          let endPoint = '/agents/info?ip=' + api.url + '&port=' + api.portapi + '&user=' + api.userapi + '&pass=' + api.passapi + '&id=' + id
          let parsedJson = await ApiService.get(endPoint)
          const agentListEndpoint = '/agents/agents_name?ip=' + api.url + '&port=' + api.portapi + '&user=' + api.userapi + '&pass=' + api.passapi
          let group = parsedJson.group
          let groupInformationEndpoint = ''
          if (group && typeof group !== 'undefined') {
            groupInformationEndpoint = '/agents/group_configuration?ip=' + api.url + '&port=' + api.portapi + '&user=' + api.userapi + '&pass=' + api.passapi + '&id=' + group
            await loadAgentConfig(groupInformationEndpoint)
          } else {
            $('#dynamicContent').html(noConfigHtml)
          }
          return
        } catch (err) {
          return Promise.reject(err)
        }
      }

      /**
       * Initializes agent list and shows information about the first agent
       */
      const initialize = async () => {
        try {
          await agentList()
          const agent = await getFirstAgent()
          if (agent && agent.id) {
            loadDataById(agent.id)
          } else {
            $('#dynamicContent').empty()
            $('#dynamicContent').html(noAgents)
          }
        } catch (err) {
          return Promise.reject(err)
        }
      }

      /**
       * Initializes visualizations and data when DOM is ready
       */
      $(document).ready(() => initialize().then().catch(err => {
        errorConnectionToast.show()
      }))


      $('header').remove();
      new LayoutView({ "hideFooter": false, "hideSplunkBar": false, "hideAppBar": false, "hideChrome": false })
        .render()
        .getContainerElement()
        .appendChild($('.dashboard-body')[0]);
    }).catch((err) => {
      window.location.href = '/en-US/app/SplunkAppForWazuh/settings'
    })
  }
)