import JobsStrings from '~features/output/jobs.strings';
import IndexController from '~features/output/index.controller';
import atLibModels from '~models';
import atLibComponents from '~components';

import JobsStrings from '~features/output/jobs.strings';
import IndexController from '~features/output/index.controller';

const indexTemplate = require('~features/output/index.view.html');

const MODULE_NAME = 'at.features.output';

function resolveResource (Job, ProjectUpdate, AdHocCommand, SystemJob, WorkflowJob, $stateParams) {
    const { id } = $stateParams;
    const { type } = $stateParams;

    let Resource;
    let related = 'events';

    switch (type) {
        case 'project':
            Resource = ProjectUpdate;
            break;
        case 'playbook':
            Resource = Job;
            related = 'job_events';
            break;
        case 'command':
            Resource = AdHocCommand;
            break;
        case 'system':
            Resource = SystemJob;
            break;
        case 'workflow':
            Resource = WorkflowJob;
            break;
        default:
            // Redirect
            return null;
    }

    return new Resource('get', id)
        .then(resource => resource.extend(related, {
            pageCache: true,
            pageLimit: 3,
            params: {
                page_size: 100,
                order_by: 'start_line'
            }
        }))
        .catch(err => {
            console.error(err);
        });
}

function resolveWebSocket (SocketService, $stateParams) {
    const prefix = 'ws';
    const { id } = $stateParams;
    const { type } = $stateParams;

    let name;

    switch (type) {
        case 'playbook':
            name = 'job_events';
            break;
        default:
            name = 'events';
    }

    const state = {
        data: {
            socket: {
                groups: {
                    jobs: ['status_changed', 'summary'],
                    [name]: []
                }
            }
        }
    };

    SocketService.addStateResolve(state, id);

    return `${prefix}-${name}-${id}`;
}

function resolveBreadcrumb (strings) {
    return {
        label: strings.get('state.TITLE')
    };
}

function JobsRun ($stateRegistry) {
    const state = {
        name: 'jobz',
        url: '/jobz/:type/:id',
        route: '/jobz/:type/:id',
        data: {
            activityStream: true,
            activityStreamTarget: 'jobs'
        },
        views: {
            '@': {
                templateUrl: indexTemplate,
                controller: IndexController,
                controllerAs: 'vm'
            }
        },
        resolve: {
            resource: [
                'JobModel',
                'ProjectUpdateModel',
                'AdHocCommandModel',
                'SystemJobModel',
                'WorkflowJobModel',
                '$stateParams',
                resolveResource
            ],
            ncyBreadcrumb: [
                'JobsStrings',
                resolveBreadcrumb
            ],
            webSocketNamespace: [
                'SocketService',
                '$stateParams',
                resolveWebSocket
            ]
        },
    };

    $stateRegistry.register(state);
}

JobsRun.$inject = ['$stateRegistry'];

angular
    .module(MODULE_NAME, [
        atLibModels,
        atLibComponents
    ])
    .controller('indexController', IndexController)
    .service('JobsStrings', JobsStrings)
    .run(JobsRun);

export default MODULE_NAME;
