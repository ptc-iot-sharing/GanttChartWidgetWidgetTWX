import { ThingworxRuntimeWidget, TWService, TWProperty } from 'typescriptwebpacksupport'
import Gantt from 'frappe-gantt';

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
        return `<div class="widget-content widget-ganttChart">
                    <div class="gantt_container" width="${widgetWidth}" height="${widgetHeight}"/>
                    <div class="view_ctrl_buttons" role="btn-group">
                        <button type="button">Quarter Day</button>
                        <button type="button">Half Day</button>
                        <button type="button">Day</button>
                        <button type="button">Week</button>
                        <button type="button">Month</button>
                    </div>
                </div>`;
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
        let data = [];
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            data.push({
                id: row[taskId],
                name: row[taskName],
                start: row[startDate],
                end: row[endDate],
                progress: row[completed],
                dependencies: row[relationships]
            });
        }

        let trackStyle = TW.getStyleFromStyleDefinition(this.getProperty('TrackStyle', 'DefaultGanttTrackStyle'));
        let altTrackStyle = TW.getStyleFromStyleDefinition(this.getProperty('AlternativeTrackStyle', 'DefaultAlternativeGanttTrackStyle'));
        let arrowStyle = TW.getStyleFromStyleDefinition(this.getProperty('ArrowStyle', 'DefaultGanttArrowStyle'));

        let trackFill = trackStyle.backgroundColor;
        let altTrackFill = altTrackStyle.backgroundColor;
        let arrowColor = arrowStyle.lineColor;
        let arrowWidth = arrowStyle.lineThickness;


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

        var gantt = new Gantt(this.jqElement.find(".gantt_container")[0], data,
            {
                header_height: 50,
                column_width: 30,
                step: 24,
                view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
                bar_height: barHeight,
                bar_corner_radius: this.getProperty('BarCornerRadius'),
                arrow_curve: this.getProperty("ArrowRadius"),
                padding: 18,
                view_mode: 'Day',
                date_format: 'YYYY-MM-DD',
                custom_popup_html: null
            });
        // add the current timestamp
        const x =
            (Date.now() - gantt.gantt_start.getTime()) / (1000 * 60 * 60 * gantt.options.step) * gantt.options.column_width;
        const y = 0;

        const width = 2;
        const height =
            (gantt.options.bar_height + gantt.options.padding) *
            gantt.tasks.length +
            gantt.options.header_height +
            gantt.options.padding / 2;
        const nowRect = document.createElementNS('http://www.w3.org/2000/svg', "rect");
        nowRect.setAttribute("x", Math.floor(x).toString());
        nowRect.setAttribute("y", y.toString());
        nowRect.setAttribute("class", "now-hightlight");
        nowRect.setAttribute("width", width.toString());
        nowRect.setAttribute("height", height.toString());
        gantt.layers.grid.appendChild(nowRect);

        this.jqElement.find(".view_ctrl_buttons").on("click", "button", function () {
            const $btn = $(this);
            var mode = $btn.text();
            gantt.change_view_mode(mode);
            $btn.parent().find('button').removeClass('active');
            $btn.addClass('active');
        });
    };

    handleRowSelection(selectedRowNo, propagateSelection?) {
        if (selectedRowNo !== undefined) {
            let selectedRows = [selectedRowNo];

            if (propagateSelection) {
                this.updateSelection('Data', selectedRows);
            }
            if (this._currentChart) {
                this._currentChart.setSelection([{ row: selectedRowNo }]);
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