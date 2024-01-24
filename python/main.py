from argparse import ArgumentParser
from sys import argv
from typing import Dict

from pinger.cfg import loadConfigFile


def getCmdLine() -> Dict:
    parser = ArgumentParser(
        prog="Pinger", description="Check up on things.", epilog="A spidercensus joint"
    )
    parser.add_argument("-c", "--config-file", default="config.yaml")
    return parser.parse_args(argv[1:]).__dict__


if __name__ == "__main__":
    args = getCmdLine()
    config = loadConfigFile(args["config_file"])
    from pprint import pprint

    pprint(config)
