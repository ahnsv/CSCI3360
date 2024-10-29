from fastapi.testclient import TestClient
import pytest
from csci3363.app import app

client = TestClient(app)

def upload_cars():
    with open('tests/data/cars.csv', 'rb') as f:
        response = client.post("/upload", files={"file": f})
    assert response.status_code == 200
    return response


@pytest.fixture
def upload_cars():
    with open('tests/data/cars.csv', 'rb') as f:
        response = client.post("/upload", files={"file": f})
    assert response.status_code == 200
    return response

def test_range_of_car_weights(upload_cars):
    response = client.post("/query-data-v2", json={"prompt": "What is the range of car weights in the dataset?"})
    assert response.status_code == 200
    assert response.json() is not None, "Range of car weights should not be None"

def test_median_mpg_us_cars(upload_cars):
    response = client.post("/query-data-v2", json={"prompt": "What is the median MPG for cars with origin in the US?"})
    assert response.status_code == 200
    assert response.json() is not None, "Median MPG for US cars should not be None"

def test_highest_horsepower(upload_cars):
    response = client.post("/query-data-v2", json={"prompt": "What is the highest horsepower recorded in the dataset?"})
    assert response.status_code == 200
    assert response.json() is not None, "Highest horsepower should not be None"

def test_average_mpg_by_origin(upload_cars):
    response = client.post("/query-data-v2", json={"prompt": "What is the average MPG for cars from each origin?"})
    assert response.status_code == 200
    assert response.json() is not None, "Average MPG by origin should not be None"

def test_average_mpg_high_horsepower(upload_cars):
    response = client.post("/query-data-v2", json={"prompt": "What is the average MPG for cars with high horsepower (greater than 150)?"})
    assert response.status_code == 200
    assert response.json() is not None, "Average MPG for high horsepower cars should not be None"

def test_bar_chart_cars_by_origin(upload_cars):
    response = client.post("/query-data-v2", json={"prompt": "Show a breakdown of cars by their origin, as a bar chart and a summary table."})
    assert response.status_code == 200
    assert response.json() is not None, "Bar chart and summary table of cars by origin should not be None"

def test_histogram_mpg_values(upload_cars):
    response = client.post("/query-data-v2", json={"prompt": "Provide a summary of miles per gallon (mpg) values for all cars, and visualize mpg as a histogram."})
    assert response.status_code == 200
    assert response.json() is not None, "Histogram of MPG values should not be None"

def test_bar_chart_avg_mpg_by_origin(upload_cars):
    response = client.post("/query-data-v2", json={"prompt": "Create a bar chart comparing the average mpg across different origins, and provide the numerical averages."})
    assert response.status_code == 200
    assert response.json() is not None, "Bar chart of average MPG by origin should not be None"

def test_scatterplot_weight_vs_acceleration(upload_cars):
    response = client.post("/query-data-v2", json={"prompt": "Generate a scatterplot of weight vs acceleration, and provide a summary of the relationship between these two variables."})
    assert response.status_code == 200
    assert response.json() is not None, "Scatterplot of weight vs acceleration should not be None"

def test_scatterplot_mpg_vs_horsepower(upload_cars):
    response = client.post("/query-data-v2", json={"prompt": "Create a scatterplot of mpg vs horsepower, and provide summary statistics showing their correlation."})
    assert response.status_code == 200
    assert response.json() is not None, "Scatterplot of MPG vs horsepower should not be None"
