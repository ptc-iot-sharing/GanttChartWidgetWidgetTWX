import { ThingworxRuntimeWidget, TWService, TWProperty } from 'typescriptwebpacksupport'
import { GoogleCharts } from 'google-charts';

@ThingworxRuntimeWidget
class GanttChartWidget extends TWRuntimeWidget {
    serviceInvoked() { };
    runtimeProperties() {
        return {
            'needsDataLoadingAndError': true,
            'supportsAutoResize': true
        };
    }

    _currentChart: any;

    renderHtml(): string {
        require("./styles/runtime.css");
        let widgetHeight, widgetWidth;
        if (this.getProperty('ResponsiveLayout')) {
            widgetWidth = '100%';
            widgetHeight = '100%';
        } else {
            widgetWidth = this.getProperty("Width");
            widgetHeight = this.getProperty("Height");
        }
        return '<div class="widget-content widget-ganttChart"><div id = "chart_div" width=' + widgetWidth + ' height=' + widgetHeight + '> </div></div>';
    };

    afterRender() {
    }

    updateProperty(info: TWUpdatePropertyInfo) {
        if (info.TargetProperty === "Data") {
            let rows = info.ActualDataRows;

            this.assignRowNumbers(rows);

            let taskName = this.getProperty('TaskName');
            let taskId = this.getProperty('TaskID');
            let startDate = this.getProperty('StartDate');
            let endDate = this.getProperty('EndDate');
            let resource = this.getProperty('Resource');
            let relationships = this.getProperty('Relationships');
            let duration = this.getProperty('Duration');
            let completed = this.getProperty('Completed');

            this.loadChart(rows, taskId, taskName, startDate, endDate, resource, relationships, duration, completed);

            let selectedRowIndices = info.SelectedRowIndices;

            if (selectedRowIndices !== undefined) {
                if (selectedRowIndices.length > 0) {
                    let selectedRows = new Array();
                    selectedRows.push(rows[selectedRowIndices[0]]);
                    setTimeout(() => {
                        this.handleSelectionUpdate("Data", selectedRows, selectedRowIndices);
                    }, 100);
                } else {
                    setTimeout(() => {
                        this.handleSelectionUpdate("Data", [], []);
                    }, 100);
                }
            } else {
                setTimeout(() => {
                    this.handleSelectionUpdate("Data", [], []);
                }, 100);
            }
        }
    }

    handleSelectionUpdate(propertyName, selectedRows, selectedRowsIndices) {
        if (propertyName == "Data") {
            let ignoreSelectionEvent = true;

            let nSelectedRows = selectedRows.length;

            if (nSelectedRows > 0) {
                for (let x = 0; x < nSelectedRows; x++) {
                    if (selectedRows[x]._isSelected === true) {
                        this.handleRowSelection(selectedRows[x]["_row_"], !ignoreSelectionEvent);
                        ignoreSelectionEvent = false;
                        break;
                    }
                }
            } else
                this.handleRowSelection(undefined);

            ignoreSelectionEvent = false;
        }
    }

    loadChart(rows, taskId, taskName, startDate, endDate, resource, relationships, duration, completed) {
        const drawChart = () =>  {
            let data = new GoogleCharts.api.visualization.DataTable();
            data.addColumn('string', 'Task ID');
            data.addColumn('string', 'Task Name');
            data.addColumn('string', 'Resource');
            data.addColumn('date', 'Start Date');
            data.addColumn('date', 'End Date');
            data.addColumn('number', 'Duration');
            data.addColumn('number', 'Percent Complete');
            data.addColumn('string', 'Dependencies');

            let trackStyle = TW.getStyleFromStyleDefinition(this.getProperty('TrackStyle', 'DefaultGanttTrackStyle'));
            let altTrackStyle = TW.getStyleFromStyleDefinition(this.getProperty('AlternativeTrackStyle', 'DefaultAlternativeGanttTrackStyle'));
            let arrowStyle = TW.getStyleFromStyleDefinition(this.getProperty('ArrowStyle', 'DefaultGanttArrowStyle'));

            let trackFill = trackStyle.backgroundColor;
            let altTrackFill = altTrackStyle.backgroundColor;
            let arrowColor = arrowStyle.lineColor;
            let arrowWidth = arrowStyle.lineThickness;

            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                let percentComplete = 0;

                if (row[completed]) {
                    percentComplete = 100;
                }
                data.addRows([
                    [row[taskId], row[taskName], row[resource],
                    new Date(row[startDate]), new Date(row[endDate]), row[duration], percentComplete, row[relationships]]
                ]);
            }
            let barHeight = this.getProperty('ItemHeight');
            let chartHeight = rows.length * barHeight + 50;
            let itemHeight = barHeight - 5;
            let cornerRadius = this.getProperty('BarCornerRadius');
            let percentEnabled = this.getProperty('ShowPercentCompletion');
            let arrowRadius = this.getProperty('ArrowRadius');
            let arrowAngle = this.getProperty('ArrowAngle');
            let options = {
                width: "100%",
                height: chartHeight,
                gantt: {
                    barHeight: itemHeight,
                    trackHeight: barHeight,
                    barCornerRadius: cornerRadius,
                    arrow: { angle: arrowAngle, length: 5, spaceAfter: 5, radius: arrowRadius, color: arrowColor, width: arrowWidth },
                    innerGridTrack: { fill: trackFill },
                    innerGridDarkTrack: { fill: altTrackFill },
                    percentEnabled: percentEnabled
                }
            };

            this._currentChart = new GoogleCharts.api.visualization.Gantt(document.getElementById('chart_div'));

            this._currentChart.draw(data, options);
            GoogleCharts.api.visualization.events.addListener(this._currentChart, 'select',  (e) => {
                let selection = this._currentChart.getSelection();
                if (selection[0] != undefined && selection[0] != null)
                    this.handleRowSelection(selection[0].row, true);
            });
        };
        GoogleCharts.load(drawChart, {
            'packages': ['gantt']
        });
    };

    handleRowSelection(selectedRowNo, propagateSelection?) {
        if (selectedRowNo !== undefined) {
            let selectedRows = [selectedRowNo];

            if (propagateSelection) {
                this.updateSelection('Data', selectedRows);
            }
            if (this._currentChart) {
                this._currentChart.setSelection([{row: selectedRowNo}]);
            }
        }
    }

    assignRowNumbers(rows) {
        for (const rowid in rows) {
            let row = rows[rowid];
            row["_row_"] = rowid;
        }
    };

    @TWService("TestService")
    testService(): void {
        alert("Called via binding");
    }

    beforeDestroy?(): void {
        // resetting current widget
    }
}