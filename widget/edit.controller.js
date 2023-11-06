/* Copyright start
  Copyright (C) 2008 - 2023 Fortinet Inc.
  All rights reserved.
  FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
  Copyright end */
'use strict';
/* jshint camelcase: false */

(function() {
  angular
    .module('cybersponse')
    .controller('editConnectorHealthMonitoring100Ctrl', editConnectorHealthMonitoring100Ctrl);

  editConnectorHealthMonitoring100Ctrl.$inject = ['$scope', '$uibModalInstance', 'appModulesService', 'config'];

  function editConnectorHealthMonitoring100Ctrl($scope, $uibModalInstance, appModulesService, config) {
    $scope.cancel = cancel;
    $scope.save = save;
    $scope.config = {};
    $scope.init = init;

    appModulesService.load(true).then(function(modules) {
      $scope.modules = modules;
    });

    function init() {
      angular.extend($scope.config, config);
      $scope.header = $scope.config.title ? 'Edit Connector Health Tracker' : 'Add Connector Health Tracker';
    }

    function cancel() {
      $uibModalInstance.dismiss('cancel');
    }

    function save() {
      if ($scope.connectorHealthForm.$invalid) {
        $scope.connectorHealthForm.$setTouched();
        $scope.connectorHealthForm.$focusOnFirstError();
        return;
      }
      $uibModalInstance.close($scope.config);
    }

    init();
  }
})();
