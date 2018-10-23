// automatically import the css file
import { ThingworxComposerWidget } from 'typescriptwebpacksupport';

@ThingworxComposerWidget
class GanttChartWidget extends TWComposerWidget {

    widgetIconUrl(): string {
        return require('./images/icon.png');
    }

    widgetProperties(): TWWidgetProperties {
        require("./styles/ide.css");
        return {
            'name': 'Gantt Chart',
            'description': 'Displays a gantt chart of tasks and related durations',
            'category': ['Data'],
            'defaultBindingTargetProperty': 'Data',
            'supportsAutoResize': true,
            'properties': {
                'TaskName': {
                    'description': 'Field to use for task name',
                    'baseType': 'FIELDNAME',
                    'sourcePropertyName': 'Data'
                },
                'TaskID': {
                    'description': 'Field to use for task ID',
                    'baseType': 'FIELDNAME',
                    'sourcePropertyName': 'Data'
                },
                'StartDate': {
                    'description': 'Field to use for start date',
                    'baseType': 'FIELDNAME',
                    'sourcePropertyName': 'Data'
                },
                'EndDate': {
                    'description': 'Field to use for end date',
                    'baseType': 'FIELDNAME',
                    'sourcePropertyName': 'Data'
                },
                'Completed': {
                    'description': 'Field to use to indicate if task is completed',
                    'baseType': 'FIELDNAME',
                    'sourcePropertyName': 'Data'
                },
                'Relationships': {
                    'description': 'Field to use to indicate relationships of tasks. Comma separated TaskIDs',
                    'baseType': 'FIELDNAME',
                    'sourcePropertyName': 'Data'
                },
                'TooltipField1': {
                    'description': 'Field which will provide 1st tooltip data',
                    'isBindingTarget': true,
                    'isVisible': true,
                    'isEditable': true,
                    'sourcePropertyName': 'Data',
                    'baseType': 'FIELDNAME'
                },
                'TooltipField2': {
                    'description': 'Field which will provide 2nd tooltip data',
                    'isBindingTarget': true,
                    'isVisible': true,
                    'isEditable': true,
                    'sourcePropertyName': 'Data',
                    'baseType': 'FIELDNAME'
                },
                'TooltipField3': {
                    'description': 'Field which will provide 3rd tooltip data',
                    'isBindingTarget': true,
                    'isVisible': true,
                    'isEditable': true,
                    'sourcePropertyName': 'Data',
                    'baseType': 'FIELDNAME'
                },
                'Data': {
                    'description': 'Data source',
                    'isBindingTarget': true,
                    'isEditable': false,
                    'baseType': 'INFOTABLE',
                    'warnIfNotBoundAsTarget': true
                },
                'ItemHeight': {
                    'description': 'Field to use for the element height',
                    'baseType': 'NUMBER',
                    'defaultValue': 23,
                    'isBindingTarget': false
                },
                'BarCornerRadius': {
                    'description': 'Field to use for the bar corner radius',
                    'baseType': 'NUMBER',
                    'defaultValue': 2,
                    'isBindingTarget': false
                },
                'ArrowRadius': {
                    'description': 'Field to use for the arrow radius',
                    'baseType': 'NUMBER',
                    'defaultValue': 5,
                    'isBindingTarget': false
                },
                'HeaderHeight': {
                    'description': 'How tall the header should be',
                    'baseType': 'NUMBER',
                    'defaultValue': 50,
                    'isBindingTarget': false
                },
                'ColumnWidth': {
                    'description': 'How big each column should be (distance between two dates)',
                    'baseType': 'NUMBER',
                    'defaultValue': 30,
                    'isBindingTarget': false
                },
                'ViewMode': {
                    'description': 'Granularity of the minimum interval displayed',
                    'baseType': 'STRING',
                    'defaultValue': 'Day',
                    'selectOptions': ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'].map((option) => {return {text: option, value: option}}),
                    'isBindingTarget': true,
                    'isBindingSource': true
                },
                'Padding': {
                    'description': 'Space between eleemnts',
                    'baseType': 'NUMBER',
                    'defaultValue': 18,
                    'isBindingTarget': false
                },
                'DateFormat': {
                    'description': 'How to format the dates in the widget',
                    'baseType': 'STRING',
                    'defaultValue': 'YYYY-MM-DD',
                    'isLocalizable': true
                },
                'AlwaysShowHandles': {
                    'description': 'Always show the handles for tasks. Especially useful for showing tasks over limit',
                    'baseType': 'BOOLEAN',
                    'defaultValue': false
                },
                'ShowBaselines': {
                    'description': 'For percentages > 100%, show the baseline underneath the values',
                    'baseType': 'BOOLEAN',
                    'defaultValue': false
                }
            }
        }
    };

    widgetServices(): Dictionary<TWWidgetService> {
        return {};
    };

    widgetEvents(): Dictionary<TWWidgetEvent> {
        return {
            'DoubleClicked': {
                'warnIfNotBound': false
            }
        };
    }

    renderHtml(): string {
        return '<div class="widget-content widget-ganttChart"><table height="100%" width="100%"><tr><td valign="middle" align="center"><span>Gantt Chart</span></td></tr></table></div>';
    };

    validate(): { severity: string, message: string }[] {
        const result = [];
        if (this.isPropertyBoundAsTarget('Data')) {
            if (this.getProperty('TaskID') === undefined || this.getProperty('TaskID').length === 0) {
                result.push({ severity: 'warning', message: 'TaskID for {target-id} must be chosen' });
            }
            if (this.getProperty('TaskName') === undefined || this.getProperty('TaskName').length === 0) {
                result.push({ severity: 'warning', message: 'TaskName for {target-id} must be chosen' });
            }
            if (this.getProperty('StartDate') === undefined || this.getProperty('StartDate').length === 0) {
                result.push({ severity: 'warning', message: 'StartDate for {target-id} must be chosen' });
            }
            if (this.getProperty('EndDate') === undefined || this.getProperty('EndDate').length === 0) {
                result.push({ severity: 'warning', message: 'EndDate for {target-id} must be chosen' });
            }
        }
        return result;
    }

    afterRender(): void {
    }

    beforeDestroy(): void {
    }

}