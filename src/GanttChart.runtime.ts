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

    currentGanttChart: any;
    currentViewMode: string;

    @TWProperty("ViewMode")
    set viewMode(value) {
        if (value) {
            this.currentViewMode = value;
            this.currentGanttChart.change_view_mode(value);
        }
    }

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
        this.currentViewMode = this.getProperty("ViewMode");
        return `<div class="widget-content widget-ganttChart">
                    <div class="gantt_container" width="${widgetWidth}" height="${widgetHeight}"/>
                </div>`;
    };

    afterRender() {
    }

    updateProperty(info: TWUpdatePropertyInfo) {
        if (info.TargetProperty === "Data") {
            let rows = info.ActualDataRows;

            this.loadChart(rows, this.getProperty('TaskID'), this.getProperty('TaskName'), this.getProperty('StartDate'),
                this.getProperty('EndDate'), this.getProperty('Relationships'), this.getProperty('Completed'));

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
            // TODO: implement selection
        }
    }

    loadChart(rows, taskId, taskName, startDate, endDate, relationships, completed) {
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

        this.currentGanttChart = new Gantt(this.jqElement.find(".gantt_container")[0], data,
            {
                header_height: this.getProperty('HeaderHeight'),
                column_width: this.getProperty('ColumnWidth'),
                view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
                bar_height: this.getProperty('ItemHeight'),
                bar_corner_radius: this.getProperty('BarCornerRadius'),
                arrow_curve: this.getProperty("ArrowRadius"),
                padding: this.getProperty('Padding'),
                view_mode: this.currentViewMode,
                date_format: TW.Runtime.convertLocalizableString(this.getProperty('DateFormat')),
                custom_popup_html: null,
                on_view_change: (mode) => {
                    this.currentViewMode = mode;
                    this.setProperty("ViewMode", mode);
                    if (this.currentGanttChart) {
                        this.drawNowBar(this.currentGanttChart);
                    }
                }
            });
        this.drawNowBar(this.currentGanttChart);
    };

    drawNowBar(gantt: any) {
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
    }
    beforeDestroy?(): void {
        // resetting current widget
    }
}