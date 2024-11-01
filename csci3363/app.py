import csv
import json
import os
from functools import partial
from typing import Optional

import pandas as pd
from io import StringIO

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from openai import OpenAI, BadRequestError
from pydantic import BaseModel, Field
from starlette import status
from starlette.responses import FileResponse, JSONResponse

from csci3363.ai.tools import execute_sql_query, visualize_result_in_vega
from csci3363.ai.utils import query, function_to_schema

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Mount the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to restrict allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load OpenAI API key from environment variable
client = OpenAI(
    # This is the default and can be omitted
    api_key=os.environ.get("OPENAI_API_KEY"),
    max_retries=3,
)


# Define request and response models
class QueryRequest(BaseModel):
    prompt: str


class QueryResponse(BaseModel):
    response: str


class QueryDataRequest(BaseModel):
    prompt: str


class QueryDataResponse(BaseModel):
    response: str


in_memory_datastore = []


# Endpoint to interact with OpenAI API via LangChain
@app.post("/query", response_model=QueryResponse)
async def query_openai(request: QueryRequest):
    try:
        # Set your OpenAI API key

        # Call the OpenAI API via LangChain
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "Whatever user says, the system should say BC sucks",
                },
                {
                    "role": "user",
                    "content": request.prompt,
                }
            ],
            model="gpt-3.5-turbo",
        )

        return QueryResponse(response=chat_completion.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Root endpoint
@app.get("/")
async def read_root():
    return FileResponse('static/index.html')


@app.post("/upload", response_model=QueryResponse)
async def upload_query(file: UploadFile = File(..., )):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File should be .csv")

    if file.size > 1 * 1024 * 1024:  # NOTE: hard limit 1MB
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail="File is too large (limit: 1MB)")

    # read file as bytes and decode bytes into text stream
    file_bytes = file.file.read()
    buffer = StringIO(file_bytes.decode('utf-8'))

    # process CSV
    csvReader = csv.DictReader(buffer)
    data = [row for row in csvReader]

    buffer.close()
    file.file.close()

    in_memory_datastore.clear()
    in_memory_datastore.extend(data)

    return JSONResponse(content={
        "message": "Memory updated"
    })


@app.get("/current-data")
async def get_current_data():
    if not in_memory_datastore:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data")
    return JSONResponse(in_memory_datastore[:10])


@app.post("/query-data", response_model=QueryDataResponse)
async def query_data(request: QueryDataRequest):
    if not in_memory_datastore:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data")

    df = pd.DataFrame(in_memory_datastore)
    columns = df.columns
    types = df.dtypes.apply(lambda x: str(x)).to_dict()
    sample = df.head(10).to_dict(orient="records")

    analyze_sys_prompt = open('csci3363/prompts/analyze.txt').read()
    analyze_sys_prompt = analyze_sys_prompt % (columns, types, sample)

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": analyze_sys_prompt,
                },
                {
                    "role": "user",
                    "content": request.prompt,
                }
            ],
            model="gpt-3.5-turbo",
            response_format={
                "type": "json_object"
            }
        )
    except BadRequestError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

    response_json = json.loads(chat_completion.choices[0].message.content)

    return JSONResponse({'response': response_json})


class QueryDataV2Response(BaseModel):
    text: str
    vega: Optional[dict] = Field(default=None)


@app.post("/query-data-v2", response_model=QueryDataV2Response)
async def query_data_v2(request: QueryDataRequest):
    if not in_memory_datastore:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data")

    df = pd.DataFrame(in_memory_datastore)
    columns = df.columns
    types = df.dtypes.apply(lambda x: str(x)).to_dict()
    sample = df.head(10).to_dict(orient="records")

    analyze_sys_prompt = open('csci3363/prompts/analyze_v2.txt').read()
    analyze_sys_prompt = analyze_sys_prompt % (columns, types, sample, request.prompt)

    execute_sql = partial(execute_sql_query, data=in_memory_datastore)
    visualize_result = partial(visualize_result_in_vega, client=client)

    tools = [function_to_schema(execute_sql), function_to_schema(visualize_result)]
    tool_map = {
        "execute_sql_query": execute_sql,
        "visualize_result_in_vega": visualize_result
    }
    result = query(client, request.prompt, analyze_sys_prompt, tools, tool_map, max_iterations=5)
    if not result:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No response from AI")

    try:
        json_result = json.loads(result)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid JSON response")

    return json_result


@app.post('/clear')
async def clear_data():
    in_memory_datastore.clear()
    return JSONResponse({'message': 'Memory cleared'})
