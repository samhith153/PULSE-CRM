import os
import pandas as pd


def save_feature_vectors(df):

    output_dir = os.path.join("ai", "mock_data")

    csv_path = os.path.join(output_dir, "feature_vectors.csv")
    json_path = os.path.join(output_dir, "feature_vectors.json")

    df.to_csv(csv_path, index=False)

    df.to_json(
        json_path,
        orient="records",
        indent=4
    )

    print("Feature vectors saved successfully.")