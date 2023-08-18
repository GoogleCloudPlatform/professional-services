for FILE in build/*.yaml; 
do echo $FILE; 
cp $FILE $FILE.TEMPLATE
sed -i.bak s/cxt2-creditcards-/PROJECT_ID-/g $FILE.TEMPLATE
sed -i.bak s/javiergp/GITHUB_ORG/g $FILE.TEMPLATE
sed -i.bak s/mlops-cc-t1/GITHUB_REPO/g $FILE.TEMPLATE
done

for FILE in .github/workflows/*.yml; 
do echo $FILE; 
cp $FILE $FILE.TEMPLATE
sed -i 's/^  ENVIRONMENT:.*/  ENVIRONMENT: ${environment}/' $FILE.TEMPLATE
sed -i 's/^  PROJECT_ID:.*/  PROJECT_ID: ${project_id}/' $FILE.TEMPLATE
sed -i 's/^  SERVICE_ACCOUNT:.*/  SERVICE_ACCOUNT: ${sa}/' $FILE.TEMPLATE
sed -i 's/^  DOCKER_REPO:.*/  DOCKER_REPO: ${docker_repo}/' $FILE.TEMPLATE
sed -i 's/^  WORKLOAD_ID_PROVIDER:.*/  WORKLOAD_ID_PROVIDER: ${wip}/' $FILE.TEMPLATE
done




ENVS=(01-dev 02-staging 03-prod)
for i in "${ENVS[@]}"
do
   FILE="terraform/${i}/terraform.tfvars"
   echo $FILE
   cp $FILE $FILE.sample
   sed -i.bak s/cxt2-creditcards-/PROJECT_ID-/g $FILE.sample
   sed -i.bak s/javiergp/GITHUB_ORG/g $FILE.sample
   sed -i.bak s/mlops-cc-t2/GITHUB_REPO/g $FILE.sample
   sed -i.bak s/cxb.pugacorp.com/example.com/g $FILE.sample
   sed -i.bak s/jgpugacxb/notebook1/g $FILE.sample
   sed -i.bak s/jgpuga@/user@/g $FILE.sample
   sed -i.bak s/0189FA-E139FD-136A58/000000-111111-222222/g $FILE.sample
   sed -i.bak s/293566605905/123456789012/g $FILE.sample
   sed -i.bak s/448951750066/123456789012/g $FILE.sample
   sed -i.bak s/mlops2/myprefix/g $FILE.sample
   sed -i.bak s/pcorp-sec-core/CMEK_PROJECT_ID/g $FILE.sample
done

