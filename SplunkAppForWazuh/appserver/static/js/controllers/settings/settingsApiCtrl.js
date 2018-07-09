define([
  '../module',
], function (
  controllers
) {
    'use strict'
    controllers.controller('settingsApiCtrl', function ($credentialService, apiList) {
      const vm = this
      const epoch = (new Date).getTime()
      // Validation RegEx
      const userRegEx = new RegExp(/^.{3,100}$/)
      const passRegEx = new RegExp(/^.{3,100}$/)
      const urlRegEx = new RegExp(/^https?:\/\/[a-zA-Z0-9-.]{1,300}$/)
      const urlRegExIP = new RegExp(/^https?:\/\/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/)
      const portRegEx = new RegExp(/^[0-9]{2,5}$/)

      vm.init = function () {
        vm.selected = []
        vm.apiList = apiList
        vm.selectedApi = []
        console.log('vm.apiList ', vm.apiList, ' apiList ', apiList)
        if (vm.apiList && vm.apiList.length > 0)
          vm.visibleTable = true
        else
          vm.visibleTable = false
        console.log('must we see any table? ', vm.visibleTable)
      }

      /**
        * Delete all API records
        */
      vm.deleteAllRecords = async () => {
        try {
          // Delete the record that corresponds to the key ID using
          await $credentialService.delete()
          $credentialService.deselectAllApis()
          vm.visibleTable = false
          // Run the search again to update the table
        } catch (err) {
          return Promise.reject(err)
        }
      }

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

      const clearForm = () => {
        vm.url = ''
        vm.port = ''
        vm.user = ''
        vm.pass = ''
      }

      /**
       * Edits a manager connection
       * @param {String} key 
       */
      const selectManager = async (key) => {
        try {
          await $credentialService.checkApiConnection(key)
          await $credentialService.chose(key)
          vm.visibleTable = true
        } catch (err) {
          console.error('[selectManager]: ', err)
        }
      }

      /**
       * Adds a new API
       */
      vm.submitApiForm = async () => {
        // When the Submit button is clicked, get all the form fields by accessing input values
        const form_url = vm.url
        const form_apiport = vm.port
        const form_apiuser = vm.user
        const form_apipass = vm.pass

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
          const result = await $credentialService.insert(record)
          try {
            const resultConnection = await $credentialService.checkApiConnection(result.data._key)
            clearForm()
            const apiList = await $credentialService.getApiList()
            if (apiList && apiList.length === 1) {
              await selectManager(result.data._key)
            }
            vm.visibleTable = true
          } catch (err) {
            await $credentialService.remove(result.data._key)
            console.error('error! rollbacking', err)
          }
        } else {
          // invalidFormatInputToast.show()
          console.error('invalid format')
        }
      }

      vm.init()

    })
  })
