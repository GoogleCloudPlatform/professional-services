#!/bin/sh
# ./run.sh org_id type
# eg ./run.sh org_id constraints
# eg ./run.sh org_id policies spec
# eg ./run.sh org_id all

# Check if jq is installed
if ! command -v jq > /dev/null; then
  # jq is not installed, install it
  if [[ $(uname -s) == "Linux" ]]; then
    # Linux installation command
    sudo apt-get install -y jq
  elif [[ $(uname -s) == "Darwin" ]]; then
    # macOS installation command
    brew install jq
  else
    # Unsupported operating system
    echo "Unsupported operating system. Please install jq manually and try again."
    exit 1
  fi
fi

if [ $2 == "constraints" ]; then
    array=($(ls -d */))
    # echo ${array[@]}  
    for value in ${array[@]}
    do
        cd $value
            content=($(ls -d */))
            for policy in ${content[@]} 
            do
            cd $policy
                files=($(ls))
                echo ${files[0]}
                #run constraint
                constraint=`cat ${files[0]}`
                echo "${constraint/"[ORGANIZATIONID]"/$1}"  > constraint.yaml
                gcloud org-policies set-custom-constraint constraint.yaml            
                rm constraint.yaml
            cd ..
            done

        cd ..

    done

elif [ $2 == "policies" ]; then
    array=($(ls -d */))
    # echo ${array[@]}  
    for value in ${array[@]}
    do
        cd $value
            content=($(ls -d */))
            for policy in ${content[@]} 
            do
            cd $policy
                files=($(ls))
                
                if [ ${#files[@]} == 2 ]; then #skip constraints that have no policy file
                    
                    if [ "$3" = "dryRunSpec" ]; then
                        #run policy file
                        policy_file=`cat ${files[1]}`
                        echo "${policy_file//"[ORGANIZATIONID]"/$1}"  > policy.json
                        # Read the JSON file into a variable
                        json=$(cat policy.json)
                        # Use jq to modify the JSON
                        json=$(echo $json | jq 'if has("spec") then .dryRunSpec = .spec | del(.spec) else . end')

                        # Write the modified JSON back to the file
                        echo $json > policy.json
                        gcloud org-policies set-policy policy.json --update-mask=*
                        rm policy.json
                    elif [ "$3" = "spec" ]; then
                        #run policy file
                        policy_file=`cat ${files[1]}`
                        echo "${policy_file//"[ORGANIZATIONID]"/$1}"  > policy.json
                        
                        # cat policy.json
                        gcloud org-policies set-policy policy.json --update-mask=*
                        rm policy.json

                    fi
                    
                fi
            cd ..
            done

        cd ..
    done

else
    array=($(ls -d */))
    # echo ${array[@]}  
    for value in ${array[@]}
    do
        cd $value
            content=($(ls -d */))
            for policy in ${content[@]} 
            do
            cd $policy
                files=($(ls))
                #apply constraint
                constraint=`cat ${files[0]}`
                echo "${constraint/"[ORGANIZATIONID]"/$1}"  > constraint.yaml
                gcloud org-policies set-custom-constraint constraint.yaml            
                rm constraint.yaml
                if [ ${#files[@]} == 2 ]; then #skip constraints that have no policy file
                    #run policy file
                    policy_file=`cat ${files[1]}`
                    echo "${policy_file//"[ORGANIZATIONID]"/$1}"  > policy.json
                    cat policy.json
                    gcloud org-policies set-policy policy.json --update-mask=$3      
                    rm policy.json
                fi
            cd ..
            done

        cd ..
    done

fi

