from fastapi.testclient import TestClient
from csci3363.app import app 

client = TestClient(app)

import pytest
from fastapi.testclient import TestClient
from csci3363.app import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def upload_movies():
    with open('tests/data/movies.csv', 'rb') as f:
        response = client.post("/upload", files={"file": f})
    assert response.status_code == 200
    return response
def test_average_worldwide_gross():
    response = client.post("/query-data-v2", json={"prompt": "What is the average worldwide gross for the movies?"})
    assert response.status_code == 200
    assert response.json().get('text') is not None, "Average worldwide gross should not be None"

def test_median_production_budget():
    response = client.post("/query-data-v2", json={"prompt": "What is the median production budget for the movies?"})
    assert response.status_code == 200
    assert response.json().get('text') is not None, "Median production budget should not be None"

def test_average_running_time():
    response = client.post("/query-data-v2", json={"prompt": "What is the average running time of the movies?"})
    assert response.status_code == 200
    assert response.json().get('text') is not None, "Average running time should not be None"

def test_median_imdb_rating_by_genre():
    response = client.post("/query-data-v2", json={"prompt": "What is the median IMDB rating for movies by genre?"})
    assert response.status_code == 200
    assert response.json().get('text') is not None, "Median IMDB rating by genre should not be None"

def test_average_budget_by_content_rating():
    response = client.post("/query-data-v2", json={"prompt": "What is the average production budget for movies in each content rating category?"})
    assert response.status_code == 200
    assert response.json().get('text') is not None, "Average production budget by content rating should not be None"

def test_scatterplot_budget_vs_gross():
    response = client.post("/query-data-v2", json={"prompt": "Generate a scatterplot of production budget vs worldwide gross, and provide a summary of the relationship between these two variables."})
    assert response.status_code == 200
    assert response.json().get('text') is not None, "Text for scatterplot of budget vs gross should not be None"
    assert response.json().get('vega') is not None, "Vega for scatterplot of budget vs gross should not be None"

def test_scatterplot_rt_vs_imdb():
    response = client.post("/query-data-v2", json={"prompt": "Create a scatterplot of Rotten Tomatoes rating vs IMDB rating, and provide summary statistics showing their correlation."})
    assert response.status_code == 200
    assert response.json().get('text') is not None, "Text for scatterplot of Rotten Tomatoes vs IMDB should not be None"
    assert response.json().get('vega') is not None, "Vega for scatterplot of Rotten Tomatoes vs IMDB should not be None"

def test_bar_chart_avg_imdb_by_genre():
    response = client.post("/query-data-v2", json={"prompt": "Create a bar chart comparing the average IMDB rating across different genres, and provide the numerical averages."})
    assert response.status_code == 200
    assert response.json().get('text') is not None, "Text for bar chart of average IMDB rating by genre should not be None"
    assert response.json().get('vega') is not None, "Vega for bar chart of average IMDB rating by genre should not be None"

def test_histogram_gross_distribution():
    response = client.post("/query-data-v2", json={"prompt": "Create a histogram plot showing the distribution of gross, and provide the median and range of the gross values."})
    assert response.status_code == 200
    assert response.json().get('text') is not None, "Text for histogram of gross distribution should not be None"
    assert response.json().get('vega') is not None, "Vega for histogram of gross distribution should not be None"

def test_histogram_movie_budgets():
    response = client.post("/query-data-v2", json={"prompt": "Create a histogram of the movie budgets, and provide the average and median budget."})
    assert response.status_code == 200
    assert response.json().get('text') is not None, "Text for histogram of movie budgets should not be None"
    assert response.json().get('vega') is not None, "Vega for histogram of movie budgets should not be None"
