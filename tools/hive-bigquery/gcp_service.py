from abc import ABCMeta, abstractmethod


class GCPService:
    __metaclass__ = ABCMeta

    @abstractmethod
    def get_client(self): pass
