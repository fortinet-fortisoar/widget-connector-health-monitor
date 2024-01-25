/*  Copyright start
  MIT License
  Copyright (c) 2024 Fortinet Inc
  Copyright end*/
'use strict';
/* jshint camelcase: false */

(function() {
  angular
    .module('cybersponse')
    .controller('editConnectorHealthMonitor100Ctrl', editConnectorHealthMonitor100Ctrl);

  editConnectorHealthMonitor100Ctrl.$inject = ['$scope', '$uibModalInstance', 'appModulesService', 'config'];

  function editConnectorHealthMonitor100Ctrl($scope, $uibModalInstance, appModulesService, config) {
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
