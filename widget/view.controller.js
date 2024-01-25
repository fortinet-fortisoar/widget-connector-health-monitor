/*  Copyright start
  MIT License
  Copyright (c) 2024 Fortinet Inc
  Copyright end*/
  'use strict';
  /* jshint camelcase: false */
  
  (function() {
    angular.module('cybersponse')
      .controller('connectorHealthMonitor100Ctrl', connectorHealthMonitor100Ctrl);
  
    connectorHealthMonitor100Ctrl.$inject = ['$scope', 'config', '$http', 'API', 'toaster', '$q', 'currentPermissionsService', '$timeout', '$filter', '_'];
  
    function connectorHealthMonitor100Ctrl($scope, config, $http, API, toaster, $q, currentPermissionsService, $timeout, $filter, _) {
      $scope.processing = true;
      $scope.toolTip = {
        'unknown': 'Connector Health: Unavailable',
        'available': 'Connector Health: Available'
      };
  
      $scope.collapse = (angular.isDefined(config.widgetAlwaysExpanded) && config.widgetAlwaysExpanded) ? !config.widgetAlwaysExpanded : true;
      var agentsReadPermission = currentPermissionsService.availablePermission('agents', 'read');
      $scope.loadChartData = function() {
        $scope.connectorsList = [];
        var promises = [];
        var selfAgent = false;
  
        if (agentsReadPermission){
          $http.post(API.QUERY + 'agents').then(function (response) {
            angular.forEach(response.data['hydra:member'], function (agent) {
              promises.push(configuredConnectors(agent, false));
              if(agent.role === 'self'){
                selfAgent = true;
              }
            });
            //if soc team is not assigned user does not get self agent
            if(!selfAgent){
              promises.push(configuredConnectors(null, true));
            }
            $q.all(promises).then(function () {
              getConfigHealth();
            });
          },angular.noop);
        }else{
          configuredConnectors().then(function(){
            getConfigHealth();
          });
        }
  
        $scope.$watch('connectorsList', function(newValue, oldValue) {
          if (newValue !== oldValue) {
            $scope.configuredConnectors = angular.copy(newValue);
          }
        });
  
        function configuredConnectors(agentInfo, selfAgent) {
          var deferred = $q.defer();
          var agent = '';
          if(agentInfo){
            agent = '&agent=' + agentInfo.agentId;
          }
  
          $http.post(API.INTEGRATIONS + 'connector_details/?format=json&configured=true&exclude=operation&active=true' + agent, {}).then(function(response) {
            if(agentInfo) {
              angular.forEach(response.data.data, function(connector){
                angular.forEach(connector.configuration, function(conf) {
                  conf.agentName = agentInfo.name;
                });
                $scope.connectorsList.push(connector);
              });
            } else if(selfAgent) {
              angular.forEach(response.data.data, function(connector){
                angular.forEach(connector.configuration, function(conf) {
                  conf.agentName = 'Self';
                });
                $scope.connectorsList.push(connector);
              });
            } else {
              $scope.connectorsList = $scope.connectorsList.concat(response.data.data);
            }
            deferred.resolve();
          }, function() {
            if (toaster) {
              toaster.clear();
            }
            toaster.error({
              body: 'Unable to retrieve configured connectors.'
            });
            deferred.reject();
          });
  
          return deferred.promise;
        }
  
        function getConfigHealth() {
          var promises = [];
          $scope.configuredConnectorList = {};
          angular.forEach($scope.connectorsList, function(connectors) {
            if(connectors.configuration.length > 0) {
              $scope.configuredConnectorList[connectors.name] = $scope.configuredConnectorList[connectors.name] || {};
              $scope.configuredConnectorList[connectors.name].configuration = $scope.configuredConnectorList[connectors.name].configuration || [];
              angular.forEach(connectors.configuration, function(config) {
                $scope.configuredConnectorList[connectors.name].label = connectors.label;
                $scope.configuredConnectorList[connectors.name].active = connectors.active;
                $scope.configuredConnectorList[connectors.name].icon_small = connectors.icon_small;
                config.configHealthStatus = 'unknown';
                config.configHealthMessage = 'Unavailable';
                promises.push(configHealthCheck(connectors, config));
              });
            }
          });
  
          $q.all(promises).then(function() {
            $scope.processing = false;
            connectorStatus();
          }).catch(function(){
            //if any of the promise is failed, to call connectorStatus, catch is used
            $scope.processing = false;
            connectorStatus();
          });
        }
  
        function configHealthCheck(connectors, config) {
          $scope.processing = true;
          var deferred = $q.defer();
          var configHealth = $http({
            url: API.INTEGRATIONS + 'connectors/healthcheck/' + connectors.name + '/' + connectors.version + '/?config=' + config.config_id,
            headers: {
              'Content-Type': 'application/json;charset=utf-8'
            }
          });
  
          configHealth.then(function(response) {
            $scope.processing = false;
            if(response.data.status) {
              config.configHealthStatus = response.data.status.toLowerCase();
              config.configHealthMessage = response.data.status;
              config.configError = response.data.message ? response.data.message : '';
            } else if(response.data.last_known_health_status) {
              if(response.data.last_known_health_status.status) {
                config.configHealthStatus = response.data.last_known_health_status.status.toLowerCase();
                config.configHealthMessage = response.data.last_known_health_status.status;
                config.configError = response.data.last_known_health_status.message ? response.data.last_known_health_status.message : '';
              } else {
                config.configHealthMessage = 'Node unreachable';
              }
            } else if (response.data.agent) {
              // This gets health status of agents configured for connectors
              var agent = '&agent=' + response.data.agent;
              $http.post(API.INTEGRATIONS + 'connectors/' + connectors.name + '/' + connectors.version + '/?format=json' + agent, 
              {
                headers: {
                  'Content-Type': 'application/json;charset=utf-8'
                }
              }).then(function(healthResponse) {
                healthResponse.data.configuration.forEach(function(data) {
                  if (data.config_id === response.data.configuration) {
                    config.configHealthStatus = data.health_status.status.toLowerCase();
                    config.configHealthMessage = data.health_status.status;
                    config.configError = data.health_status.message ? data.health_status.message : '';
                  }
                });
              });
            }
  
            //Re-Check if health check is last known
            var reCheckAgentConnectorHealthPromise;
            if(response.data.last_known_health_status) {
              reCheckAgentConnectorHealthPromise = $timeout(function() {
                reCheckAgentConnectorHealth(connectors, config, response.data);
              }, 10000);
            }
  
            var existingConfig = _.findIndex($scope.configuredConnectorList[connectors.name].configuration, function(conf){ return conf.config_id === config.config_id; });
            if(existingConfig > -1) {
              $scope.configuredConnectorList[connectors.name].configuration[existingConfig] = config;
              if(reCheckAgentConnectorHealthPromise) {
                $timeout.cancel(reCheckAgentConnectorHealthPromise);
              }
            } else {
              $scope.configuredConnectorList[connectors.name].configuration.push(config);
            }
  
            deferred.resolve();
          }, function() {
            deferred.reject();
          });
  
          return deferred.promise;
        }
  
        function connectorStatus() {
          angular.forEach($scope.configuredConnectorList, function(connectors) {
            var availableCount = 0;
            var disconnectedCount = 0;
            var unknowCount = 0;
            angular.forEach(connectors.configuration, function(config) {
              if (config.configHealthStatus === 'available') {
                availableCount = availableCount + 1;
              } else if (config.configHealthStatus === 'disconnected') {
                disconnectedCount = disconnectedCount + 1;
              } else if (config.configHealthStatus === 'unknown') {
                unknowCount = unknowCount + 1;
              }
            });
  
            if(connectors.active){
              if (disconnectedCount > 0 || unknowCount > 0) {
                connectors.connectorHealthStatus = disconnectedCount > 0 ? 'disconnected' : 'unknown';
                if ((disconnectedCount === 1 || unknowCount === 1) && availableCount === 0) {
                  connectors.connectorHealthStatusMessage = 'Unavailable';
                } else if ((unknowCount > 0 || disconnectedCount > 0) && availableCount >= 0) {
                  connectors.connectorHealthStatusMessage = disconnectedCount + unknowCount + ' Unavailable';
                }
              } else if (unknowCount === 0 && disconnectedCount === 0) {
                connectors.connectorHealthStatus = 'available';
                if(connectors.configuration.length === 1) {
                  connectors.connectorHealthStatusMessage = 'Available';
                }else {
                  connectors.connectorHealthStatusMessage = 'All Available';
                }
  
              } else if (availableCount === 0 && disconnectedCount === 0) {
                connectors.connectorHealthStatus = 'unknown';
                connectors.connectorHealthStatusMessage = 'Health Check: Unavailable';
              }
            } else {
              connectors.connectorHealthStatus = 'disconnected';
              connectors.connectorHealthStatusMessage = 'Deactivated';
            }
          });
        }
  
        function reCheckAgentConnectorHealth(connectors, config, lastresponse){
          var currentDateTime = $filter('dateToUnixInMilliSeconds')(new Date());
          var lastKnownHealthStatusTime = $filter('dateToUnixInMilliSeconds')(lastresponse.last_known_health_status_time);
          
          if(currentDateTime - lastKnownHealthStatusTime > 10000) {
            configHealthCheck(connectors, config);
          }
        }
      };
  
      function _init() {
        $scope.loadChartData();
      }
  
      $scope.refresh = function() {
        _init();
      };
  
    }
  })();
  