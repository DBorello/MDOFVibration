var app = angular.module('app', ['ngUrlBind']); // this creates a module

//Todo
//Input

function listToMatrix(list, elementsPerSubArray) {
    var matrix = [], i, k;

    for (i = 0, k = -1; i < list.length; i++) {
        if (i % elementsPerSubArray === 0) {
            k++;
            matrix[k] = [];
        }

        matrix[k].push(list[i]);
    }

    return matrix;
}

function maxAbsArray(a) {
    var max=Math.abs(a[0]); for(var i=0,j=a.length;i<j;i++){max=Math.abs(a[i])>max?Math.abs(a[i]):max};
    return max;
}
function VibrationCtrl($scope, $interval, ngUrlBind) {


    $scope.nDofi = 3;
    $scope.Mi = [[1,0,0],[0,1,0],[0,0,1]];
    $scope.Ki = [[2,-1,0],[-1,2,-1],[0,-1,1]];
    $scope.u0i = [0,1,1];
    v = [0,0,0];

    ngUrlBind($scope, 'nDofi');
    ngUrlBind($scope, 'Mi');
    ngUrlBind($scope, 'Ki');
    ngUrlBind($scope, 'u0i');
    ngUrlBind($scope, 'v0i');

    $scope.SetDOF = function() {
        n = $scope.nDofi;
        $scope.Mi = numeric.identity(n);
        $scope.Ki = numeric.identity(n);
        a=i=[];for(;i<n;)a[i++]=1; //Create array of 1s
        $scope.u0i = a;
        a=i=[];for(;i<n;)a[i++]=0; //Create array of 0s
        $scope.v0i = a;
    };

    $scope.CalculateProperties = function() {
        //$scope.nDof = $scope.M.length;
        $scope.nDof = $scope.nDofi;
        $scope.M = $scope.Mi//listToMatrix($scope.Mraw.split(","),$scope.nDof);
        $scope.K = $scope.Ki//listToMatrix($scope.Kraw.split(","),$scope.nDof);
        $scope.u0 = $scope.u0i;
        $scope.v0 = $scope.v0i;

        $scope.SetN();

        A = numeric.dot($scope.K,numeric.inv($scope.M));
        ev = numeric.eig(A);
        $scope.ws = ev.lambda.x;  //w^2
        $scope.w = numeric.sqrt($scope.ws)//.sort(); //w
        Phi = ev.E.x;

        //Sort
        // temporary array holds objects with position and sort-value
        PhiT = numeric.transpose(Phi);
        Modes  = [];
        for (i = 0; i < $scope.nDof; i++) {
            //Normalize
            phi = PhiT[i];
            phiM = maxAbsArray(phi);
            Modes[i] = {w: $scope.w[i], Phi: numeric.div(phi,phiM)};
        }

        Modes.sort(function(a,b) {
           return (a['w'] - b['w']);
        });

        Phi = [];
        for (i = 0; i < $scope.nDof; i++) {
            $scope.w[i] = Modes[i].w;
            Phi[i] = Modes[i].Phi;
        }
        $scope.Phi = numeric.transpose(Phi);

        $scope.MM = numeric.dot(numeric.dot(numeric.transpose($scope.Phi),$scope.M),$scope.Phi);
        $scope.MK = numeric.dot(numeric.dot(numeric.transpose($scope.Phi),$scope.K),$scope.Phi);

        //Initial conditions
        $scope.a = [];
        $scope.b = [];
        $scope.U = [];
        for (i = 0; i < $scope.nDof; i++) {
            phi_rT = numeric.transpose($scope.Phi)[i];
            $scope.a[i] = numeric.dot(numeric.dot(phi_rT,$scope.M),$scope.u0) / $scope.MM[i][i];
            $scope.b[i] = numeric.dot(numeric.dot(phi_rT,$scope.M),$scope.v0) / ($scope.w[i]*$scope.MM[i][i]);
            $scope.U[i] = Math.abs($scope.a[i] + $scope.b[i]);
        }

        //Physical max
        $scope.UMax = maxAbsArray(numeric.dot($scope.Phi,$scope.U));
        $scope.EtaMax = maxAbsArray($scope.a.concat($scope.b));

        //Set axes
        $scope.PhysicalChart.yAxis[0].update({min: -$scope.UMax*1.1});
        $scope.PhysicalChart.yAxis[0].update({max: $scope.UMax*1.1});
        $scope.ModalChart.yAxis[0].update({min: -$scope.EtaMax*1.1});
        $scope.ModalChart.yAxis[0].update({max: $scope.EtaMax*1.1});
    };

    $scope.SetN = function() {
        //Delete all series
        while ($scope.PhysicalChart.series.length > 0) {
            $scope.PhysicalChart.series[0].remove();
        }

        while ($scope.ModalChart.series.length > 0) {
            $scope.ModalChart.series[0].remove();
        }

        $scope.PhysicalChart.colorCounter = 0;
        $scope.ModalChart.colorCounter = 0;
        //Add series to charts
        for (i = 1; i <= $scope.nDof; i++) {
            SeriesOptions = {
                name: 'u' + i,
                animation: false,
                marker: {
                    enabled: false
                },
                date: []
            };
            $scope.PhysicalChart.addSeries(SeriesOptions);

            SeriesOptions = {
                name: 'n' + i,
                animation: false,
                marker: {
                    enabled: false
                },
                date: []
            };
            $scope.ModalChart.addSeries(SeriesOptions);
        }


    };


    $scope.Eta = function(t) {
        Eta = [];
        for (i = 0; i < $scope.nDof; i++) {
            Eta[i] = $scope.a[i]*Math.cos($scope.w[i] * t) + $scope.b[i] * Math.sin($scope.w[i] *t);
        }
        return Eta;
    };

    $scope.doUpdate = function () {
        d = new Date();
        t = (d.getTime() - $scope.StartTime)/1000;

        if ($scope.ModalChart.series[0].data.length > 1) {
            shift = (t - $scope.ModalChart.series[0].data[0]['x']) > 10;
        } else {
            shift = false
        }

        Eta = $scope.Eta(t);
        u = numeric.dot($scope.Phi,Eta);

        for (i = 0; i < $scope.nDof; i++) {
            $scope.PhysicalChart.series[i].addPoint([t,u[i]], false, shift);
            $scope.ModalChart.series[i].addPoint([t,Eta[i]], false, shift);
        }

        $scope.PhysicalChart.xAxis[0].update({min: t-10});
        $scope.PhysicalChart.xAxis[0].update({max: t});
        $scope.ModalChart.xAxis[0].update({min: t-10});
        $scope.ModalChart.xAxis[0].update({max: t});
        $scope.PhysicalChart.redraw();
        $scope.ModalChart.redraw();

        //$scope.UpdatePhysical(u);
        $scope.UpdateModal(u, Eta);
    };

    $scope.PhysicalChart =new Highcharts.Chart({
        chart: {
            renderTo: 'PhysicalChart',
            defaultSeriesType: 'line',
            animation: false
        },
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFF00'],
        title: {
            text: 'Physical Coordinates'
        },
        xAxis: {
            type: 'linear',
            tickPixelInterval: 150,
            minRange: 10
        },
        yAxis:{
            minPadding: 0.2,
            maxPadding: 0.2,
            min: -1,
            max: 1,
            title: {
                text: '',
                margin: 80
            }
        },
        series: [],
        tooltip: {
            enabled: false
        },
        credits: {
            enabled: false
        }
    });


    $scope.ModalChart =new Highcharts.Chart({
        chart: {
            renderTo: 'ModalChart',
            defaultSeriesType: 'line',
            animation: false
        },
        colors: ['#770000', '#007700', '#000077', '#777700', '#770077', '#007777', '#777700'],
        title: {
            text: 'Modal Coordinates'
        },
        xAxis: {
            type: 'linear',
            tickPixelInterval: 150,
            minRange: 10
        },
        yAxis:{
            minPadding: 0.2,
            maxPadding: 0.2,
            min: -1,
            max: 1,
            title: {
                text: '',
                margin: 80
            }
        },
        series: [],
        tooltip: {
            enabled: false
        },
        credits: {
            enabled: false
        }
    });

    $scope.DrawModal = function() {
        yMax = 200;
        xMax = 800;
        dY = yMax/($scope.nDof+1);
        dX = xMax/($scope.nDof+1);

        var canvas = document.getElementById('ModalCanvas');


        paper.setup(canvas);
        paper.project.clear();
        paper.project.activeLayer.removeChildren();

        ModalRefLine = [];
        ModalDOFs = [];
        for (j = 0; j < $scope.nDof; j++) {
        //Reference line
            ModalRefLine[j] = new paper.Path();
            ModalRefLine[j].strokeColor = 'black';
            ModalRefLine[j].strokeWidth = 5;
            ModalRefLine[j].add(new paper.Point((j+1)*dX,10));
            ModalRefLine[j].add(new paper.Point((j+1)*dX,yMax));
            text = new paper.PointText(new paper.Point((j+1)*dX,yMax+20));
            text.justification = 'center';
            text.content = 'Mode ' + (j+1);
            text.fontSize = 24;
            text.fillColor = $scope.ModalChart.series[j].color;
            text = new paper.PointText(new paper.Point((j+1)*dX,yMax+50));
            text.justification = 'center';
            text.content = Math.round($scope.w[j]*100)/100 + ' Rad/s';
            text.fontSize = 24;
            text.fillColor = $scope.ModalChart.series[j].color;

            DOFs = [];
            for (i = 0; i < $scope.nDof; i++) {
                DOFs[i] = new paper.Path.Circle(new paper.Point((j+1)*dX, yMax - (i + 1) * dY), 10);
                DOFs[i].fillColor = $scope.ModalChart.series[j].color;
            }
            ModalDOFs[j] = DOFs;
        }

        //Reference line
        xMid = xMax;
        var PhysRefLine = new paper.Path();
        PhysRefLine.strokeColor = 'black';
        PhysRefLine.strokeWidth = 5;
        PhysRefLine.add(new paper.Point(xMid,10));
        PhysRefLine.add(new paper.Point(xMid,yMax));
        text = new paper.PointText(new paper.Point((j+1)*dX,yMax+20));
        text.justification = 'center';
        text.content = 'Physical';
        text.fontSize = 24;

        PhysicalDOFs = [];
        for (i = 0; i < $scope.nDof; i++) {
            PhysicalDOFs[i] = new paper.Path.Circle(new paper.Point(xMid,yMax-(i+1)*dY) , 10);
            PhysicalDOFs[i].fillColor = $scope.PhysicalChart.series[i].color;

        }
    };


    $scope.UpdateModal = function(u, Eta) {
        yMax = 200;
        xMax = 800;

        dY = yMax/($scope.nDof+1);
        dX = xMax/($scope.nDof+1);
        for (j = 0; j < $scope.nDof; j++) {
            DOFs = ModalDOFs[j];
            um = numeric.dot(Eta[j],numeric.transpose($scope.Phi)[j]);
            for (i = 0; i < $scope.nDof; i++) {
                DOFs[i].position = new paper.Point((j+1)*dX + um[i] /$scope.U[j]* dX *.4, yMax - (i + 1) * dY)
            }
        }

        for (i = 0; i < $scope.nDof; i++) {
            PhysicalDOFs[i].position = new paper.Point( xMax + u[i]/$scope.UMax*dX *.4  ,yMax - (i+1)*dY)
        }
        paper.view.draw();
    };

    $scope.Restart = function() {
        var d = new Date();
        $scope.StartTime = d.getTime();

        $scope.CalculateProperties();
        $scope.DrawModal();
    };

    angular.element(document).ready( function() {
        $scope.Restart();
        $scope.int = $interval($scope.doUpdate, 5);
    });
}



app.controller('VibrationCtrl',VibrationCtrl);
