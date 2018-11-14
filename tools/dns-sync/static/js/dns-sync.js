// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//            http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

console.log("Starting.");
Vue.config.debug = true;

var Projects = {
    template: "#projects-template"
};

Vue.component("Zones", {
    template: "#zones-template",
    data: function() {
        return {
            "auditLogState": {},
            "zoneConfig": {},
            "projects": [],
            "projectZones": [],
            "availableZones": [],
            "newZoneName": "",
            "newZoneRegexp": ""
        };
    },
    beforeRouteEnter: function(to, from, next) {
        var data = {};

        function checkDoneLoading() {
            if ((data.zoneConfig != undefined) &&
                (data.auditLogState != undefined) &&
                (data.projects != undefined)) {
                next(function(vm) {
                    vm.getProjectZones(
                        data.zoneConfig.dns_project,
                        function() {
                            vm.$emit("loading", false);
                            copyLoadedData(vm);
                        });
                });
            }
        }

        function copyLoadedData(vm) {
            function assign(object, source) {
                Object.keys(source).forEach(function(key) {
                    Vue.set(object, key, source[key]);
                });
            }
            assign(vm.zoneConfig, data.zoneConfig);
            assign(vm.auditLogState, data.auditLogState);
            vm.projects = data.projects;
            vm.loadedData = data;
        }

        function handleError(error) {
            console.log(error);
            next(function(vm) {
                vm.$emit("loading", false);
                vm.$emit("error", "Unable to load page:" + error);
                next("/");
            });
        }

        axios.get("/get_audit_log_state")
            .then(function(response) {
                data.auditLogState = response.data;
                checkDoneLoading();
            }).catch(function(error) {
                handleError(error);
            });

        axios.get("/get_zone_config")
            .then(function(response) {
                data.zoneConfig = response.data;
                checkDoneLoading();
            }).catch(function(error) {
                handleError(error);
            });
        axios.get("/get_projects")
            .then(function(response) {
                data.projects = response.data;
                checkDoneLoading();
            }).catch(function(error) {
                handleError(error);
            });
    },

    methods: {

        getProjectZones: function(project, callback) {
            if (project && !(project in this.projectZones)) {
                this.$emit("loading", true);
                var self = this;
                axios.post("/get_project_zones", project)
                    .then(function(response) {
                        self.$emit("loading", false);
                        self.projectZones[project] = response.data;
                        self.availableZones = response.data;
                        if (callback) {
                            callback();
                        }
                    }).catch(function(error) {
                        self.$emit("loading", false);
                        self.$emit("error", "Unable to load page:" + error);
                    });
            } else {
                this.availableZones = this.projectZones[project];
                if (callback) {
                    callback();
                }
            }
        },

        addZoneMapping: function() {
            if (!this.zoneConfig.regular_expression_zone_mapping) {
                this.zoneConfig.regular_expression_zone_mapping = [];
            }
            this.zoneConfig.regular_expression_zone_mapping.push([
                "", ""
            ]);
        },

        save: function() {
            this.$emit("loading", true);
            var self = this;
            axios.post("/set_zone_config", this.zoneConfig)
                .then(function(response) {
                    self.$emit("loading", false);
                })
                .catch(function(error) {
                    console.log(error);
                    self.$emit("loading", false);
                    self.$emit("error", "Unable to save:" + error);
                });

        }
    }
});

var Home = {
    template: "#home-template",
    methods: {
        nowLoading: function() {
            this.$emit("loading", true);
        }
    }
};

var router = new VueRouter({
    routes: [{
        path: "/",
        component: Home
    }, {
        path: "/projects",
        component: Projects
    }, {
        path: "/zones",
        component: Vue.component("Zones")
    }, {
        path: "/home",
        component: Home
    }]
});

var app = new Vue({
    template: "#app-template",
    router: router,
    data: {
        errorMessage: "",
        showLoading: false
    },
    methods: {

        nowLoading: function(showLoading) {
            this.loading(true);
        },

        endLoading: function(showLoading) {
            this.loading(false);
        },

        error: function(errorMessage) {
            this.errorMessage = errorMessage;
        },

        loading: function(showLoading) {
            if (showLoading) {
                this.errorMessage = "";
            }
            this.showLoading = showLoading;
        }
    }
}).$mount("#app");
