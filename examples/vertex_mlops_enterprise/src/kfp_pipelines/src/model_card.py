from kfp import dsl
from kfp.dsl import Input, Output, Dataset, Artifact, HTML

from config import IMAGE_MODEL_CARD


@dsl.component(base_image=IMAGE_MODEL_CARD)
def plot_model_card(
    project_id: str,
    region: str,
    model: Input[Artifact],
    train_data: Input[Dataset],
    test_data: Input[Dataset],
    val_data: Input[Dataset],
    stats: Input[Artifact],
    reports: Input[Artifact],
    model_card_config: str,
    model_card: Output[HTML]
):

    # Libraries
    import json
    import pickle as pkl
    import model_card_toolkit as mctlib
    import pandas as pd
    import logging
    from google.cloud import aiplatform

    # Load model card config
    model_card_cd = json.loads(model_card_config)

    # Read data
    print(f"Reading data... {train_data.path}")
    train = pd.read_csv(train_data.path)
    test = pd.read_csv(test_data.path)
    val = pd.read_csv(val_data.path)
    
    # Read stats
    logging.info(f"Reading stats... {stats.path}")
    with open(stats.path, "rb") as stats_file:
        stats = pkl.load(stats_file)
    
    # Read reports
    logging.info(f"Reading reports... {reports.path}")
    with open(reports.path, "rb") as f:
        reports = pkl.load(f)
    
    # Compile model card
    logging.info(f"Compiling model card... {model_card.path}")
    mct = mctlib.ModelCardToolkit(model_card.path)
    mc = mct.scaffold_assets()

    ## Model Details section
    uri = model.metadata['resourceName']
    if uri.find('@') >= 0: # has version or alias
        model_resource_name = uri[:uri.find('@')] # strip version or alias
        model_version = uri[uri.find('@')+1:]
    else:
        model_resource_name = uri
        model_version = None

    vertex_models = [m for m in aiplatform.Model.list(project=project_id, location=region) if m.resource_name==model_resource_name]

    if model_version:
        models = [m for m in vertex_models if m.version_id == model_version]
        if len(models)>1:
            logging.warning(f"Found {len(models)} models with for {uri}")
        vertex_model = models[0]
    else:
        if len(vertex_models)>1:
            logging.warning(f"Found {len(vertex_models)} models with for {uri}")
        vertex_model = vertex_models[0]

    mc.model_details.name = model_card_cd['model_name']
    mc.model_details.overview = model_card_cd['model_overview']
    mc.model_details.owners = [
        mctlib.Owner(name=owner_d['name'], contact=owner_d['contact'])
        for owner_d in model_card_cd['model_owners']]
    mc.model_details.references = [
        mctlib.Reference(reference=reference)
        for reference in model_card_cd['model_references']]

    mc.model_details.version.name = vertex_model.resource_name
    mc.model_details.version.date = vertex_model.create_time.strftime("%H:%M:%S (%Z), %-d %b %Y")

    ## Considerations section
    mc.considerations.ethical_considerations = [
        mctlib.Risk(
            name=risk['name'], 
            mitigation_strategy=risk['mitigation_strategy']) 
        for risk in model_card_cd['model_ethical_consideration_risks']]
    mc.considerations.limitations = [
        mctlib.Limitation(description=limitation['description'])
        for limitation in model_card_cd['model_ethical_limitations']
    ]
    mc.considerations.use_cases = [
        mctlib.UseCase(description=use_case['description']) 
        for use_case in model_card_cd['model_considerations_use_cases']]
    mc.considerations.users = [
        mctlib.User(description=user['description'])
        for user in model_card_cd['model_considerations_users']]

    ## Datasets section
    mc.model_parameters.data.append(mctlib.Dataset(
        name="Training dataset",
        description=f'{train.shape[0]:,} rows with {train.shape[1]:,} columns (features + target)'))
    mc.model_parameters.data[0].graphics.collection = [
        mctlib.Graphic(image=stats['train'])
    ]
    mc.model_parameters.data.append(mctlib.Dataset(
        name="Test dataset",
        description=f'{test.shape[0]:,} rows with {test.shape[1]:,} columns (features + target)'))
    mc.model_parameters.data[1].graphics.collection = [
        mctlib.Graphic(image=stats['test'])
    ]
    mc.model_parameters.data.append(mctlib.Dataset(
        name="Validation dataset",
        description=f'{val.shape[0]:,} rows with {val.shape[1]:,} columns (features + target)'))
    mc.model_parameters.data[2].graphics.collection = [
        mctlib.Graphic(image=stats['val'])
    ]

    ## Quantative Analysis section
    mc.quantitative_analysis.graphics.description = (
        'This analysis is performed using the validation dataset, which was not used in training.')
    mc.quantitative_analysis.graphics.collection = [
        mctlib.Graphic(image=reports['roc_curve']),
        mctlib.Graphic(image=reports['precision_recall']),
        mctlib.Graphic(image=reports['confusion_matrix']),
        mctlib.Graphic(image=reports['shap_plot'])
    ]

    # Write model card
    model_card_file = model_card.path + "/model_card.html"
    logging.info(f"Writing model card... {model_card_file}")
    mct.update_model_card(mc)
    mct.export_format(model_card=mc, output_file=model_card_file)
    model_card.path = model_card_file
