import os
from typing import Any

import pandas as pd
import pandasql as psql
import json

from openai import OpenAI


# Function to execute SQL query on in-memory datastore
def execute_sql_query(sql_query: str, data: list) -> list[dict[str, Any]]:
    df = pd.DataFrame(data)
    result_df = psql.sqldf(sql_query, locals())
    return result_df.to_dict(orient='records')


# Function to visualize the result using Vega
def visualize_result_in_vega(client: OpenAI, question: str, result_data: str) -> dict:
    """
    Function to visualize the result using Vega
    :param client: OpenAI client
    :param question: User question
    :param result_data: queried data (json dump)
    :return: Visualization of the result (vega-lite specification)
    """

    # Load the queried data
    result_data_serialized = json.loads(result_data)
    df = pd.DataFrame(result_data_serialized)
    columns = df.columns
    types = df.dtypes.apply(lambda x: str(x)).to_dict()
    sample = df.head(10).to_dict(orient="records")

    analyze_sys_prompt = open('csci3363/prompts/analyze.txt').read()
    analyze_sys_prompt = analyze_sys_prompt % (columns, types, sample)
    result = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": analyze_sys_prompt
            },
            {
                "role": "user",
                "content": question
            }
        ],
        response_format={"type": "json_object"}
    )
    return result.to_dict()
