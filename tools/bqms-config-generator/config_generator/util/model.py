# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.

""" Class declaration for object name mapping """
import json
from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class Source:
    type: str = ''
    database: str = ''
    schema: str = ''
    relation: str = ''
    attribute: str = ''

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if v}


@dataclass
class Target:
    database: str = ''
    schema: str = ''
    relation: str = ''
    attribute: str = ''

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if v}


@dataclass
class NameMapItem:
    source: Source
    target: Target

    def to_dict(self) -> Dict[str, Any]:
        return {
            'source': self.source.to_dict(),
            'target': self.target.to_dict()
        }


@dataclass
class NameMap:
    name_map: List[NameMapItem] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {'name_map': [nm.to_dict() for nm in self.name_map]}

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=4)
