from kfp import dsl
from kfp.dsl import Input, Output, Dataset, Artifact, HTML
from train import IMAGE

@dsl.component(base_image=IMAGE)
def plot_model_card(
    train_data: Input[Dataset],
    test_data: Input[Dataset],
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

    # Load model card config
    model_card_cd = json.loads(model_card_config)

    # TODO add html extension?
    #model_card_filepath = os.path.join(model_card_path, "model_card.html")

    # Read data
    print(f"Reading data... {train_data.path}")
    train = pd.read_csv(train_data.path)
    test = pd.read_csv(test_data.path)
    
    # with open(train_data.path, "rb") as train_file:
    #     train = pkl.load(train_file)
    # with open(test_data.path, "rb") as test_file:
    #     test = pkl.load(test_file)

    # Read stats
    print(f"Reading stats... {stats.path}")
    with open(stats.path, "rb") as stats_file:
        stats = pkl.load(stats_file)
    
    # Read reports
    print(f"Reading reports... {reports.path}")
    with open(reports.path, "rb") as f:
        reports = pkl.load(f)
    
    # Compile model cards
    print(f"Compiling model card... {model_card.path}")
    mct = mctlib.ModelCardToolkit(model_card.path)
    mc = mct.scaffold_assets()
    mc.model_details.name = model_card_cd['model_name']
    mc.model_details.overview = model_card_cd['model_overview']
    mc.model_details.owners = [
        mctlib.Owner(name=owner_d['name'], contact=owner_d['contact'])
        for owner_d in model_card_cd['model_owners']]
    mc.model_details.references = [
        mctlib.Reference(reference=reference)
        for reference in model_card_cd['model_references']]
    mc.model_details.version.name = model_card_cd['model_version_name']
    mc.model_details.version.date = model_card_cd['model_version_date']
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

    mc.model_parameters.data.append(mctlib.Dataset())
    mc.model_parameters.data[0].graphics.description = (
        f'{train.shape[0]} rows with {train.shape[1]} features')
    mc.model_parameters.data[0].graphics.collection = [
        mctlib.Graphic(image=stats['train'])
    ]
    mc.model_parameters.data.append(mctlib.Dataset())
    mc.model_parameters.data[1].graphics.description = (
        f'{test.shape[0]} rows with {test.shape[1]} features')
    mc.model_parameters.data[1].graphics.collection = [
        mctlib.Graphic(image=stats['val'])
    ]
    mc.quantitative_analysis.graphics.description = (
        'ROC curve, Precision & Recall, Confusion Matrix and SHAP values')
    mc.quantitative_analysis.graphics.collection = [
        mctlib.Graphic(image=reports['roc_curve']),
        mctlib.Graphic(image=reports['precision_recall']),
        mctlib.Graphic(image=reports['confusion_matrix']),
        mctlib.Graphic(image=reports['shap_plot'])
    ]

    # Write model card
    model_card_file = model_card.path + "/model_card.html"
    print(f"Writing model card... {model_card_file}")
    mct.update_model_card(mc)
    mct.export_format(model_card=mc, output_file=model_card_file)
    model_card.path = model_card_file
