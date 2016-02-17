var app = angular.module('app', []); // this creates a module

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


function VibrationCtrl($scope, $interval) {

    $scope.nDofRaw = 2;
    $scope.Mraw = '1,0,0,1';
    $scope.Kraw = '2,-1,-1,2';
    $scope.u0raw = '0,1';
    $scope.v0raw = '0,0';


    $scope.nDofRaw = 3;
    $scope.Mraw = '1,0,0,0,1,0,0,0,1';
    $scope.Kraw = '2,-1,0,-1, 2,-1,0,-1,2';
    $scope.u0raw = '0.5,0.5,0';
    $scope.v0raw = '0,0,0';

    $scope.CalculateProperties = function() {
        //$scope.nDof = $scope.M.length;
        $scope.nDof = $scope.nDofRaw;
        $scope.M = listToMatrix($scope.Mraw.split(","),$scope.nDof);
        $scope.K = listToMatrix($scope.Kraw.split(","),$scope.nDof);
        $scope.u0 = $scope.u0raw.split(",");
        $scope.v0 = $scope.v0raw.split(",");



        $scope.SetN();

        A = numeric.dot($scope.K,numeric.inv($scope.M));
        ev = numeric.eig(A);
        $scope.ws = ev.lambda.x;  //w^2
        $scope.w = numeric.sqrt($scope.ws).sort(); //w
        $scope.Phi = ev.E.x;
        //$scope.Phi = numeric.div($scope.Phi,maxArray($scope.Phi));

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
        console.log($scope.U)
    };

    $scope.SetN = function() {
        //Delete all series
        while ($scope.PhysicalChart.series.length > 0) {
            $scope.PhysicalChart.series[0].remove();
        }

        while ($scope.ModalChart.series.length > 0) {
            $scope.ModalChart.series[0].remove();
        }
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

        ModalRefLine = [];
        ModalDOFs = [];
        for (j = 0; j < $scope.nDof; j++) {
        //Reference line
            ModalRefLine[j] = new paper.Path();
            ModalRefLine[j].strokeColor = 'black';
            ModalRefLine[j].strokeWidth = 5;
            ModalRefLine[j].add(new paper.Point((j+1)*dX,0));
            ModalRefLine[j].add(new paper.Point((j+1)*dX,yMax));
            text = new paper.PointText(new paper.Point((j+1)*dX,yMax+20));
            text.justification = 'center';
            text.content = 'Mode ' + (j+1);
            text.fontSize = 24;
            text = new paper.PointText(new paper.Point((j+1)*dX,yMax+50));
            text.justification = 'center';
            text.content = Math.round($scope.w[j]*100)/100 + ' Rad/s';
            text.fontSize = 24;

            DOFs = [];
            for (i = 0; i < $scope.nDof; i++) {
                DOFs[i] = new paper.Path.Circle(new paper.Point((j+1)*dX, (i + 1) * dY), 10);
                DOFs[i].fillColor = '#FF0000';
            }
            ModalDOFs[j] = DOFs;
        }

        //Reference line
        xMid = xMax;
        var PhysRefLine = new paper.Path();
        PhysRefLine.strokeColor = 'black';
        PhysRefLine.strokeWidth = 5;
        PhysRefLine.add(new paper.Point(xMid,0));
        PhysRefLine.add(new paper.Point(xMid,yMax));
        text = new paper.PointText(new paper.Point((j+1)*dX,yMax+20));
        text.justification = 'center';
        text.content = 'Physical';
        text.fontSize = 24;

        PhysicalDOFs = [];
        for (i = 0; i < $scope.nDof; i++) {
            PhysicalDOFs[i] = new paper.Path.Circle(new paper.Point(xMid,(i+1)*dY) , 10);
            PhysicalDOFs[i].fillColor = '#0000FF';

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
                DOFs[i].position = new paper.Point((j+1)*dX + um[i] /0.5* dX * .4, (i + 1) * dY)

            }
        }

        for (i = 0; i < $scope.nDof; i++) {
            PhysicalDOFs[i].position = new paper.Point( xMax + u[i]/0.5*dX *.4  ,(i+1)*dY)
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