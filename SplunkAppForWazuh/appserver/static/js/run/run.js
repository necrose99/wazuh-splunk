define([
  './module'
], function (
  module
) {
    'use strict'
    module.run(['$state', '$transitions', '$navigationService', '$credentialService', '$currentApiIndexService', function ($state, $transitions, $navigationService, $credentialService, $currentApiIndexService) {
      $navigationService.goToLastState()
      $transitions.onStart({ to: 'manager' }, async (trans) => {
        try {
          const { api, selectedIndex } = await $credentialService.checkSelectedApiConnection()
          $currentApiIndexService.setAPI(JSON.stringify(api))
        } catch (err) {
          console.error('no more connectivity with API, redirecting to settings')
          $state.go('settings.api')
        }
      })
      $transitions.onStart({ to: 'overview' }, async (trans) => {
        try {
          const { api, selectedIndex } = await $credentialService.checkSelectedApiConnection()
          $currentApiIndexService.setAPI(JSON.stringify(api))
        } catch (err) {
          console.error('no more connectivity with API, redirecting to settings')
          $state.go('settings.api')
        }
      })
    }])
  })

