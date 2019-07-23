import logging

import bigquery_label_updater
import bigtable_label_updater
import compute_engine_label_updater
import project_label_updater
import storage_label_updater


class resource_label_updater():

    @staticmethod
    def update_resource(p_resource_type, p_param):
        config_file = p_param['config_file']
        projectid = p_param['projectid']
        resourceid = p_param['resourceid']
        sub_resource_id = p_param['sub_resource_id']
        zone = p_param['zone']
        tags = p_param['tags']
        sub_resource_type = p_param['sub_resource_type']

        try:
            logging.info("Updating " + p_resource_type)
            if p_resource_type == 'project':
                project_label_updater.project_label_updater(config_file, projectid, tags)

            elif p_resource_type == 'compute engine':
                compute_engine_label_updater.gce_label_updater(config_file, projectid, resourceid, zone, tags)

            elif p_resource_type == 'storage':
                storage_label_updater.storage_label_updater(resourceid, tags)

            elif p_resource_type == 'bigtable':
                bigtable_label_updater.bigtable_label_updater(projectid, resourceid, tags)

            elif p_resource_type == 'bigquery' and (sub_resource_type == 'table' or sub_resource_type == 'view'):
                bigquery_label_updater.bigquery_table_label_updater(config_file, projectid, resourceid, sub_resource_id,
                                                                    tags)

            elif p_resource_type == 'bigquery' and sub_resource_type == '_NULL_':
                bigquery_label_updater.bigquery_label_updater(config_file, projectid, resourceid, tags)

            logging.info(p_resource_type + " Updated Successfully")

        except Exception as inst:
            logging.error(inst)
            err_msg = str(p_resource_type) + "|" + str(projectid) + "|" + str(resourceid) + "|" + str(zone) + "|" \
                      + str(tags) + "|" + str(inst) + '| Unable to update the ' +  p_resource_type + ' Labels: ' \
                      + resourceid + "\n"
            raise Exception(err_msg)
