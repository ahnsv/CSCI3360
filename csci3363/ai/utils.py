# print msg in red, accept multiple strings like print statement
import json
import inspect
from functools import partial
from typing import Any, Callable

from openai import OpenAI


def print_red(*strings):
    print("\033[91m" + " ".join(strings) + "\033[0m")


# print msg in blue, , accept multiple strings like print statement
def print_blue(*strings):
    print("\033[94m" + " ".join(strings) + "\033[0m")


def truncate_string(s: str):
    return s


def query(client: OpenAI, question: str, system_prompt: str, tools: list[dict], tool_map: dict[str, Callable],
          max_iterations=10):
    messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": question}]
    response = None
    i = 0
    while i < max_iterations:
        i += 1
        print("iteration:", i)
        response = client.chat.completions.create(
            model="gpt-4o-mini", temperature=0.0, messages=messages, tools=tools,
            tool_choice="required",
            response_format={"type": "json_object"}
        )
        # print(response.choices[0].message)
        if response.choices[0].message.content is not None:
            print_red(response.choices[0].message.content)
        # print(response.choices[0].message)

        # if not function call
        if response.choices[0].message.tool_calls is None:
            break

        # if function call
        messages.append(response.choices[0].message)
        for tool_call in response.choices[0].message.tool_calls:
            print_blue("calling:", tool_call.function.name, "with", tool_call.function.arguments)
            # call the function
            arguments = json.loads(tool_call.function.arguments)
            function_to_call = tool_map[tool_call.function.name]
            result = function_to_call(**arguments)

            # create a message containing the result of the function call
            result_content = json.dumps({**arguments, "result": result})
            function_call_result_message = {
                "role": "tool",
                "content": result_content,
                "tool_call_id": tool_call.id,
            }
            print_blue("action result:", truncate_string(result_content))

            messages.append(function_call_result_message)
        if i == max_iterations and response.choices[0].message.tool_calls is not None:
            print_red("Max iterations reached")
            return "The tool agent could not complete the task in the given time. Please try again."

    return response.choices[0].message.content


def function_to_schema(func: Callable[..., Any]) -> dict:
    type_map = {
        str: "string",
        int: "integer",
        float: "number",
        bool: "boolean",
        list: "array",
        dict: "object",
        type(None): "null",
    }

    if isinstance(func, partial):
        original_func = func.func
        partial_args = func.keywords
    else:
        original_func = func
        partial_args = {}

    try:
        signature = inspect.signature(original_func)
    except ValueError as e:
        raise ValueError(
            f"Failed to get signature for function {original_func.__name__}: {str(e)}"
        )

    parameters = {}
    for param_name, param in signature.parameters.items():
        if param_name not in partial_args:
            try:
                param_type = type_map.get(param.annotation, "string")
            except KeyError as e:
                raise KeyError(
                    f"Unknown type annotation {param.annotation} for parameter {param.name}: {str(e)}"
                )
            parameters[param_name] = {"type": param_type}

    required = [
        param_name
        for param_name, param in signature.parameters.items()
        if param.default == inspect._empty and param_name not in partial_args
    ]

    return {
        "type": "function",
        "function": {
            "name": original_func.__name__,
            "description": (original_func.__doc__ or "").strip(),
            "parameters": {
                "type": "object",
                "properties": parameters,
                "required": required,
            },
        },
    }
