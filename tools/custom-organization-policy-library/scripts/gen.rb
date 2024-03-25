require 'csv'
require 'fileutils'
require 'yaml'

def generate_service_yaml_header(service)
    <<-YAML
#@ load("@ytt:overlay", "overlay")
\#@data/values-schema
---
\#@overlay/match missing_ok=True
#{service}:
    YAML
end


def generate_default_config_yaml_content(name, pci_dss, cis)
  # Construct the core data structure
    template = <<~YAML 
#{name}:
    \#@schema/validation one_of=["default", "skip", "include"]
    generation: "default"
    bundles:
      pci-dss: #{pci_dss}
      cis: #{cis}
YAML
end

# Function to generate the YAML content for the constraint
def generate_constraint_yaml_content(name, display_name, description, resource_types, method_types)
    method_type_str = method_types.map { |type| "- #{type}" }.join("\n")
    resource_types_str = resource_types.map { |type| "- #{type}" }.join("\n")

  <<-YAML
#@ load("/constraints.lib.star", "build_constraint")
#@ constraint = build_constraint("#{name}")

#@ if constraint.to_generate():
name: #@ constraint.constraint_name()
resource_types: 
#{resource_types_str} 
condition: 1 == 0
action_type: DENY
method_types: 
#{method_type_str} 
display_name: #{display_name}
description:  #{description}
#@ end
  YAML
end

services = [
    # "compute",
    # "dataproc",
    # "firewall",
    # "gcs",
    "gke",
    # "network"
]

settings = {
    "compute" => {
        "resource_types" => [
            "compute.googleapis.com/Disk",
            "compute.googleapis.com/Image",
            "compute.googleapis.com/Instance",
        ],
        "method_types" => [
            "CREATE",
        ]
    },
    "dataproc" => {
        "resource_types" => [
            "dataproc.googleapis.com/Cluster",
        ],
        "method_types" => [
            "CREATE",
            "UPDATE",
        ]
    },
    "firewall" => {
        "resource_types" => [
            "compute.googleapis.com/Firewall",
        ],
        "method_types" => [
            "CREATE",
        ]
    },
    "gcs"  => {
        "resource_types" => [
            "storage.googleapis.com/Bucket",
        ],
        "method_types" => [
            "CREATE",
            "UPDATE"
        ]
    },
    "gke" => {
        "resource_types" => [
            "container.googleapis.com/Cluster",
            "container.googleapis.com/NodePool",
        ],
        "method_types" => [
            "CREATE",
            "UPDATE"
        ]
    },
    "network"  => {
        "resource_types" => [
            "container.googleapis.com/Cluster",
            "container.googleapis.com/NodePool",
        ],
        "method_types" => [
            "CREATE",
            "UPDATE"
        ]
    },
}

# Generate constraint
services.each do |service| 
    csv_data = CSV.read("catalog/#{service}.csv", headers: true)
    csv_data.each do |row|
        name =  row['Name'].sub('custom.', '')
        display_name = row['Display Name']
        description = row['Description']

        # Generate the YAML content
        yaml_content = generate_constraint_yaml_content(name, display_name, description, settings[service]["resource_types"], settings[service]["method_types"])

        # Create the YAML file
        FileUtils.mkdir_p "output/#{service}"

        File.open("output/#{service}/#{name}.yaml", 'w') { |file| file.write(yaml_content) }
    end
end

# Generate default values

services.each do |service| 
    csv_data = CSV.read("catalog/#{service}.csv", headers: true)

    yaml_content = generate_service_yaml_header(service)
    csv_data.each do |row|
        name =  row['Name'].sub('custom.', '')
        pci_dss = !row['PCI-DSS Controls'].nil? && row['PCI-DSS Controls'].strip.length > 0
        cis = !row['CIS 1.5 Controls'].nil? && row['CIS 1.5 Controls'].strip.length > 0

        # Generate the YAML content
        yaml_content += "  " + generate_default_config_yaml_content(name, pci_dss, cis)

        # Create the YAML file
        FileUtils.mkdir_p "output/config//services"

        File.open("output/config/services/schema.#{service}.yaml", 'w') { |file| file.write(yaml_content) }
    end
end