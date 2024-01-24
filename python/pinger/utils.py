import ipaddress
import logging
import re

from collections import namedtuple

CheckResult = namedtuple("CheckResult", ["protocol", "port", "success", "latency"])

# Define a regular expression pattern for FQDN validation
fqdn_pattern = re.compile(
    r"^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$"
)


class Check:
    def __init__(self, host: str, protocol: str, port: int = 0):
        self.host = host
        if not Check.is_valid_host(host):
            raise ValueError(f"Provided host {host} is not valid.")
        self.protocol = protocol
        if self.protocol not in self.__valid_checks:
            raise ValueError(f"Protocol {protocol} is not one of {self.__valid_checks}")
        if self.protocol in ("tcp", "udp"):
            if 1 < port and port < 65535:
                raise ValueError("Provided port must be between 1 and 65535")
        self.port = port

    __valid_checks = ("icmp", "tcp")

    @staticmethod
    def tcpCheck(host: str, port: int) -> CheckResult:
        logging.debug(f"tcpCheck({host}, {port})")

    @staticmethod
    def icmpCheck(host: str) -> CheckResult:
        logging.debug(f"icmpCheck({host})")

    @staticmethod
    def is_valid_host(host: str) -> bool:
        # First check if `host` is a valid IP address.
        try:
            ipaddress.ip_address(host)
            return True
        except ValueError:
            # If not an IP address, then check if `host` matches fqdn pattern.
            return bool(fqdn_pattern.match(host))

    def check(self) -> CheckResult:
        if self.protocol == "tcp":
            data = Check.tcpCheck(self.host, self.port)
        elif self.protocol == "icmp":
            data = Check.icmpCheck(self.host)
        return data
