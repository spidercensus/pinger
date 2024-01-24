import logging

from typing import Dict
from yaml import load, Loader


def loadYaml(filename: str) -> Dict:
    data = {}
    try:
        with open(filename, 'r') as file:
            data = load(file, Loader)
    except Exception as e:
        logging.exception(f"Failed to load config file {filename}. Exception: {e}.\nStarting with empty config.")

    return data


def loadConfigFile(filename: str) -> Dict:
    content = loadYaml(filename)
    # Validate the config somehow.
    return content