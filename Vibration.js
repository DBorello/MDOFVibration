var app = angular.module('app', ['ui.bootstrap-slider']); // this creates a module

function VibrationCtrl($scope, $interval) {
    $scope.test = "Dan"

    $scope.chartP =new Highcharts.Chart({
        chart: {
            renderTo: 'PhysicalChart',
            defaultSeriesType: 'line',
            animation: false
        },
        title: {
            text: ''
        },
        xAxis: {
            type: 'linear',
            tickPixelInterval: 150,
            minRange: 10
        },
        yAxis: [{
            minPadding: 0.2,
            maxPadding: 0.2,
            min: -$scope.U()*1.1,
            max: $scope.U()*1.1,
            title: {
                text: '',
                margin: 80
            }
        },{
            minPadding: 0.2,
            maxPadding: 0.2,
            min: -$scope.U()*1.1,
            max: $scope.U()*1.1,
            title: {
                text: 'Excitation P(t)',
                margin: 8
            },
            opposite: true
        }
        ],
        series: [{
            name: 'Displacement',
            animation: false,
            marker: {
                enabled: false
            },
            color: '#000000',
            data: []
        },
            {
                name: 'Velocity',
                animation: false,
                marker: {
                    enabled: false
                },
                color: '#FF0000',
                data: []
            },
            {
                name: 'Acceleration',
                animation: false,
                marker: {
                    enabled: false
                },
                color: '#00FF00',
                data: []
            },
            {
                name: 'Excitation',
                animation: false,
                yAxis: 1,
                marker: {
                    enabled: false
                },
                color: '#0000FF',
                data: []
            }
        ],
        tooltip: {
            enabled: false
        },
        credits: {
            enabled: false
        }
    });

};

app.controller('VibrationCtrl',VibrationCtrl);