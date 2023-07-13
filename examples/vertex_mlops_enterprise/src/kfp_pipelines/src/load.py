from kfp import dsl

from train import IMAGE

# Load data from BigQuery and save to CSV
@dsl.component(base_image=IMAGE)
def get_dataframe(
    project_id: str,
    bq_table: str,
    train_data: dsl.OutputPath("Dataset"),
    test_data: dsl.OutputPath("Dataset"),
    val_data: dsl.OutputPath("Dataset"),
    stats: dsl.Output[dsl.Artifact],
    class_names: list
):
    from google.cloud import bigquery
    from model_card_toolkit.utils.graphics import figure_to_base64str
    from sklearn.model_selection import train_test_split
    import pickle
    import seaborn as sns
    import logging

    bqclient = bigquery.Client(project=project_id)
    logging.info(f"Pulling data from {bq_table}")
    table = bigquery.TableReference.from_string(bq_table)
    rows = bqclient.list_rows(table)
    dataframe = rows.to_dataframe(create_bqstorage_client=True)
    # Drop the Time column, otherwise the model will just memorize when the fraud cases happened
    dataframe.drop(columns=['Time'], inplace=True) 
    logging.info("Data loaded, writing splits")

    # 60 / 20 / 20
    df_train, df_test = train_test_split(dataframe, test_size=0.4)
    df_test, df_val = train_test_split(df_test, test_size=0.5)

    df_train.to_csv(train_data, index=False)
    df_test.to_csv(test_data, index=False)
    df_val.to_csv(val_data, index=False)

    def get_fig(df, title):
        n_fraud = (df.Class == '1').sum()
        n_ok = len(df) - n_fraud

        logging.info(f"Stats for {title}: {n_ok=} {n_fraud=}")

        ys = [n_ok, n_fraud]

        g = sns.barplot(x=class_names, y=ys)
        g.set_yscale('log')
        g.set_ylim(1, n_ok*2)
        fig = g.get_figure()
        fig.suptitle(title)
        return fig

    logging.info("Generating stats")
    stats_dict = {} 
    fig = get_fig(df_train, "Training data")
    stats_dict['train'] = figure_to_base64str(fig)
    fig.clf()

    fig = get_fig(df_test, "Test data")
    stats_dict['test'] = figure_to_base64str(fig)
    fig.clf()
    
    fig = get_fig(df_val, "Validation data")
    stats_dict['val'] = figure_to_base64str(fig)
    fig.clf()
    
    logging.info(f"Writing stats to {stats.path}")
    with open(stats.path, 'wb') as f:
        pickle.dump(stats_dict, f)
