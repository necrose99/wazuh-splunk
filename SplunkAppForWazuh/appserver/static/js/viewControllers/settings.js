/*
 * Wazuh app - API configuration view controller
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
  "splunkjs/mvc",
  "splunkjs/mvc/utils",
  "splunkjs/mvc/simplexml",
  "splunkjs/mvc/simplexml/dashboardview",
  "underscore",
  "splunkjs/mvc/tokenutils",
  "jquery",
  "splunkjs/mvc/layoutview",
  "splunkjs/mvc/simplexml/dashboardview",
  "/static/app/SplunkAppForWazuh/js/services/credentialService.js",
  "/static/app/SplunkAppForWazuh/js/services/apiService.js",
  "/static/app/SplunkAppForWazuh/js/services/indexService.js",
  "/static/app/SplunkAppForWazuh/js/directives/toaster.js",
  "splunkjs/mvc/simplexml/searcheventhandler",
  "splunkjs/mvc/simpleform/input/dropdown",
  "splunkjs/mvc/searchmanager",
  "splunkjs/mvc/simplexml/urltokenmodel",
  "splunkjs/mvc/simpleform/formutils",
  "/static/app/SplunkAppForWazuh/js/directives/selectedCredentialsDirective.js"

],
  function (
    mvc,
    utils,
    DashboardController,
    Dashboard,
    _,
    TokenUtils,
    $,
    LayoutView,
    Dashboard,
    CredentialService,
    ApiService,
    IndexService,
    Toast,
    SearchEventHandler,
    DropdownInput,
    SearchManager,
    UrlTokenModel,
    FormUtils,
    SelectedCredentials

  ) {
    let pageLoading = true
    const urlTokenModel = new UrlTokenModel()
    mvc.Components.registerInstance('url', urlTokenModel)
    const defaultTokenModel = mvc.Components.getInstance('default', { create: true })
    const submittedTokenModel = mvc.Components.getInstance('submitted', { create: true })
    let baseUrl = ''
    urlTokenModel.on('url:navigate', () => {
      defaultTokenModel.set(urlTokenModel.toJSON())
      if (!_.isEmpty(urlTokenModel.toJSON()) && !_.all(urlTokenModel.toJSON(), _.isUndefined)) {
        submitTokens()
      } else {
        submittedTokenModel.clear()
      }
    })

    // Initialize tokens
    defaultTokenModel.set(urlTokenModel.toJSON())

    const submitTokens = () => {
      // Copy the contents of the defaultTokenModel to the submittedTokenModel and urlTokenModel
      FormUtils.submitForm({ replaceState: pageLoading })
    }

    const setToken = (name, value) => {
      defaultTokenModel.set(name, value)
      submittedTokenModel.set(name, value)
    }

    const unsetToken = (name) => {
      defaultTokenModel.unset(name)
      submittedTokenModel.unset(name)
    }

    $(document).ready(() => {
      const urlTemp = window.location.href
      const arr = urlTemp.split("/")
      baseUrl = arr[0] + "//" + arr[2]
    })

    const searchIndexes = new SearchManager({
      "id": "searchIndexes",
      "cancelOnUnload": true,
      "sample_ratio": null,
      "earliest_time": "2017-03-14T10:0:0",
      "status_buckets": 0,
      "search": "| metasearch index=\"*\" sourcetype=wazuh | stats count by index, sourcetype | fields index",
      "latest_time": "now",
      "app": utils.getCurrentApp(),
      "auto_cancel": 90,
      "preview": true,
      "tokenDependencies": {
      },
      "runWhenTimeIsUndefined": false
    }, { tokens: true })


    const inputIndexes = new DropdownInput({
      "id": "inputIndexes",
      // "choices": [
      // { "label": "all", "value": "*" }
      // ],
      "labelField": "index",
      "searchWhenChanged": false,
      "default": "wazuh",
      "valueField": "index",
      // "initialValue": "wazuh",
      "selectFirstChoice": true,
      "showClearButton": false,
      "value": "$form.index$",
      "managerid": "searchIndexes",
      "el": $('#inputIndexes')
    }, { tokens: true }).render()

    inputIndexes.on("change", (newValue) => {
      IndexService.select(newValue)
      FormUtils.handleValueChange(inputIndexes)
    })

    // Validation RegEx
    const userRegEx = new RegExp(/^.{3,100}$/)
    const passRegEx = new RegExp(/^.{3,100}$/)
    const urlRegEx = new RegExp(/^https?:\/\/[a-zA-Z0-9-.]{1,300}$/)
    const urlRegExIP = new RegExp(/^https?:\/\/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/)
    const portRegEx = new RegExp(/^[0-9]{2,5}$/)

    // Toast definition
    const errorConnectionToast = new Toast('error', 'toast-bottom-right', 'Connection error', 1000, 250, 250)
    const errorWhenDeletingRowToast = new Toast('error', 'toast-bottom-right', 'Error when deleting API', 1000, 250, 250)
    const successConnectionToast = new Toast('success', 'toast-bottom-right', 'Connection successful', 1000, 250, 250)
    const invalidFormatInputToast = new Toast('error', 'toast-bottom-right', 'Invalid format. Please, check your inputs again', 1000, 250, 250)
    const selectedApiErrorToast = new Toast('error', 'toast-bottom-right', 'No working API was selected.', 1000, 250, 250)
    const cannotAddApiErrorToast = new Toast('error', 'toast-bottom-right', 'Cannot add API without connection.', 1000, 250, 250)

    /**
     * Check if an URL is valid or not
     * @param {String} url 
     */
    const validUrl = url => {
      return urlRegEx.test(url) || urlRegExIP.test(url)
    }

    /**
     * Check if a port is valid or not
     * @param {String} port 
     */
    const validPort = port => {
      return portRegEx.test(port)
    }

    /**
     * Check if an user is valid or not
     * @param {String} user 
     */
    const validUsername = user => {
      return userRegEx.test(user)
    }

    /**
     * Check if a password is valid or not
     * @param {String} pass 
     */
    const validPassword = pass => {
      return passRegEx.test(pass)
    }

    /**
     * Deletes a manager by id
     * @param {String} key 
     */
    const removeManager = async (key) => {
      try {
        await CredentialService.remove(key)
        await drawApiList()
      } catch (err) {
        errorWhenDeletingRowToast.show()
      }
    }

    /**
     * Checks connection with a manager API
     * @param {String} key 
     */
    const checkManagerConnection = async (key) => {
      try {
        await CredentialService.checkApiConnection(key)
        successConnectionToast.show()
        await drawApiList()
      } catch (err) {
        errorConnectionToast.show()
      }
    }

    /**
    * Loads and distributes manager configuration content
    */
    const loadAboutContent = async () => {
      try {
        const versions = await ApiService.get('/manager/current_version')
        $('#wazuhVersion').text(versions[0].wazuhversion)
        $('#appVersion').text(versions[0].appversion)
        $('#appRevision').text(versions[0].apprevision)

      } catch (err) {
        errorConnectionToast.show()
      }
    }


    /**
     * Clears the API table
     */
    const clearTable = () => {
      $('#apiList').empty()
    }

    /**
     * Draws the API list
     * @param {Array} apis 
     */
    const drawApiList = async () => {
      try {
        const apiList = await CredentialService.getApiList()
        if (apiList && apiList.length > 0) {
          clearTable()
          $('#apiList').html(
            '<table class="highlight"> ' +
            '  <thead> ' +
            '    <tr> ' +
            '        <th>URL</th> ' +
            '        <th>Port</th> ' +
            '        <th>Username</th> ' +
            '        <th>Actions</th> ' +
            '        <th>Selected</th> ' +
            '        <th>Manager</th> ' +
            '        <th>Cluster</th> ' +
            '    </tr> ' +
            '  </thead> ' +
            '  <tbody id="tableBody"> ' +
            '  </tbody> ' +
            '</table> '
          )
          for (const api of apiList) {
            $('#tableBody').append(
              '<tr> ' +
              ' <td>' + api.url + '</td> ' +
              ' <td>' + api.portapi + '</td> ' +
              ' <td>' + api.userapi + '</td> ' +
              ' <td>' +
              '   <i id="' + api._key + '" tooltip="Set as default Manager" class="fa fa-star font-size-18 wz-cursor-pointer" aria-hidden="true"></i>' +
              '   <i id="' + api._key + '" class="fa fa-trash wz-margin-left-7 wz-cursor-pointer" aria-hidden="true"></i>' +
              '   <i id="' + api._key + '" class="fa fa-refresh wz-margin-left-7 wz-cursor-pointer" aria-hidden="true"></i></td> ' +
              ' <td>' + (!api.selected ? '' : 'yes') + '</td> ' +
              ' <td>' + api.managerName + '</td> ' +
              ' <td>' + (api.cluster !== false ? api.cluster : 'Disabled') + '</td> ' +
              '</tr> '
            )
          }
        } else {
          clearTable()
          $('#apiList').html('<h4>No API entries detected. You must have at least one API for using Splunk app for Wazuh.</h4>')
        }
      } catch (err) {
        return Promise.reject(err)
      }
    }

    /**
     * Edits a manager connection
     * @param {String} key 
     */
    const selectManager = async (key) => {
      try {
        await CredentialService.checkApiConnection(key)
        await CredentialService.chose(key)
        await drawApiList()
      } catch (err) {
        errorConnectionToast.show()
      }
    }

    /**
     * Click on delete manager
     */
    $('#apiList').on("click", "#tableBody tr td i.fa-trash", function (e) {
      removeManager(this.id)
    })

    /**
     * Click on select manager
     */
    $('#apiList').on("click", "#tableBody tr td i.fa-star", function (e) {
      selectManager(this.id)
    })

    /**
     * Click on check manager
     */
    $('#apiList').on("click", "#tableBody tr td i.fa-refresh", function (e) {
      checkManagerConnection(this.id)
    })

    /**
     * Selects a row
     * @param {Event} evt 
     * @param {String} tabName 
     */
    const selectOption = (evt, tabName) => {
      let i, tablinks;
      switch (tabName) {
        case 'API':
          $('#Indexes').hide()
          $('#About').hide()
          $('#API').show(200)
          break
        case 'Indexes':
          $('#API').hide()
          $('#About').hide()
          $('#Indexes').show(200)

          break
        case 'About':
          $('#Indexes').hide()
          $('#API').hide()
          $('#About').show(200)
          break
        default:
          $('#Indexes').hide()
          $('#About').hide()
          $('#API').show(200)
      }
      tablinks = document.getElementsByClassName("tablinks");
      for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
      }
      evt.currentTarget.className += " active";
    }

    /**
     * Autoselects the first working API if any of them was selected
     */
    const autoSelectApi = async () => {
      try {
        if (!CredentialService.getSelectedApi()) {
          const apiList = await CredentialService.getApiList()
          let selected = false
          for (let i = 0; i < apiList.length && !selected; i++) {
            if (CredentialService.checkApiConnection(apiList[i]._key)) {
              await CredentialService.chose(apiList[i]._key)
              selected = true
            }
          }

        } else {
        }
      } catch (err) {
        return Promise.reject(err)
      }
    }

    /**
     * Check if connection is OK at starting view
     */
    const firstLoad = async () => {
      try {
        $('#mainFrame').removeClass('wz-loading')
        $('#apiTab').click()
        await autoSelectApi()
        await loadAboutContent()
        const { api } = await CredentialService.checkSelectedApiConnection()
        SelectedCredentials.render($('#selectedCredentials'), api.filter[1])
        await drawApiList()
        successConnectionToast.show()
      } catch (err) {
        try {
          await CredentialService.deselectAllApis()
          await drawApiList()
          selectedApiErrorToast.show()
        } catch (err) {
          selectedApiErrorToast.show()
        }
      }
    }

    /**
     * On document ready
     */
    $('#apiTab').click((event) => selectOption(event, 'API'))
    $('#indexesTab').click((event) => selectOption(event, 'Indexes'))
    $('#aboutTab').click((event) => selectOption(event, 'About'))

    $(document).ready(() => firstLoad())

    $('header').remove()
    new LayoutView({ "hideSplunkBar": false, "hideFooter": false, "hideChrome": false, "hideAppBar": false })
      .render()
      .getContainerElement()
      .appendChild($('.dashboard-body')[0])

    new Dashboard({
      id: 'dashboard',
      el: $('.dashboard-body'),
      showTitle: true,
      editable: false
    }, { tokens: false }).render()

    /**
     * Reject a promise error
     * @param {object} err 
     */
    const errorHandleDeleting = async (err) => {
      errorWhenDeletingRowToast.show()
    }

    /**
     * Delete a record
     */
    const deleteAllRecords = async () => {
      try {
        // Delete the record that corresponds to the key ID using
        await CredentialService.delete()
        CredentialService.deselectAllApis()
        await drawApiList()
        // Run the search again to update the table
      } catch (err) {
        return Promise.reject(err)
      }
    }

    // Call this function when the Delete Record button is clicked
    $("#deleteRecord").click(() => deleteAllRecords().catch((err) => errorHandleDeleting()))

    /**
     * Clears the data inputs
     */
    const clearForm = () => {
      $('#credentialPortInput').val('')
      $('#credentialUserInput').val('')
      $('#credentialUrlInput').val('')
      $('#credentialPassInput').val('')
    }

    /**
     * Actions when submit
     */
    const clickOnSubmit = async () => {
      try {
        // When the Submit button is clicked, get all the form fields by accessing input values
        const form_url = $('#credentialUrlInput').val()
        const form_apiport = $('#credentialPortInput').val()
        const form_apiuser = $('#credentialUserInput').val()
        const form_apipass = $('#credentialPassInput').val()

        // If values are valid, register them
        if (validPassword(form_apipass) && validPort(form_apiport) && validUrl(form_url) && validUsername(form_apiuser)) {
          // Create an object to store the field names and values
          const record = {
            "url": form_url,
            "portapi": form_apiport,
            "userapi": form_apiuser,
            "passapi": form_apipass,
            "cluster": false,
            "managerName": false
          }
          // Use the request method to send and insert a new record
          const result = await CredentialService.insert(record)
          try {
            const resultConnection = await CredentialService.checkApiConnection(result.data._key)
            clearForm()
            const apiList = await CredentialService.getApiList()
            if (apiList && apiList.length === 1) {
              await selectManager(result.data._key)
            }
            await drawApiList()
          } catch (err) {
            await CredentialService.remove(result.data._key)
            cannotAddApiErrorToast.show()
          }
        } else {
          invalidFormatInputToast.show()
        }
      } catch (err) {
      }
    }

    /**
     * On submit click
     */
    $('#submitApiForm').on("click", async () => clickOnSubmit())

    /**
     * On Remove all click
     */
    $('#removeAll').on("click", async () => deleteAllRecords().catch((err) => { errorWhenDeletingRowToast.show() }))



    DashboardController.onReady(() => {
      if (!submittedTokenModel.has('earliest') && !submittedTokenModel.has('latest')) {
        submittedTokenModel.set({ earliest: '0', latest: '' })
      }
    })

    // Initialize time tokens to default
    if (!defaultTokenModel.has('earliest') && !defaultTokenModel.has('latest')) {
      defaultTokenModel.set({ earliest: '0', latest: '' })
    }

    submitTokens()

    DashboardController.ready()
    pageLoading = false
  }
)