import { ThingworxRuntimeWidget, TWProperty } from 'typescriptwebpacksupport'
import Gantt from 'frappe-gantt';

@ThingworxRuntimeWidget
class GanttChartWidget extends TWRuntimeWidget {
    serviceInvoked() { };
    currentGanttChart: any;
    currentViewMode: string;
    elementStyleSheet: CSSStyleSheet;

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

    createRule(name,rules){
        if(!this.elementStyleSheet) {
            const style = document.createElement('style');
            style.type = 'text/css';
            document.getElementsByTagName('head')[0].appendChild(style);
            this.elementStyleSheet = style.sheet as CSSStyleSheet;
        }

        if(!this.elementStyleSheet || !this.elementStyleSheet.insertRule)
            this.elementStyleSheet.addRule(name, rules);
        else
            this.elementStyleSheet.insertRule(name+"{"+rules+"}",0);
    }

    afterRender() {
        if(this.getProperty("AlwaysShowHandles")) {
            this.createRule(".gantt_container .handle-group > rect", "opacity: 0.7; visibility: visible;");
        }
        if(this.getProperty("ShowBaselines")) {
            this.createRule('.gantt_container .bar-progress', 'transform: translateY(-5px);');
        }
    }

    updateProperty(info: TWUpdatePropertyInfo) {
        if (info.TargetProperty === "Data") {
            let rows = info.ActualDataRows;
            let tooltips: string[] = [];
            if (this.getProperty("TooltipField1")) {
                tooltips.push(this.getProperty("TooltipField1"));
            }
            if (this.getProperty("TooltipField2")) {
                tooltips.push(this.getProperty("TooltipField2"));
            }
            if (this.getProperty("TooltipField3")) {
                tooltips.push(this.getProperty("TooltipField3"));
            }
            this.loadChart(rows, this.getProperty('TaskID'), this.getProperty('TaskName'), this.getProperty('StartDate'),
                this.getProperty('EndDate'), this.getProperty('Relationships'), this.getProperty('Completed'), tooltips);
        }
    }

    handleSelectionUpdate(propertyName, selectedRows, selectedRowsIndices) {
        if (propertyName == "Data") {
            // TODO: implement selection
        }
    }

    loadChart(rows, taskId, taskName, startDate, endDate, relationships, completed, tooltips: string[]) {
        let data = [];
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            data.push({
                index: i,
                id: row[taskId],
                name: row[taskName],
                start: row[startDate],
                end: row[endDate],
                progress: row[completed],
                dependencies: row[relationships],
                parentObj: row
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
                custom_popup_html: (task) => {
                    const end_date = task._end.toLocaleDateString("en-US");
                    const contents = `${tooltips.map((tooltip) => {
                        return `<p><strong>${tooltip}</strong>: ${task.parentObj[tooltip]}</p>`
                    }).join("")}`;

                    const percentageReport = task.progress > 100 ? `100% Completed, ${task.progress -100}% overtime!`: `${task.progress} completed!`;
                    return `
                    <div class="gantt-details-container" style="width: 200px">
                        <div class="title">${task.name}</div>
                        <div class="subtitle">
                            ${contents}
                            <p>${task.progress > 100 ? 'Finished on: ' : 'Expected to finish by: '}${end_date}</p>
                            <p>${percentageReport}</p>
                        </div>
                    </div>
                    `;
                },
                on_view_change: (mode) => {
                    this.currentViewMode = mode;
                    this.setProperty("ViewMode", mode);
                    if (this.currentGanttChart) {
                        this.drawNowBar(this.currentGanttChart);
                    }
                },
                on_click: (task) => {
                    this.updateSelection('Data', [task.index]);
                },
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
        const nowRectTitle = document.createElementNS('http://www.w3.org/2000/svg', "title");
        nowRectTitle.innerHTML = `Now: ${new Date()}`;
        nowRect.appendChild(nowRectTitle);

        gantt.layers.grid.appendChild(nowRect);
    }
    beforeDestroy?(): void {
        // resetting current widget
    }
}