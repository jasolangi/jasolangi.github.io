function DistrictFinancialSummaryControllers($scope, $filter, ngTableParams,
                                             DistrictFinancialSummaryReport,ReportGeographicZonesByLevel ,GeographicZones,ReportGeographicLevels,ReportPeriodsByScheduleAndYear,ReportSchedules,ReportPrograms,ReportPeriods, OperationYears, SettingsByKey,localStorageService, $http, $routeParams, $location) {
    //to minimize and maximize the filter section
    var section = 1;
    $scope.showMessage = true;
    $scope.message = "Indicates a required field.";

    $scope.defaultFlag = true;
    // $scope.reporting = "quarterly";
    $scope.IndicatorProductsKey = "INDICATOR_PRODUCTS";

    SettingsByKey.get({key: $scope.IndicatorProductsKey},function (data){
        $scope.IndicatorProductsDescription = data.settings.value;
    });

    $scope.section = function (id) {
        section = id;
    };


    $scope.show = function (id) {
        return section == id;
    };
    $scope.filterGrid = function () {
        $scope.getPagedDataAsync(0, 0);
    };


    //filter form data section
    $scope.filterObject = {
        periodId :$scope.period,
        period : "",
        programId:$scope.program,
        program: "",
        scheduleId: $scope.schedule,
        schedule: "",
        year : "",
        zoneId : $scope.zone,
        zone:"" ,
        geographicLevelId: $scope.geographicLevel,
        geographicLevel:""
    };

    //filter form data section
    $scope.filterOptions = {
        period: $scope.filterObject.periodId,
        zone : $scope.filterObject.zoneId,
        filterText: "",
        useExternalFilter: false
    };

    $scope.years = [];
    OperationYears.get(function (data) {
        $scope.years = data.years;
        $scope.years.unshift('-- All Years --');
    });

    ReportPrograms.get(function(data){

        $scope.programs = data.programs;
        $scope.programs.unshift({'name':'-- Select a Program --','id':'All'});
    });

    GeographicZones.get(function(data) {
        $scope.zones = data.zones;
        $scope.zones.unshift({'name':'--Select a District--','id':'-1'});
    });

    ReportSchedules.get(function(data){
        $scope.schedules = data.schedules;
        $scope.schedules.unshift({'name':'-- Select a Schedule --', 'id':'-1'}) ;
    });

    $scope.ChangeSchedule = function(scheduleBy){

        if(scheduleBy == 'byYear'){

            ReportPeriodsByScheduleAndYear.get({scheduleId: $scope.filterObject.scheduleId, year: $scope.filterObject.year}, function(data){
                $scope.periods = data.periods;
                $scope.periods.unshift({'name':'-- Select a Period --','id':'0'});
            });

        }else{

            ReportPeriods.get({ scheduleId : $scope.filterObject.scheduleId },function(data) {
                $scope.periods = data.periods;
                $scope.periods.unshift({'name':'-- Select a Period --','id':'0'});

            });
        }
    };

  $scope.$watch('filterObject.zoneId', function(selection){

        if(selection !== undefined || selection === ""){
            $scope.filterObject.zoneId =  selection;
            $.each( $scope.zones,function( item,idx){
                if(idx.id == selection){
                    $scope.filterObject.zone = idx.name;
                }
            });
        }else{
            $scope.filterObject.zoneId = 0;
            $scope.filterObject.zone = "";
        }
        $scope.filterGrid();
    });


    $scope.$watch('filterObject.programId', function (selection) {
        if (selection !== undefined || selection === "") {
            $scope.filterObject.programId = selection;
            $.each($scope.programs, function (item, idx) {
                if (idx.id == selection) {
                    $scope.filterObject.program = idx.name;
                }
            });

        } else {
            $scope.filterObject.programId = 0;
            $scope.filterObject.program = "";
        }
        $scope.filterGrid();
    });

    $scope.$watch('filterObject.periodId', function (selection) {
        if (selection !== undefined || selection === "") {
            $scope.filterObject.periodId = selection;
            $.each($scope.periods, function (item, idx) {
                if (idx.id == selection) {
                    $scope.filterObject.period = idx.name;
                }
            });

        } else {
            $scope.filterObject.periodId = -1;
            $scope.filterObject.period ="";
        }

        $scope.filterGrid();
    });

    $scope.$watch('filterObject.scheduleId', function (selection) {
        if (selection !== undefined || selection === "") {
            $scope.filterObject.scheduleId = selection;
            $.each($scope.schedules , function (item, idx) {
                if (idx.id == selection) {
                    $scope.filterObject.schedule = idx.name;
                }
            });

        } else {
            $scope.filterObject.scheduleId = 0;
        }
        $scope.ChangeSchedule('');

    });
    $scope.$watch('filterObject.yearId', function (selection) {

        if (selection == "-- All Years --") {
            $scope.filterObject.yearId = -1;
        } else if (selection !== undefined || selection === "") {
            $scope.filterObject.year = selection;

        }     else{
            $scope.filterObject.year = 0;
        }


        if($scope.filterObject.yearId == -1 || $scope.filterObject.yearId === 0){

            $scope.ChangeSchedule('bySchedule');
        } else {

            $scope.ChangeSchedule('byYear');
        }
    });


    $scope.exportReport = function (type) {

        $scope.filterObject.pdformat = 1;
        var params = jQuery.param($scope.filterObject);
        var url = '/reports/download/district_financial_summary/' + type + '?' + params;


        window.open(url);

    };


    // the grid options
    $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        total: 0,           // length of data
        count: 10           // count per page
    });

    $scope.paramsChanged = function(params) {

        // slice array data on pages
        if($scope.data === undefined ){
            $scope.datarows = [];
            params.total = 0;
        }else{
            var data = $scope.data;
            var orderedData = params.filter ? $filter('filter')(data, params.filter) : data;
            orderedData = params.sorting ?  $filter('orderBy')(orderedData, params.orderBy()) : data;

            params.total = orderedData.length;
            $scope.datarows = orderedData.slice( (params.page - 1) * params.count,  params.page * params.count );
            var i = 0;
            var baseIndex = params.count * (params.page - 1) + 1;
            while(i < $scope.datarows.length){
                $scope.datarows[i].no = baseIndex + i;
                i++;
            }
        }
    };

    // watch for changes of parameters
    $scope.$watch('tableParams', $scope.paramsChanged , true);
    $scope.getPagedDataAsync = function (pageSize, page) {
        // Clear the results on the screen
        $scope.datarows = [];
        $scope.data = [];
        var params =  {
            "max" : 10000,
            "page" : 1
        };

        $.each($scope.filterObject, function(index, value) {
            if(value !== undefined)
                params[index] = value;
        });

        DistrictFinancialSummaryReport.get(params, function(data) {
            if(data.pages !== undefined && data.pages.rows !== undefined ){

                $scope.data = data.pages.rows;
                $scope.paramsChanged($scope.tableParams);
            }
        });
    };
    $scope.formatNumber = function (value, format) {
        return utils.formatNumber(value, format);
    };



}
